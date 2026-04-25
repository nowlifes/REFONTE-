-- ============================================================
-- Migration: Core Game RPC Functions
-- Date: 2026-04-24
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Creates the 5 functions called by gameService.ts that were
-- missing from migrations (functions existed only in prod or
-- were never created). Safe to run multiple times (OR REPLACE).
-- ============================================================

-- 1. reset_all_data()
-- Wipes all player/game data for a fresh event session.
-- Called by MasterPage "Reset" button.
-- ============================================================
CREATE OR REPLACE FUNCTION reset_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE
    pregame_ht_votes,
    pregame_hot_takes,
    pregame_tl_votes,
    pregame_tl_submissions,
    player_badges,
    activities,
    master_validations,
    games,
    players
  CASCADE;

  -- Reset event_session to default state (keep the row, reset controls)
  UPDATE event_session SET
    is_active            = FALSE,
    pregame_phase        = NULL,
    pregame_subject_id   = NULL,
    countdown_ends_at    = NULL,
    transition_ends_at   = NULL,
    next_bar_name        = NULL,
    is_paused            = FALSE,
    current_bar          = 1,
    chaos_mode           = FALSE,
    max_validations_per_bar = 0;
END;
$$;

-- 2. award_bonus_joker(game_id UUID)
-- Grants +1 joker bonus to the player's game.
-- Called by useBingoGame when a spotlight or combo milestone is reached.
-- ============================================================
CREATE OR REPLACE FUNCTION award_bonus_joker(game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE games
  SET jokers_bonus = COALESCE(jokers_bonus, 0) + 1
  WHERE id = game_id AND status = 'ACTIVE';
END;
$$;

-- 3. award_bonus_taunt(game_id UUID)
-- Grants +1 taunt bonus to the player's game.
-- Called by useBingoGame when a spotlight or combo milestone is reached.
-- ============================================================
CREATE OR REPLACE FUNCTION award_bonus_taunt(game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE games
  SET taunts_bonus = COALESCE(taunts_bonus, 0) + 1
  WHERE id = game_id AND status = 'ACTIVE';
END;
$$;

-- 4. increment_taunts_sent(game_id UUID)
-- Tracks how many taunts a player has sent (stat only).
-- Called fire-and-forget after sendTaunt().
-- ============================================================
CREATE OR REPLACE FUNCTION increment_taunts_sent(game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE games
  SET taunts_sent = COALESCE(taunts_sent, 0) + 1
  WHERE id = game_id;
END;
$$;

-- 5. trap_penalty(victim_game_id UUID)
-- Applies a score penalty when a player steps on a trap (PvP mechanic).
-- Deducts 2 points, minimum 0.
-- ============================================================
CREATE OR REPLACE FUNCTION trap_penalty(victim_game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE games
  SET score = GREATEST(0, score - 2)
  WHERE id = victim_game_id AND status = 'ACTIVE';
END;
$$;

-- Grant execute to anon + authenticated roles
GRANT EXECUTE ON FUNCTION reset_all_data()                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION award_bonus_joker(UUID)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION award_bonus_taunt(UUID)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_taunts_sent(UUID)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION trap_penalty(UUID)                  TO anon, authenticated;
