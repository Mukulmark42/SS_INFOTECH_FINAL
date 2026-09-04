/**
 * ═══════════════════════════════════════════════════════════
 * CLIENT DATABASE  –  localStorage-backed client store
 * Full CRUD with PAN / mobile search
 * ═══════════════════════════════════════════════════════════
 */

const DB = (() => {
  const KEY = 'ssinfotech_clients';
  const ADMIN_KEY = 'ssinfotech_admin';
  const SLIP_COMP_KEY = 'ssinfotech_slip_companies';
  const SLIP_REC_KEY = 'ssinfotech_slip_records';
  const STMT_REC_KEY = 'ssinfotech_statement_records';

  /** Safe localStorage write wrapper with QuotaExceededError protection */
  function _safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      // Trigger background auto-sync to Supabase cloud
      if (typeof SupabaseSync !== 'undefined' && SupabaseSync.isAutoSyncEnabled()) {
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

  /** Load all clients */
  function all() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  /** Save client (create or update by ID) */
  function save(client) {
    const clients = all();
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

  /** Delete client by ID */
  function remove(id) {
    const clients = all().filter(c => c.id !== id);
    _persist(clients);
  }

  /** Bulk delete clients by Array of IDs */
  function bulkRemove(ids) {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const idSet = new Set(ids);
    const clients = all().filter(c => !idSet.has(c.id));
    _persist(clients);
    return ids.length;
  }

  /** Find client by ID */
  function findById(id) {
    return all().find(c => c.id === id) || null;
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
    const clients = all();
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

  /** Storage Usage Analytics (in Bytes / KB / MB) */
  function getStorageUsage() {
    let totalBytes = 0;
    const breakdown = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key) || '';
      const size = (key.length + val.length) * 2; // Approximate UTF-16 bytes
      totalBytes += size;
      breakdown[key] = size;
    }
    const totalKB = (totalBytes / 1024).toFixed(1);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const maxMB = 5.0; // Typical browser limit
    const pctUsed = Math.min(100, ((totalBytes / (maxMB * 1024 * 1024)) * 100)).toFixed(1);

    return {
      totalBytes,
      totalKB: parseFloat(totalKB),
      totalMB: parseFloat(totalMB),
      maxMB,
      pctUsed: parseFloat(pctUsed),
      breakdown,
      clientCount: all().length,
      slipCompanyCount: getSlipCompanies().length,
      slipRecordCount: getSlipRecords().length,
      statementRecordCount: getStatementRecords().length
    };
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
    _safeSetItem(KEY, JSON.stringify(clients));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Admin Config ──────────────────────────────────────────
  function getAdmin() {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveAdmin(config) {
    _safeSetItem(ADMIN_KEY, JSON.stringify(config));
  }

  // ── Salary Slip Companies ──────────────────────────────────
  function getSlipCompanies() {
    try { return JSON.parse(localStorage.getItem(SLIP_COMP_KEY) || '[]'); }
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
    _safeSetItem(SLIP_COMP_KEY, JSON.stringify(list));
    return company;
  }

  function removeSlipCompany(id) {
    const list = getSlipCompanies().filter(c => c.id !== id);
    _safeSetItem(SLIP_COMP_KEY, JSON.stringify(list));
  }

  // ── Salary Slip Records ──────────────────────────────────
  function getSlipRecords() {
    try { return JSON.parse(localStorage.getItem(SLIP_REC_KEY) || '[]'); }
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
    _safeSetItem(SLIP_REC_KEY, JSON.stringify(list));
    return record;
  }

  function removeSlipRecord(id) {
    const list = getSlipRecords().filter(r => r.id !== id);
    _safeSetItem(SLIP_REC_KEY, JSON.stringify(list));
  }

  function generateEmpCode(companyName) {
    const records = getSlipRecords();
    const prefix = companyName.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 3);
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
    try { return JSON.parse(localStorage.getItem(STMT_REC_KEY) || '[]'); }
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
    _safeSetItem(STMT_REC_KEY, JSON.stringify(list));
    return record;
  }

  function removeStatementRecord(id) {
    const list = getStatementRecords().filter(r => r.id !== id);
    _safeSetItem(STMT_REC_KEY, JSON.stringify(list));
  }

  return { all, save, remove, bulkRemove, findById, search, duplicate, stats, exportCSV, getStorageUsage,
           getAdmin, saveAdmin,
           getSlipCompanies, saveSlipCompany, removeSlipCompany,
           getSlipRecords, getSlipRecordsByEmployee, getSlipRecordsByCompany,
           saveSlipRecord, removeSlipRecord, generateEmpCode,
           getStatementRecords, saveStatementRecord, removeStatementRecord };
})();
