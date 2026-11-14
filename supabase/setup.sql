-- ═══════════════════════════════════════════════════════════════════
-- SS INFOTECH — SUPABASE CLOUD SYNC SETUP
-- Paste this whole file into: Supabase Dashboard → SQL Editor → Run
--
-- Safe to re-run: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- SECURITY MODEL (deliberate)
-- The app runs a single shared workspace with no login, using the
-- public publishable (anon) key. That means ANY visitor to the
-- deployed site can read and insert snapshots. Only use this project
-- for data you are willing to share that way, and rotate the key if
-- it ever leaks. The invite-gate upgrade replaces this policy with
-- one scoped to an authenticated user / workspace.
-- ─────────────────────────────────────────────────────────────────

-- 1. Master snapshot table
CREATE TABLE IF NOT EXISTS public.ssinfotech_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL DEFAULT 'Manual Backup',
    device_id TEXT,
    workspace_id TEXT NOT NULL DEFAULT 'public',
    client_count INT DEFAULT 0,
    statement_count INT DEFAULT 0,
    slip_count INT DEFAULT 0,
    company_count INT DEFAULT 0,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1b. Upgrade a table created before the workspace column existed
ALTER TABLE public.ssinfotech_backups
    ADD COLUMN IF NOT EXISTS workspace_id TEXT NOT NULL DEFAULT 'public';

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ssinfotech_backups_created_at
    ON public.ssinfotech_backups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ssinfotech_backups_workspace
    ON public.ssinfotech_backups(workspace_id, created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.ssinfotech_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on ssinfotech_backups" ON public.ssinfotech_backups;
CREATE POLICY "Allow anon all on ssinfotech_backups"
    ON public.ssinfotech_backups
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 4. Retention — keep the newest 100 snapshots per workspace.
--    Append-only history means an accidental wipe is recoverable by
--    restoring an older revision; this keeps storage bounded.
CREATE OR REPLACE FUNCTION public.ssinfotech_backups_prune()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.ssinfotech_backups
    WHERE id IN (
        SELECT id
        FROM public.ssinfotech_backups
        WHERE workspace_id = NEW.workspace_id
        ORDER BY created_at DESC
        OFFSET 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ssinfotech_backups_prune ON public.ssinfotech_backups;
CREATE TRIGGER trg_ssinfotech_backups_prune
    AFTER INSERT ON public.ssinfotech_backups
    FOR EACH ROW EXECUTE FUNCTION public.ssinfotech_backups_prune();

-- 5. Realtime replication for instant multi-device live sync
ALTER TABLE public.ssinfotech_backups REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'ssinfotech_backups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ssinfotech_backups;
    END IF;
END $$;

-- 6. Verify
SELECT
    (SELECT COUNT(*) FROM public.ssinfotech_backups)            AS snapshots,
    (SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'ssinfotech_backups')                  AS policies,
    (SELECT COUNT(*) FROM pg_trigger
      WHERE tgname = 'trg_ssinfotech_backups_prune')           AS prune_trigger;
