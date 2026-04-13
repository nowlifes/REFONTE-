-- ============================================================
-- PRE-GAME MIGRATION
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add pre-game columns to event_session
-- ============================================================
ALTER TABLE event_session
  ADD COLUMN IF NOT EXISTS pregame_phase       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pregame_subject_id  UUID    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS countdown_ends_at   TIMESTAMPTZ DEFAULT NULL;

-- pregame_phase values:
--   NULL              → no pre-game active
--   'TRUTH_LIE_SUBMIT' → players submitting their 3 statements
--   'TRUTH_LIE_VOTE'   → voting phase (pregame_subject_id = whose turn)
--   'HOT_TAKE_SUBMIT'  → players submitting hot takes
--   'HOT_TAKE_VOTE'    → live thumbs up/down phase
--   'DONE'             → pre-game finished, game can launch

-- 2. Truth / Lie — submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS pregame_tl_submissions (
  id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id    UUID          NOT NULL,
  nickname     TEXT          NOT NULL,
  avatar_id    TEXT          NOT NULL,
  statement_1  TEXT          NOT NULL,
  statement_2  TEXT          NOT NULL,
  statement_3  TEXT          NOT NULL,
  lie_index    INT           NOT NULL CHECK (lie_index BETWEEN 0 AND 2),
  session_id   UUID          REFERENCES sessions(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Prevent double-submission per player per game session
CREATE UNIQUE INDEX IF NOT EXISTS idx_tl_sub_player_session
  ON pregame_tl_submissions(player_id, session_id);

-- Enable Realtime
ALTER TABLE pregame_tl_submissions REPLICA IDENTITY FULL;

-- 3. Truth / Lie — votes
-- ============================================================
CREATE TABLE IF NOT EXISTS pregame_tl_votes (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_player_id   UUID          NOT NULL,
  subject_player_id UUID          NOT NULL,
  voted_index       INT           NOT NULL,
  session_id        UUID          REFERENCES sessions(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(voter_player_id, subject_player_id, session_id)
);

ALTER TABLE pregame_tl_votes REPLICA IDENTITY FULL;

-- 4. Hot Takes — submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS pregame_hot_takes (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id   UUID          NOT NULL,
  nickname    TEXT          NOT NULL,
  avatar_id   TEXT          NOT NULL,
  text        TEXT          NOT NULL,
  upvotes     INT           DEFAULT 0,
  downvotes   INT           DEFAULT 0,
  session_id  UUID          REFERENCES sessions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ht_player_session
  ON pregame_hot_takes(player_id, session_id);

ALTER TABLE pregame_hot_takes REPLICA IDENTITY FULL;

-- 5. Hot Takes — votes
-- ============================================================
CREATE TABLE IF NOT EXISTS pregame_ht_votes (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_player_id UUID          NOT NULL,
  hot_take_id     UUID          NOT NULL REFERENCES pregame_hot_takes(id) ON DELETE CASCADE,
  vote            TEXT          NOT NULL CHECK (vote IN ('UP', 'DOWN')),
  session_id      UUID          REFERENCES sessions(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(voter_player_id, hot_take_id)
);

ALTER TABLE pregame_ht_votes REPLICA IDENTITY FULL;

-- 6. Trigger: update hot_take upvotes/downvotes on vote insert/delete
-- ============================================================
CREATE OR REPLACE FUNCTION update_hot_take_votes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'UP' THEN
      UPDATE pregame_hot_takes SET upvotes = upvotes + 1 WHERE id = NEW.hot_take_id;
    ELSE
      UPDATE pregame_hot_takes SET downvotes = downvotes + 1 WHERE id = NEW.hot_take_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 'UP' THEN
      UPDATE pregame_hot_takes SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.hot_take_id;
    ELSE
      UPDATE pregame_hot_takes SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.hot_take_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_ht_vote ON pregame_ht_votes;
CREATE TRIGGER trg_ht_vote
  AFTER INSERT OR DELETE ON pregame_ht_votes
  FOR EACH ROW EXECUTE FUNCTION update_hot_take_votes();

-- 7. RLS — open for now (session-scoped via session_id)
-- ============================================================
ALTER TABLE pregame_tl_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregame_tl_votes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregame_hot_takes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregame_ht_votes       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_pregame_tl_submissions" ON pregame_tl_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pregame_tl_votes"       ON pregame_tl_votes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pregame_hot_takes"      ON pregame_hot_takes      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pregame_ht_votes"       ON pregame_ht_votes       FOR ALL USING (true) WITH CHECK (true);
