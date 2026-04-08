-- ============================================================
-- Migration: Secure Session System (UUID-based QR code guard)
-- Date: 2026-04-08
-- ============================================================

-- 1. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status     TEXT        NOT NULL DEFAULT 'waiting'
               CHECK (status IN ('waiting', 'open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for QR validation by anon players)
CREATE POLICY "sessions_public_read"
  ON sessions FOR SELECT
  USING (true);

-- Anon key can insert/update (Master uses anon key in gameService)
-- Tighten to authenticated role once master auth is in place.
CREATE POLICY "sessions_anon_insert"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "sessions_anon_update"
  ON sessions FOR UPDATE
  USING (true);

-- 3. Add session_id FK to players table (nullable for backward compat)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

-- 4. Enable RLS on players (safe no-op if already enabled)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Anyone can read leaderboard / player data
CREATE POLICY "players_public_read"
  ON players FOR SELECT
  USING (true);

-- A player may only INSERT themselves into an OPEN session.
-- If no session_id is provided (legacy insert), it is allowed.
CREATE POLICY "players_join_open_session"
  ON players FOR INSERT
  WITH CHECK (
    session_id IS NULL
    OR EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id    = players.session_id
        AND sessions.status = 'open'
    )
  );

-- Updates are unrestricted (score sync, taunt, etc.)
CREATE POLICY "players_unrestricted_update"
  ON players FOR UPDATE
  USING (true);

-- 5. Enable Realtime on sessions so clients get pushed updates
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
