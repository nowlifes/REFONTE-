-- ============================================================
-- Migration: Add expires_at to sessions (auto-expiry after 6h)
-- Date: 2026-04-08
-- ============================================================

-- 1. Add expires_at column (nullable for backward compat with existing rows)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Update the player join policy to also block expired sessions
DROP POLICY IF EXISTS "players_join_open_session" ON players;

CREATE POLICY "players_join_open_session"
  ON players FOR INSERT
  WITH CHECK (
    session_id IS NULL
    OR EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id         = players.session_id
        AND sessions.status     = 'open'
        AND (
          sessions.expires_at IS NULL          -- legacy rows without expiry
          OR sessions.expires_at > NOW()       -- not yet expired
        )
    )
  );
