-- ============================================================
-- Migration: use_joker_atomic RPC
-- Date: 2026-06-09
-- Problème (bugs 1 & 2 de l'audit) :
--   useJoker() faisait fetch + update (non atomique) et :
--     1. ignorait jokers_bonus → "No jokers left" alors que l'UI
--        affichait des jokers gagnés (combo / ligne) → swap cassé.
--     2. recalculait score = validated_cells.length → écrasait les
--        +1 de duel et les -2 de trap_penalty, et perdait toute
--        validation (témoin/master) arrivée entre le fetch et l'update.
-- Fix : une RPC atomique avec FOR UPDATE qui
--     - respecte le total réel de jokers (2 - used + bonus)
--     - ne décrémente le score que si la cellule était validée
--     - verrouille la ligne le temps du swap.
--   Idempotent / sûr : si plus de jokers ou jeu inactif → set vide.
-- ============================================================

CREATE OR REPLACE FUNCTION use_joker_atomic(
  p_game_id uuid,
  p_cell_id int,
  p_new_text text,
  p_new_type text
)
RETURNS SETOF games
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  g games%ROWTYPE;
  v_available int;
  v_was_validated boolean;
BEGIN
  -- Verrou ligne : empêche fetch/update concurrent (validation témoin, double-tap)
  SELECT * INTO g FROM games WHERE id = p_game_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN; -- jeu inactif → set vide (le client retombe sur le cache)
  END IF;

  -- Jokers réellement disponibles : 2 de base - utilisés + bonus gagnés
  v_available := 2 - COALESCE(g.jokers_used, 0) + COALESCE(g.jokers_bonus, 0);
  IF v_available <= 0 THEN
    RETURN; -- plus de jokers → set vide
  END IF;

  -- La cellule swappée était-elle déjà validée ? (pour ajuster le score)
  v_was_validated := EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(g.validated_cells, '[]'::jsonb)) v
    WHERE (v->>'id')::int = p_cell_id
  );

  UPDATE games SET
    grid_challenges = (
      SELECT jsonb_agg(
        CASE WHEN (c->>'id')::int = p_cell_id
          THEN jsonb_set(jsonb_set(c, '{text}', to_jsonb(p_new_text)), '{type}', to_jsonb(p_new_type))
          ELSE c
        END
      )
      FROM jsonb_array_elements(grid_challenges) c
    ),
    validated_cells = (
      SELECT COALESCE(jsonb_agg(v), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(validated_cells, '[]'::jsonb)) v
      WHERE (v->>'id')::int <> p_cell_id
    ),
    -- Préserve les ajustements externes (duel +1, trap -2) : on retire juste
    -- le point de la cellule swappée si elle était validée.
    score = GREATEST(0, score - (CASE WHEN v_was_validated THEN 1 ELSE 0 END)),
    jokers_used = COALESCE(jokers_used, 0) + 1
  WHERE id = p_game_id
  RETURNING * INTO g;

  RETURN NEXT g;
END;
$$;

GRANT EXECUTE ON FUNCTION use_joker_atomic(uuid, int, text, text) TO anon, authenticated;
