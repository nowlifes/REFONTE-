-- ============================================================
-- MASTER VALIDATIONS MIGRATION
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Master validation requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS master_validations (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       UUID          NOT NULL,
  cell_id       INT           NOT NULL,
  challenge_text TEXT         NOT NULL,
  player_nickname TEXT        NOT NULL,
  player_emoji  TEXT          NOT NULL DEFAULT '🎲',
  session_id    UUID          NOT NULL,
  status        TEXT          NOT NULL DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ   DEFAULT NULL
);

-- One pending request per player per cell per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_game_cell
  ON master_validations(game_id, cell_id)
  WHERE status = 'PENDING';

-- Enable Realtime
ALTER TABLE master_validations REPLICA IDENTITY FULL;

-- 2. Game control columns on event_session
-- ============================================================
ALTER TABLE event_session
  ADD COLUMN IF NOT EXISTS spotlight_disabled       BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS challenge_cooldown_secs  INT       DEFAULT 0;
-- challenge_cooldown_secs: seconds players must wait between cell validations (0 = no limit)

-- 3. RLS — open policies
-- ============================================================
ALTER TABLE master_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_master_validations" ON master_validations FOR ALL USING (true) WITH CHECK (true);
