-- ============================================================
-- Migration: reset_all_data() — ajout WHERE sur UPDATE event_session
-- Date: 2026-06-12
-- Problème (prod) : créer une nouvelle partie échouait avec
--   "UPDATE requires a WHERE clause". L'extension pg-safeupdate est
--   active sur le projet → tout UPDATE/DELETE SQL sans WHERE est rejeté.
--   reset_all_data() (déf. en 006, répliquée en 013) faisait
--   `UPDATE event_session SET ...` SANS clause WHERE → reset_all_data
--   levait l'erreur → createNewSession() plantait → impossible de
--   lancer une soirée.
-- Fix : `WHERE id IS NOT NULL` (event_session est une table mono-ligne,
--   id=1). Satisfait pg-safeupdate, cible toutes les lignes existantes.
--   CREATE OR REPLACE idempotent.
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
  -- WHERE id IS NOT NULL : requis par pg-safeupdate (pas d'UPDATE nu).
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
    max_validations_per_bar = 0
  WHERE id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_all_data() TO anon, authenticated;
