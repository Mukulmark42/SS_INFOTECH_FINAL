/**
 * ═══════════════════════════════════════════════════════════
 * SUPABASE CLOUD SYNC ENGINE – SS INFOTECH
 * Cloud Backup, Multi-device Data Sync & Storage Hub
 * ═══════════════════════════════════════════════════════════
 */

const SupabaseSync = (() => {
  const CONFIG_KEY = 'ssinfotech_supabase_config';
  const DEFAULT_TABLE = 'ssinfotech_backups';

  // Default credentials provided by user
  const DEFAULT_CONFIG = {
    url: 'https://qwdaeegtzpqlcxzcxkgv.supabase.co',
    anonKey: 'sb_publishable_2sp-6p5Pn-4h-PU7ixRkWw_YJbINBms',
    tableName: DEFAULT_TABLE,
    autoSync: true,
    lastSyncAt: null,
    deviceId: _getOrCreateDeviceId(),
  };

  let _client = null;
  let _autoSyncTimer = null;
  let _isSyncing = false;

  function _getOrCreateDeviceId() {
    let id = localStorage.getItem('ssinfotech_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('ssinfotech_device_id', id);
    }
    return id;
  }

  function isAutoSyncEnabled() {
    return !!getConfig().autoSync;
  }

  /**
   * Debounced Auto-Backup Trigger (runs 2s after last data modification)
   */
  function triggerAutoBackup(reason = 'Auto Sync') {
    if (!isAutoSyncEnabled()) return;

    // Safety guard: do not queue auto-sync if local storage has no user records
    if (typeof DB !== 'undefined' && typeof DB.isEmpty === 'function' && DB.isEmpty()) {
      return;
    }

    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);

    _autoSyncTimer = setTimeout(async () => {
      if (_isSyncing) return;
      try {
        _isSyncing = true;
        const res = await pushBackup(`${reason} (${new Date().toLocaleTimeString('en-IN')})`, true);
        if (res && !res.skipped && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase:synced', { detail: res }));
        }
      } catch (err) {
        console.warn('Silent auto-sync skipped/failed:', err.message);
      } finally {
        _isSyncing = false;
      }
    }, 2000);
  }

  /** Get configuration with fallback to defaults */
  function getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      return { ...DEFAULT_CONFIG, ...saved };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  /** Save updated configuration */
  function saveConfig(cfg) {
    const current = getConfig();
    const updated = { ...current, ...cfg };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    _client = null; // Reset client on config change
    return updated;
  }

  /** Get or initialize the Supabase client */
  function getClient() {
    if (_client) return _client;
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) return null;
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('Supabase client library not loaded yet');
      return null;
    }
    try {
      _client = supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false },
      });
      return _client;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  /**
   * Test connection to Supabase and check if table exists
   */
  async function testConnection() {
    const client = getClient();
    if (!client) {
      return { success: false, message: 'Supabase credentials or client library missing.' };
    }
    const cfg = getConfig();
    try {
      const { data, error } = await client
        .from(cfg.tableName || DEFAULT_TABLE)
        .select('id, created_at')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          return {
            success: false,
            tableMissing: true,
            message: `Connected to Supabase project, but the table "${cfg.tableName || DEFAULT_TABLE}" is not created yet. Click "Copy SQL Setup" and run it in Supabase SQL Editor.`,
          };
        }
        return { success: false, message: error.message || 'Supabase API Error' };
      }

      return {
        success: true,
        message: 'Successfully connected to Supabase cloud storage!',
        recordsFound: data ? data.length : 0,
      };
    } catch (err) {
      return { success: false, message: err.message || 'Network error connecting to Supabase.' };
    }
  }

  /**
   * Collect all application data keys for cloud backup
   */
  function collectAllData() {
    const keys = [
      'ssinfotech_clients',
      'ssinfotech_admin',
      'ssinfotech_slip_companies',
      'ssinfotech_slip_records',
      'ssinfotech_statement_records',
    ];

    const payload = {};
    keys.forEach(k => {
      try {
        const val = localStorage.getItem(k);
        if (val) payload[k] = JSON.parse(val);
      } catch {
        payload[k] = localStorage.getItem(k);
      }
    });

    const stats = {
      clients: (payload.ssinfotech_clients || []).length,
      slipCompanies: (payload.ssinfotech_slip_companies || []).length,
      slipRecords: (payload.ssinfotech_slip_records || []).length,
      statementRecords: (payload.ssinfotech_statement_records || []).length,
    };

    return {
      payload,
      stats,
      version: 1,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };
  }

  /**
   * Push current local data as a cloud snapshot into Supabase
   */
  async function pushBackup(customLabel = '', isAuto = false) {
    const client = getClient();
    if (!client) {
      throw new Error('Supabase is not configured. Please check your Project URL and Key.');
    }
    const cfg = getConfig();
    const bundle = collectAllData();
    const label = customLabel || `Snapshot (${new Date().toLocaleString('en-IN')})`;

    // Protection: NEVER push an empty backup during automatic sync to prevent wiping out existing data
    const isAutoSync = isAuto || label.startsWith('Auto Sync');
    const totalUserRecords = (bundle.stats.clients || 0) + (bundle.stats.statementRecords || 0) + (bundle.stats.slipRecords || 0);

    if (isAutoSync && totalUserRecords === 0) {
      console.log('ℹ️ Auto-backup skipped: local workspace has no user records (protecting cloud backups).');
      return { skipped: true, reason: 'Empty workspace on auto-sync' };
    }

    const record = {
      label: label,
      device_id: cfg.deviceId,
      client_count: bundle.stats.clients,
      statement_count: bundle.stats.statementRecords,
      slip_count: bundle.stats.slipRecords,
      company_count: bundle.stats.slipCompanies,
      data: bundle.payload,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from(cfg.tableName || DEFAULT_TABLE)
      .insert([record])
      .select('id, label, created_at')
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error(`Table "${cfg.tableName}" does not exist. Please run the SQL Setup Script in Supabase.`);
      }
      throw new Error(error.message || 'Failed to upload backup to Supabase.');
    }

    saveConfig({ lastSyncAt: Date.now() });
    return { success: true, backup: data, stats: bundle.stats };
  }

  /**
   * Fetch list of saved cloud backups from Supabase
   */
  async function listBackups(limit = 20) {
    const client = getClient();
    if (!client) throw new Error('Supabase client not initialized.');
    const cfg = getConfig();

    const { data, error } = await client
      .from(cfg.tableName || DEFAULT_TABLE)
      .select('id, label, device_id, client_count, statement_count, slip_count, company_count, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message || 'Failed to fetch cloud backups.');
    return data || [];
  }

  /**
   * Fetch the latest valid cloud backup (prefers snapshots that have actual records)
   */
  async function getLatestValidBackup() {
    const client = getClient();
    if (!client) return null;
    const cfg = getConfig();

    try {
      // Get the 10 most recent backups
      const { data, error } = await client
        .from(cfg.tableName || DEFAULT_TABLE)
        .select('id, label, device_id, client_count, statement_count, slip_count, company_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data || !data.length) return null;

      // Find the first backup with data > 0
      const bestWithData = data.find(b =>
        (b.client_count > 0) || (b.statement_count > 0) || (b.slip_count > 0)
      );

      // Return the best backup with data, or the latest if none have data
      return bestWithData || data[0];
    } catch (e) {
      console.warn('Failed to find latest valid backup:', e);
      return null;
    }
  }

  /**
   * Restore application data from a specific cloud snapshot ID or latest valid
   * @param {string|null} backupId
   * @param {Object} options { merge: boolean }
   */
  async function restoreBackup(backupId = null, options = { merge: false }) {
    const client = getClient();
    if (!client) throw new Error('Supabase client not initialized.');
    const cfg = getConfig();

    let targetId = backupId;
    if (!targetId) {
      const best = await getLatestValidBackup();
      if (!best) throw new Error('No cloud backups found on Supabase.');
      targetId = best.id;
    }

    const { data, error } = await client
      .from(cfg.tableName || DEFAULT_TABLE)
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) throw new Error(error.message || 'Failed to download cloud backup.');
    if (!data || !data.data) throw new Error('Backup data payload is empty or invalid.');

    const payload = data.data;
    const restoredKeys = [];

    if (options && options.merge) {
      // MERGE MODE: Combine local records with cloud snapshot without overwriting newer items
      _mergePayloadIntoLocalStorage(payload);
    } else {
      // REPLACE MODE: Write back to localStorage safely
      Object.keys(payload).forEach(key => {
        if (key.startsWith('ssinfotech_')) {
          const val = typeof payload[key] === 'object' ? JSON.stringify(payload[key]) : payload[key];
          localStorage.setItem(key, val);
          restoredKeys.push(key);
        }
      });
    }

    saveConfig({ lastSyncAt: Date.now() });

    return {
      success: true,
      backupId: data.id,
      label: data.label,
      createdAt: data.created_at,
      merged: !!(options && options.merge),
      restoredKeys,
      stats: {
        clients: data.client_count || 0,
        statements: data.statement_count || 0,
        slips: data.slip_count || 0,
        companies: data.company_count || 0,
      }
    };
  }

  /**
   * Smart merge helper for combining cloud records with local records
   */
  function _mergePayloadIntoLocalStorage(payload) {
    // 1. Clients
    if (payload.ssinfotech_clients && Array.isArray(payload.ssinfotech_clients)) {
      const localClients = JSON.parse(localStorage.getItem('ssinfotech_clients') || '[]');
      const clientMap = new Map();
      localClients.forEach(c => {
        const k = c.id || (c.pan ? `${c.pan}_${c.ay}` : null);
        if (k) clientMap.set(k, c);
      });
      payload.ssinfotech_clients.forEach(c => {
        const k = c.id || (c.pan ? `${c.pan}_${c.ay}` : null);
        if (!k) return;
        if (!clientMap.has(k)) {
          clientMap.set(k, c);
        } else {
          const existing = clientMap.get(k);
          if ((c.updatedAt || 0) > (existing.updatedAt || 0)) {
            clientMap.set(k, { ...existing, ...c });
          }
        }
      });
      localStorage.setItem('ssinfotech_clients', JSON.stringify(Array.from(clientMap.values())));
    }

    // 2. Statements
    if (payload.ssinfotech_statement_records && Array.isArray(payload.ssinfotech_statement_records)) {
      const localStmts = JSON.parse(localStorage.getItem('ssinfotech_statement_records') || '[]');
      const stmtMap = new Map();
      localStmts.forEach(s => stmtMap.set(s.id || s.accountNo, s));
      payload.ssinfotech_statement_records.forEach(s => {
        const k = s.id || s.accountNo;
        if (!k || !stmtMap.has(k)) {
          stmtMap.set(k || Math.random().toString(), s);
        }
      });
      localStorage.setItem('ssinfotech_statement_records', JSON.stringify(Array.from(stmtMap.values())));
    }

    // 3. Salary Slip records
    if (payload.ssinfotech_slip_records && Array.isArray(payload.ssinfotech_slip_records)) {
      const localSlips = JSON.parse(localStorage.getItem('ssinfotech_slip_records') || '[]');
      const slipMap = new Map();
      localSlips.forEach(s => slipMap.set(s.id || `${s.employeeId}_${s.month}_${s.year}`, s));
      payload.ssinfotech_slip_records.forEach(s => {
        const k = s.id || `${s.employeeId}_${s.month}_${s.year}`;
        if (!k || !slipMap.has(k)) {
          slipMap.set(k || Math.random().toString(), s);
        }
      });
      localStorage.setItem('ssinfotech_slip_records', JSON.stringify(Array.from(slipMap.values())));
    }

    // 4. Companies
    if (payload.ssinfotech_slip_companies && Array.isArray(payload.ssinfotech_slip_companies)) {
      const localComps = JSON.parse(localStorage.getItem('ssinfotech_slip_companies') || '[]');
      const compMap = new Map();
      localComps.forEach(c => compMap.set(c.id || c.name, c));
      payload.ssinfotech_slip_companies.forEach(c => {
        const k = c.id || c.name;
        if (!k || !compMap.has(k)) {
          compMap.set(k, c);
        }
      });
      localStorage.setItem('ssinfotech_slip_companies', JSON.stringify(Array.from(compMap.values())));
    }

    // 5. Admin Masters (Deductors, Banks, Nature Codes, AYs, Company Info)
    if (payload.ssinfotech_admin && typeof payload.ssinfotech_admin === 'object') {
      const localAdmin = JSON.parse(localStorage.getItem('ssinfotech_admin') || '{}');
      const pAdmin = payload.ssinfotech_admin;

      // Merge deductors
      if (Array.isArray(pAdmin.deductors)) {
        const curDeds = localAdmin.deductors || [];
        const tanMap = new Map();
        curDeds.forEach(d => tanMap.set(d.tan || d.name, d));
        pAdmin.deductors.forEach(d => {
          const k = d.tan || d.name;
          if (!tanMap.has(k)) tanMap.set(k, d);
        });
        localAdmin.deductors = Array.from(tanMap.values());
      }

      // Merge bank configs
      if (Array.isArray(pAdmin.bankConfigs)) {
        const curBanks = localAdmin.bankConfigs || [];
        const bankMap = new Map();
        curBanks.forEach(b => bankMap.set((typeof b === 'string' ? b : b.name || '').toUpperCase(), b));
        pAdmin.bankConfigs.forEach(b => {
          const name = (typeof b === 'string' ? b : b.name || '').toUpperCase();
          if (name && !bankMap.has(name)) bankMap.set(name, b);
        });
        localAdmin.bankConfigs = Array.from(bankMap.values());
      }

      // Merge nature codes
      if (Array.isArray(pAdmin.natureCodes)) {
        const curCodes = localAdmin.natureCodes || [];
        const codeMap = new Map();
        curCodes.forEach(c => {
          if (c) {
            const k = (c.nature || '') + '|' + (c.code || '');
            codeMap.set(k, c);
          }
        });
        pAdmin.natureCodes.forEach(c => {
          if (c) {
            const k = (c.nature || '') + '|' + (c.code || '');
            if (!codeMap.has(k)) codeMap.set(k, c);
          }
        });
        localAdmin.natureCodes = Array.from(codeMap.values());
      }

      // Merge custom AYs
      if (Array.isArray(pAdmin.customAYs)) {
        const curAYs = new Set(localAdmin.customAYs || []);
        pAdmin.customAYs.forEach(ay => curAYs.add(ay));
        localAdmin.customAYs = Array.from(curAYs);
      }

      // Company info (preserve local if existing, adopt cloud if missing)
      if (!localAdmin.company && pAdmin.company) localAdmin.company = pAdmin.company;
      if (!localAdmin.footer && pAdmin.footer) localAdmin.footer = pAdmin.footer;
      if (!localAdmin.signatory && pAdmin.signatory) localAdmin.signatory = pAdmin.signatory;
      if (localAdmin.profitPct === undefined && pAdmin.profitPct !== undefined) localAdmin.profitPct = pAdmin.profitPct;
      if (localAdmin.intMin === undefined && pAdmin.intMin !== undefined) localAdmin.intMin = pAdmin.intMin;
      if (localAdmin.intMax === undefined && pAdmin.intMax !== undefined) localAdmin.intMax = pAdmin.intMax;
      if (localAdmin.rate194H === undefined && pAdmin.rate194H !== undefined) localAdmin.rate194H = pAdmin.rate194H;
      if (localAdmin.rate194C === undefined && pAdmin.rate194C !== undefined) localAdmin.rate194C = pAdmin.rate194C;
      if (localAdmin.rate194NF === undefined && pAdmin.rate194NF !== undefined) localAdmin.rate194NF = pAdmin.rate194NF;

      localStorage.setItem('ssinfotech_admin', JSON.stringify(localAdmin));
    }
  }

  /**
   * Automatic startup check for new devices or cloud updates.
   * If local storage is empty, automatically restores the latest cloud backup safely with merge.
   * If local storage is not empty, checks if cloud has a newer snapshot.
   */
  async function checkStartupSync() {
    const client = getClient();
    if (!client) return { status: 'unconfigured' };

    const isLocalEmpty = typeof DB !== 'undefined' && typeof DB.isEmpty === 'function'
      ? DB.isEmpty()
      : (JSON.parse(localStorage.getItem('ssinfotech_clients') || '[]').length === 0);

    try {
      const latestValid = await getLatestValidBackup();
      if (!latestValid) {
        return { status: 'no_backups' };
      }

      const totalCloudRecords = (latestValid.client_count || 0) + (latestValid.statement_count || 0) + (latestValid.slip_count || 0);

      // Case 1: Fresh device / empty workspace, and cloud has data -> Auto Restore safely with merge!
      if (isLocalEmpty && totalCloudRecords > 0) {
        console.log('🔄 Fresh device detected with empty storage. Auto-restoring cloud snapshot:', latestValid.id);
        const restoreRes = await restoreBackup(latestValid.id, { merge: true });
        return {
          status: 'auto_restored',
          backup: latestValid,
          stats: restoreRes.stats,
        };
      }

      // Case 2: Device already has data. Check if cloud has a newer snapshot from another device
      const cfg = getConfig();
      const lastSyncAt = cfg.lastSyncAt ? new Date(cfg.lastSyncAt).getTime() : 0;
      const cloudTime = new Date(latestValid.created_at).getTime();

      if (cloudTime > (lastSyncAt + 60000) && latestValid.device_id !== cfg.deviceId && totalCloudRecords > 0) {
        return {
          status: 'cloud_update_available',
          backup: latestValid,
        };
      }

      return { status: 'synced', backup: latestValid };
    } catch (e) {
      console.warn('Startup cloud check error:', e);
      return { status: 'error', message: e.message };
    }
  }

  /**
   * Delete a cloud backup by ID
   */
  async function deleteBackup(backupId) {
    const client = getClient();
    if (!client) throw new Error('Supabase client not initialized.');
    const cfg = getConfig();

    const { error } = await client
      .from(cfg.tableName || DEFAULT_TABLE)
      .delete()
      .eq('id', backupId);

    if (error) throw new Error(error.message || 'Failed to delete backup.');
    return { success: true };
  }

  /**
   * Generate 1-click SQL setup script for Supabase SQL editor
   */
  function getSqlSchema() {
    const cfg = getConfig();
    const tbl = cfg.tableName || DEFAULT_TABLE;
    return `-- ═══════════════════════════════════════════════════════════
-- SS INFOTECH - SUPABASE CLOUD BACKUP & SYNC TABLE SETUP
-- Run this in your Supabase SQL Editor (1-Click Setup)
-- ═══════════════════════════════════════════════════════════

-- 1. Create the master backup table
CREATE TABLE IF NOT EXISTS public.${tbl} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL DEFAULT 'Manual Backup',
    device_id TEXT,
    client_count INT DEFAULT 0,
    statement_count INT DEFAULT 0,
    slip_count INT DEFAULT 0,
    company_count INT DEFAULT 0,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for fast retrieval by created_at
CREATE INDEX IF NOT EXISTS idx_${tbl}_created_at ON public.${tbl}(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for public anon read/write (for publishable key access)
DROP POLICY IF EXISTS "Allow anon all on ${tbl}" ON public.${tbl};
CREATE POLICY "Allow anon all on ${tbl}" 
ON public.${tbl} 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);
`;
  }

  function isConfigured() {
    const cfg = getConfig();
    return !!(cfg && cfg.url && cfg.anonKey);
  }

  return {
    getConfig,
    saveConfig,
    getClient,
    isConfigured,
    testConnection,
    pushBackup,
    triggerAutoBackup,
    isAutoSyncEnabled,
    listBackups,
    getLatestValidBackup,
    restoreBackup,
    deleteBackup,
    getSqlSchema,
    collectAllData,
    checkStartupSync,
    DEFAULT_CONFIG,
  };
})();
