-- ============================================================
-- Migration: Event Session Game Controls
-- Date: 2026-04-20
-- ============================================================
-- Colonnes ajoutées manuellement en prod — migration rétroactive.
-- Toutes les clauses sont IF NOT EXISTS : safe à rejouer.
--
-- Colonnes :
--   is_paused               : BOOLEAN  — master met la partie en pause
--   current_bar             : INT      — index du bar actuel (1-based)
--   bar_cadence             : TEXT     — ex. '1,2,2' (challenges/bar)
--   chaos_mode              : BOOLEAN  — mode chaos activé
--   max_validations_per_bar : INT      — 0 = illimité
-- ============================================================

ALTER TABLE event_session
  ADD COLUMN IF NOT EXISTS is_paused               BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_bar             INT      DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bar_cadence             TEXT     DEFAULT '1,2,2',
  ADD COLUMN IF NOT EXISTS chaos_mode              BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_validations_per_bar INT      DEFAULT 0;
