# Système Duel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un type de challenge `PVP` (déjà dans l'enum) qui déclenche un duel IRL entre deux joueurs via un flow request/accept/result symétrique au système witness.

**Architecture:** Nouvelle table Supabase `duel_requests` avec realtime. Deux composants React (`DuelOpponentPicker`, `DuelRequestBanner`). Cinq méthodes dans `gameService.ts`. Intégration minimale dans `GamePage.tsx`.

**Tech Stack:** React 19 + TypeScript, Supabase (postgres_changes realtime), Tailwind v4, bun

---

## File Map

| Fichier | Action | Rôle |
|---------|--------|------|
| `supabase/migrations/004_duel_mode.sql` | CREATE | Table duel_requests + RLS + INSERT challenges |
| `services/gameService.ts` | MODIFY | 5 nouvelles méthodes duel |
| `components/DuelOpponentPicker.tsx` | CREATE | Modale sélection adversaire |
| `components/DuelRequestBanner.tsx` | CREATE | Banner plein écran côté opponent (2 phases) |
| `components/GamePage.tsx` | MODIFY | Import + mount des 2 composants, handler cellule PVP |

---

## Task 1 — Migration SQL

**Files:**
- Create: `supabase/migrations/004_duel_mode.sql`

- [ ] **Step 1 : Créer la migration**

```sql
-- supabase/migrations/004_duel_mode.sql

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
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  resolved_at          TIMESTAMPTZ
);

-- Index pour les queries realtime
CREATE INDEX IF NOT EXISTS duel_requests_opponent_idx
  ON public.duel_requests (opponent_player_id, status);
CREATE INDEX IF NOT EXISTS duel_requests_challenger_idx
  ON public.duel_requests (challenger_player_id, status);

-- RLS
ALTER TABLE public.duel_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duel_read_own"
  ON public.duel_requests FOR SELECT
  USING (
    challenger_player_id = auth.uid()::text
    OR opponent_player_id = auth.uid()::text
  );

CREATE POLICY "duel_insert_challenger"
  ON public.duel_requests FOR INSERT
  WITH CHECK (challenger_player_id = auth.uid()::text);

CREATE POLICY "duel_update_opponent"
  ON public.duel_requests FOR UPDATE
  USING (
    opponent_player_id = auth.uid()::text
    OR challenger_player_id = auth.uid()::text
  );

-- Challenges PVP (type 'PVP' correspond à ChallengeType.PVP dans types.ts)
INSERT INTO public.challenges (text, type, is_partner) VALUES
  ('Staring contest — premier qui cligne perd 👁️',         'PVP', false),
  ('Pair ou impair — chacun cache des doigts, deviner la somme ✋', 'PVP', false),
  ('Course aux verres — qui finit sa boisson en premier 🍺', 'PVP', false),
  ('Main chaude — poser les mains sur celles de l''autre, esquiver 🖐️', 'PVP', false),
  ('Miroir — copier tous les mouvements de l''autre pendant 30s 🪞', 'PVP', false),
  ('Swap identité — pendant 90s tu incarnes l''autre 🎭',   'PVP', false),
  ('Négociation impossible — 60s pour convaincre l''autre de faire un truc absurde 🤝', 'PVP', false),
  ('Pile ou Face — 3 manches avec une vraie pièce 🪙 Best of 3, l''adversaire déclare le résultat', 'PVP', false)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2 : Appliquer via Supabase MCP**

Utiliser `mcp__claude_ai_Supabase__apply_migration` avec le contenu ci-dessus sur le project `wcxtekmihkypevjdfffs`.

- [ ] **Step 3 : Vérifier**

Utiliser `mcp__claude_ai_Supabase__list_tables` — `duel_requests` doit apparaître.
Utiliser `mcp__claude_ai_Supabase__execute_sql` : `SELECT count(*) FROM challenges WHERE type = 'PVP'` → doit retourner 7.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/004_duel_mode.sql
git commit -m "feat: migration duel_requests table + 7 challenges PVP"
```

---

## Task 2 — Service methods

**Files:**
- Modify: `services/gameService.ts` (ajouter après la ligne `subscribeWitnessRequests`)

- [ ] **Step 1 : Ajouter les 5 méthodes à la fin de la classe GameService**

Localiser la ligne `subscribeWitnessRequests` (~1800) dans `services/gameService.ts` et ajouter après `}` de cette méthode :

```typescript
// ─── DUEL (PVP challenges) ──────────────────────────────────────────────────

/** Challenger (Player A) envoie une demande de duel à Player B */
async requestDuel(
  gameId: string,
  cellId: number,
  challengeText: string,
  challengerPlayerId: string,
  challengerNickname: string,
  challengerEmoji: string,
  opponentPlayerId: string,
  opponentNickname: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('duel_requests')
    .insert({
      challenger_game_id:   gameId,
      challenger_player_id: challengerPlayerId,
      challenger_nickname:  challengerNickname,
      challenger_emoji:     challengerEmoji,
      opponent_player_id:   opponentPlayerId,
      opponent_nickname:    opponentNickname,
      cell_id:              cellId,
      challenge_text:       challengeText,
      status:               'PENDING',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Opponent (Player B) accepte */
async acceptDuel(duelId: string): Promise<void> {
  const { error } = await supabase
    .from('duel_requests')
    .update({ status: 'ACCEPTED' })
    .eq('id', duelId);
  if (error) throw error;
}

/** Opponent (Player B) décline */
async declineDuel(duelId: string): Promise<void> {
  const { error } = await supabase
    .from('duel_requests')
    .update({ status: 'DECLINED', resolved_at: new Date().toISOString() })
    .eq('id', duelId);
  if (error) throw error;
}

/**
 * Opponent (Player B) déclare le résultat.
 * opponentWon = true  → B gagne : badge + sabotage pour B
 * opponentWon = false → A gagne : cellule validée pour A, badge pour A
 */
async declareDuelResult(duelId: string, opponentWon: boolean): Promise<void> {
  // 1. Lire le duel
  const { data: duel, error: fetchError } = await supabase
    .from('duel_requests')
    .select('*')
    .eq('id', duelId)
    .single();
  if (fetchError || !duel) throw fetchError ?? new Error('Duel not found');

  const newStatus = opponentWon ? 'OPPONENT_WON' : 'CHALLENGER_WON';

  // 2. Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('duel_requests')
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq('id', duelId);
  if (updateError) throw updateError;

  if (!opponentWon) {
    // A gagne → valider la cellule + badge challenger
    await this.validateCell(
      duel.challenger_game_id,
      duel.cell_id,
      { witnessName: duel.opponent_nickname, witnessSignature: 'duel-win' },
      true,
    );
    await this.unlockBadge(duel.challenger_player_id, 'DUELISTE_WINNER', true);
  } else {
    // B gagne → badge + sabotage opponent
    await this.unlockBadge(duel.opponent_player_id, 'DUELISTE_WINNER', true);
    // Sabotage : réutilise awardBonusTaunt sur le game actif de B
    // (chercher le game_id de B depuis la session courante via son player_id)
    const { data: opponentGame } = await supabase
      .from('games')
      .select('id')
      .eq('player_id', duel.opponent_player_id)
      .eq('status', 'active')
      .maybeSingle();
    if (opponentGame) {
      await this.awardBonusTaunt(opponentGame.id);
    }
  }
}

/** Realtime — côté opponent : écoute les nouvelles demandes de duel */
subscribeDuelRequests(
  playerId: string,
  onRequests: (requests: any[]) => void,
): () => void {
  const refetch = async () => {
    const { data } = await supabase
      .from('duel_requests')
      .select('*')
      .eq('opponent_player_id', playerId)
      .in('status', ['PENDING', 'ACCEPTED'])
      .order('created_at', { ascending: false });
    onRequests(data ?? []);
  };

  refetch();

  const channel = supabase
    .channel(`duel_opponent_${playerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'duel_requests',
        filter: `opponent_player_id=eq.${playerId}`,
      },
      refetch,
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/** Realtime — côté challenger : écoute le statut d'un duel spécifique */
subscribeDuelStatus(
  duelId: string,
  onUpdate: (duel: any) => void,
): () => void {
  const refetch = async () => {
    const { data } = await supabase
      .from('duel_requests')
      .select('*')
      .eq('id', duelId)
      .maybeSingle();
    if (data) onUpdate(data);
  };

  refetch();

  const channel = supabase
    .channel(`duel_status_${duelId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'duel_requests',
        filter: `id=eq.${duelId}`,
      },
      refetch,
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
bun run build 2>&1 | grep -E "error TS|duel"
```

Attendu : 0 erreurs.

- [ ] **Step 3 : Commit**

```bash
git add services/gameService.ts
git commit -m "feat: service duel — requestDuel, acceptDuel, declineDuel, declareDuelResult, subscribe"
```

---

## Task 3 — DuelOpponentPicker

**Files:**
- Create: `components/DuelOpponentPicker.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// components/DuelOpponentPicker.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { gameService } from '../services/gameService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  currentPlayerId: string;
  gameId: string;
  cellId: number;
  challengeText: string;
  challengerNickname: string;
  challengerEmoji: string;
  onDuelSent: (duelId: string) => void;
  onClose: () => void;
}

const DuelOpponentPicker: React.FC<Props> = ({
  currentPlayerId, gameId, cellId, challengeText,
  challengerNickname, challengerEmoji, onDuelSent, onClose,
}) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    gameService.getLeaderboard(currentPlayerId).then((entries) => {
      setPlayers(entries.filter(e => e.userId !== currentPlayerId));
    });
  }, [currentPlayerId]);

  const handlePick = async (opponent: any) => {
    if (sending) return;
    setSending(opponent.userId);
    try {
      const duelId = await gameService.requestDuel(
        gameId, cellId, challengeText,
        currentPlayerId, challengerNickname, challengerEmoji,
        opponent.userId, opponent.pseudo,
      );
      onDuelSent(duelId);
    } catch (e) {
      console.error(e);
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex flex-col bg-[#0A1629]"
      style={{ paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-4 border-b-[3px] border-white/10">
        <p className="font-impact uppercase text-white text-xl tracking-wide">⚔️ Choisir un adversaire</p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl border-[2px] border-white/20"
        >
          <X size={18} strokeWidth={2.5} className="text-white/60" />
        </button>
      </div>

      {/* Challenge rappel */}
      <div className="mx-5 mt-4 px-4 py-3 bg-[#FF2D6A]/15 border-[3px] border-[#FF2D6A] rounded-2xl">
        <p className="font-impact uppercase text-[#FF2D6A] text-xs tracking-widest mb-1">Le défi</p>
        <p className="font-impact text-white text-base uppercase leading-snug">"{challengeText}"</p>
      </div>

      {/* Liste joueurs */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-3"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 16px)' }}>
        {players.length === 0 && (
          <p className="text-white/40 font-impact uppercase text-center mt-8 text-sm tracking-widest">
            Aucun autre joueur actif
          </p>
        )}
        {players.map((p) => (
          <button
            key={p.userId}
            onClick={() => handlePick(p)}
            disabled={!!sending}
            className="flex items-center gap-4 w-full px-4 py-4 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FF2D6A] border-[3px] border-black flex items-center justify-center text-xl font-impact">
              {p.avatarId ?? '🎯'}
            </div>
            <div className="flex-1 text-left">
              <p className="font-impact uppercase text-black text-base leading-none">{p.pseudo}</p>
              <p className="font-impact text-black/40 text-xs uppercase tracking-widest mt-0.5">{p.score} pts</p>
            </div>
            {sending === p.userId
              ? <span className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
              : <span className="font-impact text-[#FF2D6A] uppercase text-xs tracking-widest">Défier ⚔️</span>
            }
          </button>
        ))}
      </div>
    </div>
  );
};

export default DuelOpponentPicker;
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
bun run build 2>&1 | grep "DuelOpponentPicker\|error TS"
```

Attendu : 0 erreurs.

- [ ] **Step 3 : Commit**

```bash
git add components/DuelOpponentPicker.tsx
git commit -m "feat: DuelOpponentPicker — modale sélection adversaire"
```

---

## Task 4 — DuelRequestBanner

**Files:**
- Create: `components/DuelRequestBanner.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// components/DuelRequestBanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { gameService } from '../services/gameService';

interface Props {
  playerId: string;
}

const DuelRequestBanner: React.FC<Props> = ({ playerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [phase, setPhase] = useState<'pick' | 'playing'>('pick');
  const [resultReady, setResultReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const seenRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playerId) return;
    return gameService.subscribeDuelRequests(playerId, (reqs) => {
      setRequests(reqs);
      reqs.forEach((r: any) => {
        if (!seenRef.current.has(r.id)) {
          seenRef.current.add(r.id);
          if (navigator.vibrate) navigator.vibrate([100, 80, 200]);
        }
        // Si ce duel est ACCEPTED et on est en phase "pick" → passer à playing
        if (r.status === 'ACCEPTED') {
          setPhase('playing');
          // Délai 5s avant d'afficher les boutons résultat (anti-fats-tap)
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setResultReady(true), 5000);
        }
      });
    });
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const visible = requests.filter(r => !dismissed.has(r.id) && r.status !== 'DECLINED');
  if (visible.length === 0) return null;
  const current = visible[0];

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    setPhase('pick');
    setResultReady(false);
  };

  const handleAccept = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gameService.acceptDuel(current.id);
      setPhase('playing');
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const handleDecline = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gameService.declineDuel(current.id);
      dismiss(current.id);
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const handleResult = async (opponentWon: boolean) => {
    if (busy || !resultReady) return;
    setBusy(true);
    try {
      await gameService.declareDuelResult(current.id, opponentWon);
      dismiss(current.id);
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ background: '#0A1629' }}
    >
      {/* Zone haute — rose, challenge */}
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-8"
        style={{
          background: 'linear-gradient(180deg, #FF2D6A 0%, #CC1A50 100%)',
          paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 40px)',
        }}
      >
        {/* Icône */}
        <div className="mb-6">
          <div className="w-14 h-14 bg-black/20 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_black]">
            <span className="text-2xl">⚔️</span>
          </div>
        </div>

        {/* Badge statut */}
        <div className="inline-flex items-center gap-1.5 bg-black text-[#FF2D6A] px-2.5 py-1 rounded-lg mb-3 w-fit">
          <span className="font-impact text-[9px] uppercase tracking-widest">
            {phase === 'pick' ? 'DUEL INCOMING' : "C'EST PARTI !"}
          </span>
        </div>

        {/* Qui défie */}
        <p className="font-impact text-black/60 uppercase text-[11px] tracking-widest mb-2">
          {current.challenger_emoji} {current.challenger_nickname} te défie
        </p>

        {/* Challenge hero */}
        <div className="bg-black/15 border-[3px] border-black/20 rounded-2xl px-5 py-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
          <p className="font-impact text-black text-[22px] uppercase leading-tight italic tracking-tight">
            "{current.challenge_text}"
          </p>
        </div>

        {phase === 'playing' && (
          <p className="mt-4 font-impact text-black/50 uppercase text-[10px] tracking-widest leading-relaxed">
            Jouez ! Déclare le résultat quand c'est terminé.
          </p>
        )}
        {phase === 'pick' && (
          <p className="mt-4 font-impact text-black/50 uppercase text-[10px] tracking-widest leading-relaxed">
            Acceptes-tu ce défi ?
          </p>
        )}
      </div>

      {/* Zone basse — sombre, boutons */}
      <div
        className="shrink-0 bg-[#0A1629] border-t-[3px] border-black px-5 pt-5 flex flex-col gap-3"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {phase === 'pick' ? (
          <>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="w-full py-5 bg-[#00FF9D] text-black rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {busy
                ? <span className="w-6 h-6 border-[3px] border-black/30 border-t-black rounded-full animate-spin" />
                : <><Check size={22} strokeWidth={3} /> Accepter le duel</>
              }
            </button>
            <button
              onClick={handleDecline}
              disabled={busy}
              className="w-full py-4 bg-white/5 border-[2px] border-white/15 text-white/50 rounded-2xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-40"
            >
              <X size={16} strokeWidth={2.5} />
              Décliner
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleResult(false)}
              disabled={busy || !resultReady}
              className="w-full py-5 bg-[#FF2D6A] text-white rounded-2xl font-impact uppercase text-xl border-[3px] border-black shadow-[5px_5px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-3"
            >
              {!resultReady
                ? <span className="font-impact text-white/60 text-sm">Attends la fin du duel…</span>
                : '🏆 J\'ai gagné'
              }
            </button>
            <button
              onClick={() => handleResult(true)}
              disabled={busy || !resultReady}
              className="w-full py-4 bg-white/5 border-[2px] border-white/15 text-white/50 rounded-2xl font-impact uppercase text-[13px] tracking-widest flex items-center justify-center gap-2 active:bg-white/10 transition-all disabled:opacity-40"
            >
              💀 J'ai perdu
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DuelRequestBanner;
```

> **Note :** Les boutons résultat sont désactivés 5s (anti-fats-tap) après que le duel passe en `ACCEPTED`. `resultReady` passe à `true` après le timer.

- [ ] **Step 2 : Vérifier TypeScript**

```bash
bun run build 2>&1 | grep "DuelRequestBanner\|error TS"
```

Attendu : 0 erreurs.

- [ ] **Step 3 : Commit**

```bash
git add components/DuelRequestBanner.tsx
git commit -m "feat: DuelRequestBanner — banner plein écran duel (2 phases pick/result)"
```

---

## Task 5 — Intégration GamePage

**Files:**
- Modify: `components/GamePage.tsx`

- [ ] **Step 1 : Ajouter les imports**

Ajouter après la ligne `import WitnessRequestBanner from './WitnessRequestBanner';` :

```tsx
import DuelRequestBanner from './DuelRequestBanner';
import DuelOpponentPicker from './DuelOpponentPicker';
```

- [ ] **Step 2 : Ajouter les états duel**

Localiser le bloc des `useState` en haut du composant `GamePage` et ajouter :

```tsx
const [duelPicker, setDuelPicker] = useState<{
  cellId: number;
  challengeText: string;
} | null>(null);
const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
const [duelResult, setDuelResult] = useState<'won' | 'lost' | 'declined' | null>(null);
```

- [ ] **Step 3 : Abonnement realtime duel status (côté challenger)**

Localiser le `useEffect` qui monte `WitnessRequestBanner` (ou proche de la zone realtime) et ajouter :

```tsx
useEffect(() => {
  if (!activeDuelId) return;
  return gameService.subscribeDuelStatus(activeDuelId, (duel) => {
    if (duel.status === 'CHALLENGER_WON') {
      setDuelResult('won');
      setActiveDuelId(null);
    } else if (duel.status === 'OPPONENT_WON') {
      setDuelResult('lost');
      setActiveDuelId(null);
    } else if (duel.status === 'DECLINED') {
      setDuelResult('declined');
      setActiveDuelId(null);
    }
  });
}, [activeDuelId]);
```

- [ ] **Step 4 : Handler cellule PVP**

Localiser le handler `onCellTap` (ou équivalent) dans GamePage. Ajouter une branche pour `ChallengeType.PVP` :

```tsx
// Dans le handler de tap sur une cellule
if (cell.type === ChallengeType.PVP && cell.status !== CellStatus.VALIDATED) {
  setDuelPicker({ cellId: cell.id, challengeText: cell.text });
  return;
}
```

- [ ] **Step 5 : Monter les composants dans le JSX**

Juste après `<WitnessRequestBanner playerId={...} />` :

```tsx
{/* Duel request banner — côté opponent */}
<DuelRequestBanner playerId={localStorage.getItem('bingo_user_id') || ''} />

{/* Duel opponent picker — côté challenger */}
{duelPicker && gameSession && playerProfile && (
  <DuelOpponentPicker
    currentPlayerId={localStorage.getItem('bingo_user_id') || ''}
    gameId={gameSession.id}
    cellId={duelPicker.cellId}
    challengeText={duelPicker.challengeText}
    challengerNickname={playerProfile.pseudo}
    challengerEmoji={playerProfile.avatarId ?? '🎯'}
    onDuelSent={(duelId) => {
      setActiveDuelId(duelId);
      setDuelPicker(null);
    }}
    onClose={() => setDuelPicker(null)}
  />
)}

{/* Overlay résultat duel */}
{duelResult && (
  <div
    className="fixed inset-0 z-[400] flex items-center justify-center"
    style={{ background: 'rgba(10,22,41,0.95)' }}
    onClick={() => setDuelResult(null)}
  >
    <div className="text-center px-8">
      {duelResult === 'won' && (
        <>
          <p className="text-7xl mb-4">🏆</p>
          <p className="font-impact uppercase text-[#00FF9D] text-4xl">Victoire !</p>
          <p className="font-impact uppercase text-white/60 text-sm mt-2 tracking-widest">Cellule validée</p>
        </>
      )}
      {duelResult === 'lost' && (
        <>
          <p className="text-7xl mb-4">💀</p>
          <p className="font-impact uppercase text-[#FF2D6A] text-4xl">Défaite</p>
          <p className="font-impact uppercase text-white/60 text-sm mt-2 tracking-widest">Retente avec quelqu'un d'autre</p>
        </>
      )}
      {duelResult === 'declined' && (
        <>
          <p className="text-7xl mb-4">🫤</p>
          <p className="font-impact uppercase text-white text-3xl">Refusé</p>
          <p className="font-impact uppercase text-white/60 text-sm mt-2 tracking-widest">Essaie avec un autre joueur</p>
        </>
      )}
      <p className="font-impact text-white/30 text-xs uppercase tracking-widest mt-6">Tap pour fermer</p>
    </div>
  </div>
)}
```

- [ ] **Step 6 : Vérifier TypeScript + lancer le dev server**

```bash
bun run build 2>&1 | grep "error TS"
bun run dev --port 5174
```

Attendu : build propre, app accessible sur `localhost:5174`.

- [ ] **Step 7 : Tester le flow complet**

Test manuel avec 2 onglets/devices :
1. Device A → taper une cellule PVP → DuelOpponentPicker s'ouvre
2. Choisir Device B → DuelRequestBanner rose apparaît sur B
3. B accepte → banner passe en phase "C'EST PARTI !"
4. Après 5s → boutons résultat activés sur B
5. B déclare "J'ai gagné" → overlay résultat apparaît sur A ("Défaite")
6. Refaire → B déclare "J'ai perdu" → cellule validée sur A, overlay "Victoire !"

- [ ] **Step 8 : Commit**

```bash
git add components/GamePage.tsx
git commit -m "feat: intégration duel dans GamePage — picker + banner + overlay résultat"
```

---

## Self-Review

**Spec coverage check :**

| Requirement spec | Couvert par |
|-----------------|-------------|
| Cellule type PVP déclenche duel | Task 5 Step 4 |
| Modale sélection adversaire | Task 3 |
| Banner rose plein écran opponent | Task 4 |
| Accept / Decline | Task 4 + Task 2 |
| Phase "C'EST PARTI !" après accept | Task 4 (phase state) |
| Boutons résultat après 5s | Task 4 (timerRef) |
| Challenger gagne → cellule validée + badge | Task 2 declareDuelResult |
| Opponent gagne → badge + sabotage | Task 2 declareDuelResult |
| Overlay résultat côté challenger | Task 5 Step 5 |
| 7 challenges PVP en DB | Task 1 |
| Couleur #FF2D6A | Task 4 (design tokens appliqués) |

**Placeholder scan :** aucun TBD ou TODO — tout le code est complet.

**Type consistency :**
- `requestDuel` retourne `Promise<string>` (duelId) → utilisé dans `onDuelSent(duelId)` Task 5 ✓
- `subscribeDuelRequests` callback reçoit `any[]` — cohérent avec le pattern `subscribeWitnessRequests` ✓
- `declareDuelResult(duelId, opponentWon)` — nommage cohérent entre Task 2 et Task 4 ✓
