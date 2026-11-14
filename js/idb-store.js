/**
 * ═══════════════════════════════════════════════════════════
 * IDB STORE – IndexedDB-backed key/value store
 * Replaces the 5 MB localStorage ceiling with an
 * in-memory cache + debounced IndexedDB persistence.
 *
 * Design contract:
 *  • get()/has()/keys() are SYNCHRONOUS (served from memory).
 *  • set()/remove() update memory immediately and queue a write.
 *  • flush() guarantees the queue is on disk.
 *  • When IndexedDB is unavailable (Node tests, locked-down
 *    browsers) every call transparently falls back to
 *    localStorage, so no caller has to care.
 * ═══════════════════════════════════════════════════════════
 */

const IDBStore = (() => {
  const DB_NAME = 'ssinfotech_storage';
  const STORE_NAME = 'kv';
  const DB_VERSION = 1;

  const _supported = (typeof indexedDB !== 'undefined');
  const _mem = new Map();      // key -> string value
  const _dirty = new Map();    // key -> string | null (null = delete)

  let _db = null;
  let _opening = null;
  let _ready = false;
  let _failing = false;
  let _flushTimer = null;
  let _flushPromise = null;

  // ── capability probes ──────────────────────────────────────
  function available() {
    return _supported && !_failing;
  }

  function isReady() {
    return _ready && available() && !!_db;
  }

  // ── low level IndexedDB helpers ────────────────────────────
  function _openRequest() {
    return new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        reject(e);
        return;
      }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
      req.onblocked = () => reject(new Error('IndexedDB blocked by another tab'));
    });
  }

  function _readAllRows() {
    return new Promise((resolve, reject) => {
      if (!_db) return resolve([]);
      let tx;
      try {
        tx = _db.transaction(STORE_NAME, 'readonly');
      } catch (e) {
        return reject(e);
      }
      const store = tx.objectStore(STORE_NAME);
      const rows = [];
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          rows.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        }
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(rows);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function _commitBatch(batch) {
    return new Promise((resolve, reject) => {
      if (!_db) return reject(new Error('IndexedDB not open'));
      let tx;
      try {
        tx = _db.transaction(STORE_NAME, 'readwrite');
      } catch (e) {
        return reject(e);
      }
      const store = tx.objectStore(STORE_NAME);
      batch.forEach(([key, value]) => {
        if (value === null) store.delete(key);
        else store.put(value, key);
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function _writeFallback(batch) {
    batch.forEach(([key, value]) => {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch (e) {
        console.error('IDBStore fallback write failed for', key, e && e.message);
      }
    });
  }

  // ── lifecycle ──────────────────────────────────────────────
  async function init() {
    if (!_supported) {
      _ready = true;
      return false;
    }
    if (_ready) return available();
    if (_opening) return _opening;

    _opening = (async () => {
      try {
        _db = await _openRequest();
        const rows = await _readAllRows();
        rows.forEach(row => _mem.set(row.key, row.value));
        _ready = true;
        _failing = false;
        _bindUnloadFlush();
        return true;
      } catch (e) {
        console.warn('IndexedDB unavailable — falling back to localStorage:', e && e.message);
        _failing = true;
        _ready = true;
        _db = null;
        return false;
      }
    })();

    return _opening;
  }

  function _bindUnloadFlush() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    if (_bindUnloadFlush._bound) return;
    _bindUnloadFlush._bound = true;

    const flushNow = () => { flush(); };
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('beforeunload', flushNow);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushNow();
    });
  }

  // ── synchronous cache API ──────────────────────────────────
  function has(key) {
    return _mem.has(key);
  }

  function get(key) {
    return _mem.has(key) ? _mem.get(key) : null;
  }

  function keys() {
    return Array.from(_mem.keys());
  }

  function entries() {
    return Array.from(_mem.entries()).map(([key, value]) => ({ key, value }));
  }

  function set(key, value) {
    const str = String(value);
    _mem.set(key, str);

    if (!available()) {
      _writeFallback([[key, str]]);
      return true;
    }

    _dirty.set(key, str);
    _scheduleFlush();
    return true;
  }

  function remove(key) {
    _mem.delete(key);

    if (!available()) {
      _writeFallback([[key, null]]);
      return true;
    }

    _dirty.set(key, null);
    _scheduleFlush();
    return true;
  }

  // ── persistence ────────────────────────────────────────────
  function _scheduleFlush() {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = setTimeout(() => {
      _flushTimer = null;
      flush();
    }, 250);
  }

  async function flush() {
    // A write can be queued before init() finishes opening the database.
    // Wait for the open to settle so we never downgrade to localStorage.
    if (_supported && !_ready && _opening) {
      try { await _opening; } catch { /* handled in init */ }
    }

    if (!available() || !_db) {
      if (_dirty.size) {
        const batch = Array.from(_dirty.entries());
        _dirty.clear();
        _writeFallback(batch);
      }
      return false;
    }

    if (_flushPromise) {
      await _flushPromise;
    }

    if (_dirty.size === 0) return true;

    const batch = Array.from(_dirty.entries());
    _dirty.clear();

    _flushPromise = (async () => {
      try {
        await _commitBatch(batch);
        return true;
      } catch (e) {
        console.warn('IndexedDB write failed — preserving batch in localStorage:', e && e.message);
        _writeFallback(batch);
        // Re-queue so a later flush retries the IDB write
        batch.forEach(([key, value]) => {
          if (!_dirty.has(key)) _dirty.set(key, value);
        });
        return false;
      } finally {
        _flushPromise = null;
      }
    })();

    return _flushPromise;
  }

  // ── diagnostics ────────────────────────────────────────────
  function sizeBytes() {
    let total = 0;
    _mem.forEach((value, key) => {
      total += (key.length + value.length) * 2;
    });
    return total;
  }

  async function estimate() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        return {
          usage: est.usage || 0,
          quota: est.quota || 0,
          source: 'navigator.storage',
        };
      }
    } catch (e) {
      /* ignore */
    }
    const usage = sizeBytes();
    return {
      usage,
      quota: 0,
      source: 'memory',
    };
  }

  function clear() {
    const knownKeys = Array.from(_mem.keys());
    _mem.clear();
    _dirty.clear();
    if (available() && _db) {
      _commitBatch(knownKeys.map(key => [key, null])).catch(() => {});
    } else {
      _writeFallback(knownKeys.map(key => [key, null]));
    }
  }

  return {
    init,
    available,
    isReady,
    has,
    get,
    set,
    remove,
    keys,
    entries,
    flush,
    clear,
    sizeBytes,
    estimate,
    DB_NAME,
    STORE_NAME,
  };
})();
