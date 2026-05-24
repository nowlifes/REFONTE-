-- ─── DUEL MODE — table duel_requests + 14 challenges PVP ─────────────────────

-- Étendre le CHECK constraint challenges pour autoriser PVP
ALTER TABLE public.challenges DROP CONSTRAINT challenges_type_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_type_check
  CHECK (type = ANY (ARRAY['AUTO'::text, 'WITNESS'::text, 'MASTER'::text, 'PVP'::text]));

-- Table duel_requests
CREATE TABLE IF NOT EXISTS public.duel_requests (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_game_id   TEXT         NOT NULL,
  challenger_player_id TEXT         NOT NULL,
  challenger_nickname  TEXT         NOT NULL,
  challenger_emoji     TEXT         NOT NULL DEFAULT '🎯',
  opponent_player_id   TEXT         NOT NULL,
  opponent_nickname    TEXT         NOT NULL,
  cell_id              INT          NOT NULL,
  challenge_text       TEXT         NOT NULL,
  status               TEXT         NOT NULL DEFAULT 'PENDING',
  -- PENDING | ACCEPTED | DECLINED | CHALLENGER_WON | OPPONENT_WON
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  resolved_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS duel_requests_opponent_idx
  ON public.duel_requests (opponent_player_id, status);
CREATE INDEX IF NOT EXISTS duel_requests_challenger_idx
  ON public.duel_requests (challenger_player_id, status);

ALTER TABLE public.duel_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duel_read_own"
  ON public.duel_requests FOR SELECT
  USING (challenger_player_id = auth.uid()::text OR opponent_player_id = auth.uid()::text);

CREATE POLICY "duel_insert_challenger"
  ON public.duel_requests FOR INSERT
  WITH CHECK (challenger_player_id = auth.uid()::text);

CREATE POLICY "duel_update_any"
  ON public.duel_requests FOR UPDATE
  USING (opponent_player_id = auth.uid()::text OR challenger_player_id = auth.uid()::text);

-- 14 challenges PVP (order_num 200-213, hors plage des challenges existants 1-101)
INSERT INTO public.challenges (text_en, text_fr, type, category, order_num, is_partner) VALUES
  ('Rock-Paper-Scissors ✂️ — best of 3, opponent declares result',
   'Pierre-Feuille-Ciseaux ✂️ — best of 3, l''adversaire déclare le résultat',
   'PVP','PARTY',200,false),
  ('La Barbichette 🧔 — hold each other''s chin, first one to laugh loses',
   'La Barbichette 🧔 — "Je te tiens, tu me tiens par la barbichette — le premier qui rira aura une tapette"',
   'PVP','PARTY',201,false),
  ('Coin Flip 🪙 — best of 3 with a real coin, opponent declares result',
   'Pile ou Face 🪙 — 3 manches avec une vraie pièce, l''adversaire déclare le résultat',
   'PVP','PARTY',202,false),
  ('Staring contest 👁️ — first to blink loses',
   'Staring contest 👁️ — premier qui cligne des yeux perd',
   'PVP','PARTY',203,false),
  ('Hot hands 🖐️ — place your hands on opponent''s, try to slap before they pull away',
   'Main chaude 🖐️ — poser les mains sur celles de l''adversaire, esquiver avant de se faire taper',
   'PVP','PARTY',204,false),
  ('Odd or Even ✋ — both hide fingers, guess the total. Best of 3.',
   'Pair ou impair ✋ — chacun cache des doigts, deviner si la somme est paire ou impaire. Best of 3.',
   'PVP','PARTY',205,false),
  ('Drink race 🍺 — first to finish their drink wins',
   'Course aux verres 🍺 — qui finit sa boisson en premier gagne',
   'PVP','PARTY',206,false),
  ('No yes no no 🚫 — 60s of questions, forbidden to say yes or no. First to slip loses.',
   'Ni oui ni non 🚫 — 60s de questions, interdit de dire oui ou non. Premier qui craque perd.',
   'PVP','SOCIALS',207,false),
  ('Forbidden word 🤫 — talk for 60s without saying the secret word. Loser says it first.',
   'Mot interdit 🤫 — parlez 60s sans prononcer le mot secret. Celui qui le dit perd.',
   'PVP','SOCIALS',208,false),
  ('Never have I ever 🫣 — 3 rounds, crowd judges who''s bluffing',
   'Je n''ai jamais 🫣 — 3 rounds, le public juge qui bluffe',
   'PVP','SOCIALS',209,false),
  ('Speed Alphabet 🚗 Car brands — take turns, first to blank out loses',
   'Alphabet Rapide 🚗 Marques de voitures — à tour de rôle, premier qui bloque perd',
   'PVP','CULTURE',210,false),
  ('Speed Alphabet 🌍 Countries — take turns, first to blank out loses',
   'Alphabet Rapide 🌍 Pays — à tour de rôle, premier qui bloque perd',
   'PVP','CULTURE',211,false),
  ('Speed Alphabet 🍹 Cocktails — take turns, first to blank out loses',
   'Alphabet Rapide 🍹 Cocktails — à tour de rôle, premier qui bloque perd',
   'PVP','CULTURE',212,false),
  ('Mime 🎭 — 3 rounds of 30s, opponent guesses. Best score wins.',
   'Mime 🎭 — 3 manches de 30s, l''adversaire devine. Meilleur score sur 3 gagne.',
   'PVP','THEATRICALS',213,false)
ON CONFLICT DO NOTHING;
