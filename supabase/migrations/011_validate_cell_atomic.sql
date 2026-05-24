-- ============================================================
-- Migration: validate_cell_atomic RPC
-- Date: 2026-05-25
-- Problem: validateCell() faisait 2 round trips (SELECT + UPDATE).
--          Sur mobile avec RTT ~200ms = 400-600ms de latence perçue.
-- Fix: une seule UPDATE atomique qui appende la cellule dans
--      validated_cells[] et retourne la ligne complète.
--      Idempotent: si la cellule est déjà validée, le score
--      ne change pas et la ligne est retournée telle quelle.
-- ============================================================

CREATE OR REPLACE FUNCTION validate_cell_atomic(
  p_game_id uuid,
  p_cell_id int,
  p_proof jsonb
)
RETURNS SETOF games
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE games
  SET
    validated_cells = CASE
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(validated_cells) v
        WHERE (v->>'id')::int = p_cell_id
      )
      THEN validated_cells
      ELSE validated_cells || jsonb_build_array(
        jsonb_build_object(
          'id', p_cell_id,
          'timestamp', (extract(epoch from now()) * 1000)::bigint,
          'proof', p_proof
        )
      )
    END,
    score = CASE
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(validated_cells) v
        WHERE (v->>'id')::int = p_cell_id
      )
      THEN score
      ELSE score + 1
    END
  WHERE id = p_game_id
    AND status = 'ACTIVE'
  RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION validate_cell_atomic(uuid, int, jsonb) TO anon, authenticated;
