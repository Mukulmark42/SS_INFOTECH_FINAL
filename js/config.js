/**
 * ═══════════════════════════════════════════════════════════
 * RUNTIME CONFIGURATION – SS INFOTECH
 * Public Supabase endpoint + shared workspace identity.
 *
 * The publishable (anon) key is safe to ship in client code by
 * design: it only grants what Row Level Security allows. This
 * app runs a single shared workspace, so every installation
 * boots straight into the same cloud dataset with no setup.
 *
 * Values here are DEFAULTS. Anything saved from the Admin panel
 * (localStorage key `ssinfotech_supabase_config`) still wins,
 * so existing installations keep their own settings.
 * ═══════════════════════════════════════════════════════════
 */

window.SS_CONFIG = {
  SUPABASE_URL: 'https://qwdaeegtzpqlcxzcxkgv.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_2sp-6p5Pn-4h-PU7ixRkWw_YJbINBms',
  SUPABASE_TABLE: 'ssinfotech_backups',

  // Shared cloud workspace. Bump this (or make it per-invite later)
  // to split datasets without touching the storage layer.
  WORKSPACE_ID: 'public',

  // Soft ceiling used only for the Admin storage meter when the
  // browser does not expose navigator.storage.estimate().
  INDEXEDDB_SOFT_LIMIT_MB: 512,
};
