-- ============================================================
-- Migration: Player Recovery Tokens (QR perso de récupération)
-- Date: 2026-04-20
-- ============================================================
-- Ajoute deux colonnes sur la table players :
--   recovery_token            : UUID généré à la demande par le master
--   recovery_token_expires_at : TIMESTAMPTZ, valide 24h
--
-- Flow :
--   1. Master ouvre la fiche joueur → bouton "QR"
--   2. App appelle generateRecoveryToken(playerId) → upsert dans players
--   3. QR encode : ?recover=<token>&s=<sessionId>
--   4. Joueur scanne → recoverByToken(token) → playerId → restaure la session
-- ============================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS recovery_token            UUID,
  ADD COLUMN IF NOT EXISTS recovery_token_expires_at TIMESTAMPTZ;

-- Index pour lookup rapide par token
CREATE UNIQUE INDEX IF NOT EXISTS players_recovery_token_idx
  ON players (recovery_token)
  WHERE recovery_token IS NOT NULL;
