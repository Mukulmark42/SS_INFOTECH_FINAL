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
    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);

    _autoSyncTimer = setTimeout(async () => {
      if (_isSyncing) return;
      try {
        _isSyncing = true;
        const res = await pushBackup(`${reason} (${new Date().toLocaleTimeString('en-IN')})`);
        if (typeof window !== 'undefined') {
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
  async function pushBackup(customLabel = '') {
    const client = getClient();
    if (!client) {
      throw new Error('Supabase is not configured. Please check your Project URL and Key.');
    }
    const cfg = getConfig();
    const bundle = collectAllData();
    const label = customLabel || `Snapshot (${new Date().toLocaleString('en-IN')})`;

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
   * Restore application data from a specific cloud snapshot ID or latest
   */
  async function restoreBackup(backupId = null) {
    const client = getClient();
    if (!client) throw new Error('Supabase client not initialized.');
    const cfg = getConfig();

    let query = client
      .from(cfg.tableName || DEFAULT_TABLE)
      .select('*');

    if (backupId) {
      query = query.eq('id', backupId).single();
    } else {
      query = query.order('created_at', { ascending: false }).limit(1).single();
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to download cloud backup.');
    if (!data || !data.data) throw new Error('Backup data payload is empty or invalid.');

    // Write back to localStorage safely
    const payload = data.data;
    const restoredKeys = [];
    Object.keys(payload).forEach(key => {
      if (key.startsWith('ssinfotech_')) {
        const val = typeof payload[key] === 'object' ? JSON.stringify(payload[key]) : payload[key];
        localStorage.setItem(key, val);
        restoredKeys.push(key);
      }
    });

    saveConfig({ lastSyncAt: Date.now() });

    return {
      success: true,
      backupId: data.id,
      label: data.label,
      createdAt: data.created_at,
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

  return {
    getConfig,
    saveConfig,
    getClient,
    testConnection,
    pushBackup,
    triggerAutoBackup,
    isAutoSyncEnabled,
    listBackups,
    restoreBackup,
    deleteBackup,
    getSqlSchema,
    collectAllData,
    DEFAULT_CONFIG,
  };
})();
