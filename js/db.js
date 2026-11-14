/**
 * ═══════════════════════════════════════════════════════════
 * CLIENT DATABASE  –  IndexedDB-backed client store
 * (falls back to localStorage when IndexedDB is unavailable)
 * Full CRUD with PAN / mobile search
 * ═══════════════════════════════════════════════════════════
 */

const DB = (() => {
  const KEY = 'ssinfotech_clients';
  const ADMIN_KEY = 'ssinfotech_admin';
  const SLIP_COMP_KEY = 'ssinfotech_slip_companies';
  const SLIP_REC_KEY = 'ssinfotech_slip_records';
  const STMT_REC_KEY = 'ssinfotech_statement_records';

  /** Collections that live in the bulk store (IndexedDB when available) */
  const PERSIST_KEYS = [KEY, ADMIN_KEY, SLIP_COMP_KEY, SLIP_REC_KEY, STMT_REC_KEY];

  /**
   * IndexedDB is the primary store. `_idb` stays null in environments
   * without IndexedDB (Node regression tests, locked-down browsers),
   * in which case every read/write goes to localStorage exactly as before.
   */
  const _idb = (typeof IDBStore !== 'undefined' && IDBStore.available && IDBStore.available()) ? IDBStore : null;
  let _initPromise = null;

  function usingIndexedDB() {
    return !!(_idb && typeof _idb.isReady === 'function' && _idb.isReady());
  }

  /** Read the raw string for a key — IDB cache first, then localStorage */
  function _readRaw(key) {
    if (_idb && _idb.has(key)) return _idb.get(key);
    try { return localStorage.getItem(key); } catch { return null; }
  }

  /** Write the raw string for a key — IDB when available, else localStorage */
  function _writeRaw(key, value, triggerSync = true) {
    const ok = _idb ? _idb.set(key, value) : _safeSetItem(key, value, false);
    if (ok && triggerSync) {
      try { localStorage.setItem('ssinfotech_last_mutation', String(Date.now())); } catch {}
      if (typeof SupabaseSync !== 'undefined' &&
          typeof SupabaseSync.isAutoSyncEnabled === 'function' &&
          SupabaseSync.isAutoSyncEnabled()) {
        SupabaseSync.triggerAutoBackup('Auto Sync');
      }
    }
    return ok;
  }

  /**
   * Boot the storage layer and migrate any legacy localStorage payloads.
   * Safe to call more than once; resolves to a small status object.
   */
  async function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
      if (!_idb) return { storage: 'localStorage', migrated: 0 };
      const ok = await _idb.init();
      if (!ok) return { storage: 'localStorage', migrated: 0 };
      const migrated = await _migrateFromLocalStorage();
      return { storage: 'indexedDB', migrated };
    })();
    return _initPromise;
  }

  /**
   * One-time localStorage → IndexedDB migration.
   * Writes everything first, flushes, verifies each key, and only
   * then removes the localStorage copy (so a failure never loses data).
   */
  async function _migrateFromLocalStorage() {
    const pending = [];
    for (const key of PERSIST_KEYS) {
      let val = null;
      try { val = localStorage.getItem(key); } catch { val = null; }
      if (val == null) continue;
      if (!_idb.has(key)) {
        _idb.set(key, val);
        pending.push(key);
      }
    }

    if (!pending.length) return 0;

    await _idb.flush();

    let migrated = 0;
    for (const key of pending) {
      const val = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
      if (val == null) continue;
      if (_idb.get(key) === val) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        migrated++;
      }
    }

    if (migrated) console.log(`📦 Migrated ${migrated} collection(s) from localStorage to IndexedDB.`);
    return migrated;
  }

  /** Safe localStorage write wrapper with QuotaExceededError protection */
  function _safeSetItem(key, value, triggerSync = true) {
    try {
      localStorage.setItem(key, value);
      // Trigger background auto-sync to Supabase cloud only for user mutations
      if (triggerSync && typeof SupabaseSync !== 'undefined' && SupabaseSync.isAutoSyncEnabled()) {
        SupabaseSync.triggerAutoBackup('Auto Sync');
      }
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.error('Storage quota exceeded:', e);
        alert('⚠️ Browser Storage Limit Reached!\n\nYour browser localStorage is full. Please download a backup from the Admin panel and delete older unused records to free up space.');
      } else {
        console.error('LocalStorage write error:', e);
      }
      return false;
    }
  }

  /** Check if local storage is completely empty of user data */
  function isEmpty() {
    const clientCount = all().length;
    const stmtCount = getStatementRecords().length;
    const slipCount = getSlipRecords().length;
    const admin = getAdmin();
    const hasCustomBanks = Array.isArray(admin.bankConfigs) && admin.bankConfigs.length > 0;
    const hasCustomDeds = Array.isArray(admin.deductors) && admin.deductors.length > 8;
    const hasCustomAYs = Array.isArray(admin.customAYs) && admin.customAYs.length > 0;
    const hasCustomCompany = admin.company && admin.company !== 'SS INFOTECH';
    const slipComps = getSlipCompanies();
    const hasCustomSlips = slipComps.length > 2;

    return clientCount === 0 && stmtCount === 0 && slipCount === 0 && !hasCustomBanks && !hasCustomDeds && !hasCustomAYs && !hasCustomCompany && !hasCustomSlips;
  }

  /** Load all raw clients including trash */
  function _rawAll() {
    try { return JSON.parse(_readRaw(KEY) || '[]'); }
    catch { return []; }
  }

  /** Load all active clients (not in trash) */
  function all() {
    return _rawAll().filter(c => !c.deletedAt);
  }

  /** Load all soft-deleted clients (Recycle Bin) */
  function trash() {
    return _rawAll()
      .filter(c => !!c.deletedAt)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }

  /** Save client (create or update by ID) */
  function save(client) {
    const clients = _rawAll();
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      clients[idx] = { ...clients[idx], ...client, updatedAt: Date.now() };
    } else {
      client.id = _uid();
      client.createdAt = Date.now();
      client.updatedAt = Date.now();
      clients.unshift(client);
    }
    _persist(clients);
    return client;
  }

  /** Soft delete client by ID (moves to Recycle Bin) */
  function remove(id) {
    const clients = _rawAll();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      clients[idx].deletedAt = Date.now();
      clients[idx].updatedAt = Date.now();
      _persist(clients);
      return true;
    }
    return false;
  }

  /** Restore a soft-deleted client from Recycle Bin */
  function restore(id) {
    const clients = _rawAll();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      delete clients[idx].deletedAt;
      clients[idx].updatedAt = Date.now();
      _persist(clients);
      return true;
    }
    return false;
  }

  /** Bulk soft delete clients */
  function bulkRemove(ids) {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const idSet = new Set(ids);
    const clients = _rawAll();
    let count = 0;
    const now = Date.now();
    clients.forEach(c => {
      if (idSet.has(c.id) && !c.deletedAt) {
        c.deletedAt = now;
        c.updatedAt = now;
        count++;
      }
    });
    _persist(clients);
    return count;
  }

  /** Bulk restore clients from Recycle Bin */
  function bulkRestore(ids) {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const idSet = new Set(ids);
    const clients = _rawAll();
    let count = 0;
    const now = Date.now();
    clients.forEach(c => {
      if (idSet.has(c.id) && c.deletedAt) {
        delete c.deletedAt;
        c.updatedAt = now;
        count++;
      }
    });
    _persist(clients);
    return count;
  }

  /** Permanently remove client by ID */
  function permanentRemove(id) {
    const clients = _rawAll().filter(c => c.id !== id);
    _persist(clients);
  }

  /** Bulk permanently delete clients */
  function bulkPermanentRemove(ids) {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const idSet = new Set(ids);
    const clients = _rawAll().filter(c => !idSet.has(c.id));
    _persist(clients);
    return ids.length;
  }

  /** Empty all records currently in Recycle Bin */
  function emptyTrash() {
    const activeClients = _rawAll().filter(c => !c.deletedAt);
    _persist(activeClients);
  }

  /** Find client by ID (searches all including trash) */
  function findById(id) {
    return _rawAll().find(c => c.id === id) || null;
  }

  /** Search by name, PAN, or mobile */
  function search(query) {
    if (!query) return all();
    const q = query.toLowerCase().trim();
    return all().filter(c =>
      (c.name   || '').toLowerCase().includes(q) ||
      (c.pan    || '').toLowerCase().includes(q) ||
      (c.mobile || '').includes(q)
    );
  }

  /** Duplicate a client (creates new with same data, fresh ID) */
  function duplicate(id) {
    const src = findById(id);
    if (!src) return null;
    const copy = { ...src, id: _uid(), name: src.name + ' (Copy)', createdAt: Date.now(), updatedAt: Date.now() };
    // Use _rawAll() so soft-deleted (Recycle Bin) records survive the write.
    const clients = _rawAll();
    clients.unshift(copy);
    _persist(clients);
    return copy;
  }

  /** Export client list to CSV string */
  function exportCSV(clientIds = null) {
    let list = all();
    if (Array.isArray(clientIds) && clientIds.length) {
      const idSet = new Set(clientIds);
      list = list.filter(c => idSet.has(c.id));
    }
    if (!list.length) return '';

    const headers = [
      'Ref No', 'Ack No', 'Name', 'PAN', 'Father Name', 'AY', 'Section', 
      'Total Income (Rs)', 'Tax Payable (Rs)', 'Refund (Rs)', 'Mobile', 'Email', 
      'Status', 'Filing Section', 'Created Date'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map(c => {
      const comp = c.computation || {};
      const created = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '';
      return [
        escapeCSV(c.compNo || ''),
        escapeCSV(c.ackNo || ''),
        escapeCSV(c.name || ''),
        escapeCSV(c.pan || ''),
        escapeCSV(c.father || ''),
        escapeCSV(c.ay || ''),
        escapeCSV(c.presumptiveSection || (c.nature ? '44AD' : '—')),
        escapeCSV(comp.totalIncome || 0),
        escapeCSV(comp.taxDue || 0),
        escapeCSV(comp.refund || 0),
        escapeCSV(c.mobile || ''),
        escapeCSV(c.email || ''),
        escapeCSV(c.status || 'Resident'),
        escapeCSV(c.filing || '139(1)'),
        escapeCSV(created)
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /** Every storage key this app knows about (bulk store + small prefs) */
  function storageKeys() {
    const set = new Set();
    if (_idb) {
      _idb.keys().forEach(k => { if (k.startsWith('ssinfotech_') || k === 'theme') set.add(k); });
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === 'theme' || k.startsWith('ssinfotech_'))) set.add(k);
      }
    } catch { /* ignore */ }
    PERSIST_KEYS.forEach(k => { if (_readRaw(k) != null) set.add(k); });
    return Array.from(set).sort();
  }

  /** Storage Usage Analytics (in Bytes / KB / MB) */
  function getStorageUsage() {
    let totalBytes = 0;
    const breakdown = {};
    storageKeys().forEach(key => {
      const val = _readRaw(key) || '';
      const size = (key.length + val.length) * 2; // Approximate UTF-16 bytes
      totalBytes += size;
      breakdown[key] = size;
    });

    const totalKB = (totalBytes / 1024).toFixed(1);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const idbActive = usingIndexedDB() && _idb && _idb.isReady();
    const softLimitMB = (typeof window !== 'undefined' && window.SS_CONFIG && window.SS_CONFIG.INDEXEDDB_SOFT_LIMIT_MB)
      ? window.SS_CONFIG.INDEXEDDB_SOFT_LIMIT_MB
      : 512;
    const maxMB = idbActive ? softLimitMB : 5.0;
    const pctUsed = Math.min(100, ((totalBytes / (maxMB * 1024 * 1024)) * 100)).toFixed(1);

    return {
      totalBytes,
      totalKB: parseFloat(totalKB),
      totalMB: parseFloat(totalMB),
      maxMB,
      pctUsed: parseFloat(pctUsed),
      usingIndexedDB: !!idbActive,
      breakdown,
      clientCount: all().length,
      slipCompanyCount: getSlipCompanies().length,
      slipRecordCount: getSlipRecords().length,
      statementRecordCount: getStatementRecords().length
    };
  }

  /** Real browser-exposed quota (async, IndexedDB era) */
  async function getStorageEstimate() {
    if (!_idb) {
      const usage = getStorageUsage();
      return {
        usage: usage.totalBytes,
        quota: 5 * 1024 * 1024,
        pctUsed: usage.pctUsed,
        source: 'localStorage',
      };
    }
    const est = await _idb.estimate();
    const quota = est.quota || 0;
    return {
      usage: Math.max(est.usage || 0, 0),
      quota,
      pctUsed: quota ? Math.min(100, parseFloat(((est.usage / quota) * 100).toFixed(1))) : 0,
      source: est.source || 'indexeddb',
    };
  }

  // ── Generic key access (used by cloud sync & backup/restore) ──
  function readKey(key) {
    if (key === 'theme') {
      try { return localStorage.getItem('theme'); } catch { return null; }
    }
    return _readRaw(key);
  }

  function writeKey(key, value, triggerSync = false) {
    if (key === 'theme') {
      try { localStorage.setItem('theme', value); } catch { /* ignore */ }
      return true;
    }
    return _writeRaw(key, value, triggerSync);
  }

  /** Snapshot every app key as raw strings (local backup format) */
  const BACKUP_EXCLUDED_KEYS = new Set([
    'ssinfotech_supabase_config', // per-device cloud credentials
    'ssinfotech_device_id',       // per-device sync identity
  ]);

  function exportAll() {
    const data = {};
    storageKeys().forEach(key => {
      if (BACKUP_EXCLUDED_KEYS.has(key)) return;
      const raw = readKey(key);
      if (raw != null) data[key] = raw;
    });
    return data;
  }

  /** Replace the whole store with a raw-string map */
  async function importAll(data) {
    if (!data || typeof data !== 'object') return false;
    storageKeys().forEach(key => {
      if (!(key in data)) {
        if (key === 'theme') { try { localStorage.removeItem('theme'); } catch {} }
        else if (_idb) _idb.remove(key);
        else { try { localStorage.removeItem(key); } catch {} }
      }
    });
    Object.entries(data).forEach(([key, value]) => {
      // Never let a restored backup overwrite this device's cloud
      // credentials or sync identity.
      if (BACKUP_EXCLUDED_KEYS.has(key)) return;
      if (typeof value === 'string') writeKey(key, value);
    });
    if (_idb) await _idb.flush();
    return true;
  }

  function flush() {
    if (_idb && typeof _idb.flush === 'function') return _idb.flush();
    return Promise.resolve(true);
  }

  /** Stats */
  function stats() {
    const clients = all();
    const today = new Date().toDateString();
    return {
      total:   clients.length,
      today:   clients.filter(c => new Date(c.createdAt).toDateString() === today).length,
      refund:  clients.filter(c => c.computation && c.computation.refund > 0).length,
      payable: clients.filter(c => c.computation && c.computation.taxDue > 0).length,
      recent:  clients.slice(0, 8),
      byAY:    _groupByAY(clients),
    };
  }

  function _groupByAY(clients) {
    const map = {};
    clients.forEach(c => {
      const ay = c.ay || 'Unknown';
      map[ay] = (map[ay] || 0) + 1;
    });
    return map;
  }

  function _persist(clients) {
    _writeRaw(KEY, JSON.stringify(clients));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Admin Config ──────────────────────────────────────────
  function getAdmin() {
    try {
      const config = JSON.parse(_readRaw(ADMIN_KEY) || '{}');
      if (!config.deductors || !Array.isArray(config.deductors) || config.deductors.length === 0) {
        config.deductors = [
          { name: 'Razorpay Payments Pvt Ltd', tan: 'DELR12345E', category: 'Payment Gateway' },
          { name: 'Paytm Payments Bank Ltd', tan: 'NOIM12345E', category: 'Payment Gateway' },
          { name: 'PhonePe Private Limited', tan: 'BANP12345E', category: 'Payment Gateway' },
          { name: 'State Bank of India', tan: 'MUMS12345E', category: 'Bank' },
          { name: 'HDFC Bank Ltd', tan: 'MUMH12345E', category: 'Bank' },
          { name: 'ICICI Bank Ltd', tan: 'MUMI12345E', category: 'Bank' },
          { name: 'Delhivery Limited', tan: 'GREP12345E', category: 'Logistics' },
          { name: 'BlueDart Express Limited', tan: 'CHEP12345E', category: 'Logistics' },
        ];
        _writeRaw(ADMIN_KEY, JSON.stringify(config), false);
      }
      return config;
    }
    catch { return {}; }
  }

  function saveAdmin(config) {
    _writeRaw(ADMIN_KEY, JSON.stringify(config));
  }

  // ── Salary Slip Companies ──────────────────────────────────
  function getSlipCompanies() {
    try {
      const stored = _readRaw(SLIP_COMP_KEY);
      if (stored) return JSON.parse(stored);
      const defaults = [
        {
          id: 'comp-hullect',
          name: 'Hullect Services Private Limited',
          address: 'Office No -SF - 05E, 2nd Floor, Riverview Arcade Plot No - 4/17,\nSector 4, Gomti Nagar Extension, Lucknow, Uttar Pradesh 226010',
          phone: '0522-3504137',
          email: 'contact@hullect.com',
          logoText: 'H',
          createdAt: Date.now()
        },
        {
          id: 'comp-ss-infotech',
          name: 'SS INFOTECH SOLUTIONS',
          address: 'Plot No. 12, Sector 62, Electronic City, Noida, Uttar Pradesh 201301',
          phone: '0120-4567890',
          email: 'hr@ssinfotech.com',
          logoText: 'SS',
          createdAt: Date.now()
        }
      ];
      _writeRaw(SLIP_COMP_KEY, JSON.stringify(defaults), false);
      return defaults;
    }
    catch { return []; }
  }

  function saveSlipCompany(company) {
    const list = getSlipCompanies();
    const idx = list.findIndex(c => c.id === company.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...company };
    } else {
      company.id = _uid();
      company.createdAt = Date.now();
      list.unshift(company);
    }
    _writeRaw(SLIP_COMP_KEY, JSON.stringify(list));
    return company;
  }

  function removeSlipCompany(id) {
    const list = getSlipCompanies().filter(c => c.id !== id);
    _writeRaw(SLIP_COMP_KEY, JSON.stringify(list));
  }

  // ── Salary Slip Records ──────────────────────────────────
  function getSlipRecords() {
    try { return JSON.parse(_readRaw(SLIP_REC_KEY) || '[]'); }
    catch { return []; }
  }

  function getSlipRecordsByEmployee(empId) {
    return getSlipRecords().filter(r => r.employeeId === empId);
  }

  function getSlipRecordsByCompany(compId) {
    return getSlipRecords().filter(r => r.companyId === compId);
  }

  function saveSlipRecord(record) {
    const list = getSlipRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record, updatedAt: Date.now() };
    } else {
      record.id = _uid();
      record.createdAt = Date.now();
      record.updatedAt = Date.now();
      list.unshift(record);
    }
    _writeRaw(SLIP_REC_KEY, JSON.stringify(list));
    return record;
  }

  function removeSlipRecord(id) {
    const list = getSlipRecords().filter(r => r.id !== id);
    _writeRaw(SLIP_REC_KEY, JSON.stringify(list));
  }

  const MONTH_ORDER = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
  };

  /**
   * Get Salary Slip Customers grouped name-wise
   * Each customer object aggregates employee profile info and all their generated payslips
   */
  function getSlipCustomers(search = '', companyFilter = '') {
    const records = getSlipRecords();
    const customerMap = new Map();

    records.forEach(r => {
      const name = (r.empName || 'Unnamed Employee').trim().toUpperCase();
      const compId = r.companyId || (r.companyName || '').trim().toUpperCase();
      const key = `${name}___${compId}`;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerKey: key,
          empName: name,
          empCode: r.empCode || '',
          companyId: r.companyId || '',
          companyName: r.companyName || '',
          companyAddress: r.companyAddress || '',
          companyLogo: r.companyLogo || null,
          companyLogoText: r.companyLogoText || '',
          companyPhone: r.companyPhone || '',
          companyEmail: r.companyEmail || '',
          location: r.location || '',
          division: r.division || '',
          designation: r.designation || '',
          doj: r.doj || '',
          uan: r.uan || '',
          esic: r.esic || '',
          pan: r.pan || '',
          bankName: r.bankName || '',
          acNo: r.acNo || '',
          ifsc: r.ifsc || '',
          totalDays: r.totalDays || '30',
          daysPaid: r.daysPaid || '30',
          lop: r.lop || '0',
          earnings: r.earnings || [],
          deductions: r.deductions || [],
          slips: [],
          totalSlips: 0,
          totalGross: 0,
          totalNet: 0,
          lastUpdated: r.updatedAt || r.createdAt || 0,
        });
      }

      const cust = customerMap.get(key);
      cust.slips.push(r);
      cust.totalSlips++;
      cust.totalGross += parseFloat(r.totalEarning || 0);
      cust.totalNet += parseFloat(r.netPay || 0);

      const recTime = r.updatedAt || r.createdAt || 0;
      if (recTime >= cust.lastUpdated) {
        cust.lastUpdated = recTime;
        if (r.empCode) cust.empCode = r.empCode;
        if (r.designation) cust.designation = r.designation;
        if (r.division) cust.division = r.division;
        if (r.location) cust.location = r.location;
        if (r.pan) cust.pan = r.pan;
        if (r.uan) cust.uan = r.uan;
        if (r.esic) cust.esic = r.esic;
        if (r.bankName) cust.bankName = r.bankName;
        if (r.acNo) cust.acNo = r.acNo;
        if (r.ifsc) cust.ifsc = r.ifsc;
        if (r.earnings && r.earnings.length) cust.earnings = r.earnings;
        if (r.deductions && r.deductions.length) cust.deductions = r.deductions;
      }
    });

    let customers = Array.from(customerMap.values());

    customers.forEach(cust => {
      cust.slips.sort((a, b) => {
        const yDiff = (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
        if (yDiff !== 0) return yDiff;
        return (MONTH_ORDER[b.month] || 0) - (MONTH_ORDER[a.month] || 0);
      });
    });

    if (companyFilter) {
      customers = customers.filter(c => c.companyId === companyFilter || c.companyName === companyFilter);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      customers = customers.filter(c =>
        (c.empName || '').toLowerCase().includes(q) ||
        (c.empCode || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.pan || '').toLowerCase().includes(q) ||
        (c.designation || '').toLowerCase().includes(q)
      );
    }

    customers.sort((a, b) => (a.empName || '').localeCompare(b.empName || ''));

    return customers;
  }

  function deleteSlipCustomer(customerKey) {
    const list = getSlipRecords().filter(r => {
      const name = (r.empName || 'Unnamed Employee').trim().toUpperCase();
      const compId = r.companyId || (r.companyName || '').trim().toUpperCase();
      const key = `${name}___${compId}`;
      return key !== customerKey;
    });
    _writeRaw(SLIP_REC_KEY, JSON.stringify(list));
    return true;
  }

  function generateEmpCode(companyName) {
    const records = getSlipRecords();
    const prefix = (companyName || 'EMP').replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 3) || 'EMP';
    let max = 0;
    records.forEach(r => {
      if (r.empCode && r.empCode.startsWith(prefix)) {
        const num = parseInt(r.empCode.slice(prefix.length), 10);
        if (num > max) max = num;
      }
    });
    return prefix + String(max + 1).padStart(3, '0');
  }

  // ── Bank Statement Records ────────────────────────────────
  function getStatementRecords() {
    try { return JSON.parse(_readRaw(STMT_REC_KEY) || '[]'); }
    catch { return []; }
  }

  function saveStatementRecord(record) {
    const list = getStatementRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record, updatedAt: Date.now() };
    } else {
      record.id = _uid();
      record.createdAt = Date.now();
      record.updatedAt = Date.now();
      list.unshift(record);
    }
    _writeRaw(STMT_REC_KEY, JSON.stringify(list));
    return record;
  }

  function removeStatementRecord(id) {
    const list = getStatementRecords().filter(r => r.id !== id);
    _writeRaw(STMT_REC_KEY, JSON.stringify(list));
  }

  function getLastMutationTime() {
    try {
      return parseInt(localStorage.getItem('ssinfotech_last_mutation') || '0', 10);
    } catch {
      return 0;
    }
  }

  function markSynced() {
    try {
      localStorage.setItem('ssinfotech_last_mutation', '0');
    } catch { /* ignore */ }
  }

  return { all, save, remove, bulkRemove, findById, search, duplicate, stats, exportCSV, getStorageUsage, isEmpty,
           trash, restore, bulkRestore, permanentRemove, bulkPermanentRemove, emptyTrash,
           getAdmin, saveAdmin,
           getSlipCompanies, saveSlipCompany, removeSlipCompany,
           getSlipRecords, getSlipRecordsByEmployee, getSlipRecordsByCompany,
           saveSlipRecord, removeSlipRecord, generateEmpCode,
           getSlipCustomers, deleteSlipCustomer,
           getStatementRecords, saveStatementRecord, removeStatementRecord,
           init, usingIndexedDB, getStorageEstimate, storageKeys,
           readKey, writeKey, exportAll, importAll, flush,
           getLastMutationTime, markSynced };
})();

if (typeof module !== 'undefined') {
  module.exports = DB;
}
