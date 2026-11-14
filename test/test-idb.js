/**
 * ═══════════════════════════════════════════════════════════
 * STORAGE LAYER – Regression Tests (IndexedDB path)
 * Uses a minimal in-memory IndexedDB shim so the browser code
 * path is exercised under Node:
 *  • legacy localStorage → IndexedDB migration
 *  • CRUD through the DB cache
 *  • export / import round-trip
 *  • storage telemetry reporting IndexedDB
 * ═══════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ── tiny in-memory IndexedDB shim (only the API we use) ─────
function makeFakeIndexedDB() {
  const databases = new Map();

  function makeDB(record) {
    return {
      objectStoreNames: { contains: name => record.stores.has(name) },
      createObjectStore(name) {
        if (!record.stores.has(name)) record.stores.set(name, new Map());
        return { name };
      },
      transaction(name, _mode) {
        if (!record.stores.has(name)) {
          throw new Error(`No object store named ${name}`);
        }
        const tx = { oncomplete: null, onerror: null, onabort: null };
        const ops = [];

        const settle = () => {
          if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx });
        };

        const runNext = () => {
          if (!ops.length) return settle();
          const op = ops.shift();
          op(runNext);
        };

        const objectStore = () => ({
          openCursor() {
            const req = { onsuccess: null, onerror: null, result: null };
            ops.push(done => {
              const entries = Array.from(record.stores.get(name).entries());
              let i = 0;
              const step = () => {
                if (i >= entries.length) {
                  req.result = null;
                  if (req.onsuccess) req.onsuccess({ target: req });
                  done();
                  return;
                }
                const [key, value] = entries[i];
                req.result = {
                  key,
                  value,
                  continue: () => { i += 1; setTimeout(step, 0); },
                };
                if (req.onsuccess) req.onsuccess({ target: req });
              };
              setTimeout(step, 0);
            });
            return req;
          },
          put(value, key) {
            const req = { onsuccess: null, onerror: null };
            ops.push(done => {
              record.stores.get(name).set(key, value);
              if (req.onsuccess) req.onsuccess({ target: req });
              done();
            });
            return req;
          },
          delete(key) {
            const req = { onsuccess: null, onerror: null };
            ops.push(done => {
              record.stores.get(name).delete(key);
              if (req.onsuccess) req.onsuccess({ target: req });
              done();
            });
            return req;
          },
        });

        setTimeout(runNext, 0);
        return { objectStore, get oncomplete() { return tx.oncomplete; }, set oncomplete(fn) { tx.oncomplete = fn; } };
      },
    };
  }

  return {
    open(name, version) {
      const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, result: null };
      setTimeout(() => {
        let record = databases.get(name);
        const isNew = !record;
        if (!record) {
          record = { version: 0, stores: new Map() };
          databases.set(name, record);
        }

        const db = makeDB(record);
        req.result = db;

        if (isNew || version > record.version) {
          record.version = version;
          if (typeof req.onupgradeneeded === 'function') req.onupgradeneeded({ target: req });
        }
        if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
      }, 0);
      return req;
    },
    _databases: databases,
  };
}

// ── fake localStorage holding legacy data ──────────────────
const store = new Map();
global.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  get length() { return store.size; },
  key: i => Array.from(store.keys())[i] ?? null,
};
global.alert = () => {};

// ── load the browser modules into the Node global scope ────
global.indexedDB = makeFakeIndexedDB();

function loadGlobal(relativePath, exportName) {
  const file = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(file, 'utf8');
  // eslint-disable-next-line no-eval
  eval(`${source}\n;globalThis.${exportName} = ${exportName};`);
}

loadGlobal('js/idb-store.js', 'IDBStore');

const DB = require('../js/db.js');

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (actual === expected) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} — expected ${expected}, got ${actual}`); }
}

// ── seed legacy localStorage payloads ───────────────────────
const legacyClients = [
  { id: 'legacy-1', name: 'LEGACY CLIENT', pan: 'LEGAC0000L', ay: '2026-27', createdAt: 1, updatedAt: 1 },
];
store.set('ssinfotech_clients', JSON.stringify(legacyClients));
store.set('ssinfotech_slip_companies', JSON.stringify([{ id: 'c1', name: 'ACME' }]));

(async () => {
  console.log('── Boot & migration ──');
  check('IndexedDB reported available', IDBStore.available(), true);

  const boot = await DB.init();
  check('Storage engine is IndexedDB', boot.storage, 'indexedDB');
  check('Legacy collections migrated', boot.migrated, 2);
  check('localStorage payload removed after verify', localStorage.getItem('ssinfotech_clients'), null);
  check('Migrated data readable through DB', DB.all().length, 1);
  check('Migrated company readable', DB.getSlipCompanies().length, 1);
  check('DB reports IndexedDB mode', DB.usingIndexedDB(), true);

  console.log('── CRUD through the cache ──');
  const saved = DB.save({ name: 'NEW CLIENT', pan: 'NEWCL0000N', ay: '2026-27' });
  check('Save adds a client', DB.all().length, 2);
  check('Client is immediately readable', DB.findById(saved.id).name, 'NEW CLIENT');

  await DB.flush();
  const persisted = JSON.parse(IDBStore.get('ssinfotech_clients'));
  check('Write reached the IndexedDB layer', persisted.length, 2);
  check('Persisted record survives serialization', persisted.some(c => c.id === saved.id), true);

  console.log('── Downgrade guard (storage telemetry) ──');
  const usage = DB.getStorageUsage();
  check('Telemetry flags IndexedDB', usage.usingIndexedDB, true);
  check('Telemetry ceiling is not 5 MB', usage.maxMB > 5, true);
  check('Telemetry counts clients', usage.clientCount, 2);
  check('Telemetry reports bytes', usage.totalBytes > 0, true);

  const est = await DB.getStorageEstimate();
  check('Estimate reports a quota source', typeof est.source, 'string');

  console.log('── Backup export / import round-trip ──');
  const exported = DB.exportAll();
  check('Export includes clients key', Object.prototype.hasOwnProperty.call(exported, 'ssinfotech_clients'), true);

  DB.save({ name: 'TEMP CLIENT', pan: 'TMPCL0000T', ay: '2026-27' });
  check('Pre-import client count', DB.all().length, 3);

  await DB.importAll(exported);
  check('Import restores snapshot', DB.all().length, 2);
  await DB.flush();
  check('Imported state persisted', JSON.parse(IDBStore.get('ssinfotech_clients')).length, 2);

  console.log('── Recycle Bin still intact ──');
  const first = DB.all()[0];
  DB.remove(first.id);
  check('Soft delete works from IDB mode', DB.trash().length, 1);
  DB.restore(first.id);
  check('Restore works from IDB mode', DB.trash().length, 0);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
})().catch(err => {
  console.error('Storage test crashed:', err);
  process.exit(1);
});
