-- ============================================================
-- Migration: reset_all_data() — ajout duel_requests + boost_votes
-- Date: 2026-06-09
-- Problème (audit) : reset_all_data() ne purgeait ni duel_requests
--   ni boost_votes → données orphelines après chaque reset/new session
--   (vieux duels PENDING, votes d'enchères de la soirée précédente).
-- Fix : ajout des deux tables au TRUNCATE CASCADE. CREATE OR REPLACE
--   idempotent — le reste de la fonction est inchangé.
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
    boost_votes,
    duel_requests,
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

GRANT EXECUTE ON FUNCTION reset_all_data() TO anon, authenticated;
