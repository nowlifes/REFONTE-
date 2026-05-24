# Système Duel — Design Spec
_Date : 2026-05-22 | Statut : APPROUVÉ_

## Contexte

Ajout d'un type de challenge `DUEL` dans la grille bingo. Quand un joueur tombe sur une cellule DUEL, il défie un autre joueur à un mini-jeu IRL. L'adversaire déclare le résultat. Le gagnant reçoit un badge + sabotage.

---

## Flow complet

```
Player A tape cellule DUEL
  → modale "Choisir un adversaire" (liste des joueurs de la session)
  → DuelRequestBanner plein écran sur le téléphone de B (couleur #FF2D6A)
  → B : Accepter / Décliner
    → Décliner : banner disparaît, A peut réessayer avec quelqu'un d'autre
    → Accepter : les deux phones affichent "GO ! [Nom du jeu]"
  → [IRL : ils jouent]
  → DuelResultBanner sur le phone de B : "J'ai gagné" / "J'ai perdu"
  → Résultats automatiques
```

**Si A gagne (B déclare "J'ai perdu") :**
- Cellule validée pour A
- A reçoit badge `DUELISTE_WINNER`

**Si B gagne (B déclare "J'ai gagné") :**
- Cellule non validée pour A (A peut retenter avec quelqu'un d'autre)
- B reçoit badge `DUELISTE_WINNER` + 1 sabotage

---

## Base de données

### Nouvelle table `duel_requests`

```sql
CREATE TABLE duel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_game_id TEXT NOT NULL,
  challenger_player_id TEXT NOT NULL,
  challenger_nickname TEXT NOT NULL,
  challenger_emoji TEXT NOT NULL,
  opponent_player_id TEXT NOT NULL,
  opponent_nickname TEXT NOT NULL,
  cell_id INT NOT NULL,
  challenge_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING | ACCEPTED | DECLINED | CHALLENGER_WON | OPPONENT_WON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- RLS : le challenger et l'opponent peuvent lire leur ligne
ALTER TABLE duel_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players can read own duels"
  ON duel_requests FOR SELECT
  USING (challenger_player_id = auth.uid()::text OR opponent_player_id = auth.uid()::text);
```

### Challenges DB — nouveaux enregistrements type DUEL

| text | type | description |
|------|------|-------------|
| "Staring contest — premier qui cligne perd" | DUEL | staring |
| "Pair ou impair — chacun cache des doigts, deviner la somme" | DUEL | fingers |
| "Course aux verres — qui finit en premier" | DUEL | drink |
| "Main chaude — poser les mains, esquiver" | DUEL | handslap |
| "Pile ou Face — 3 manches avec une vraie pièce 🪙 Best of 3" | DUEL | coinflip |
| "Pierre-Feuille-Ciseaux ✂️ Best of 3" | DUEL | pfc |
| "La Barbichette 🧔 Celui qui rit perd" | DUEL | barbichette |
| "Ni oui ni non 🚫 60s, premier qui craque perd" | DUEL | nouinonnon |
| "Mot interdit 🤫 60s sans prononcer le mot" | DUEL | motinterdit |
| "Je n'ai jamais 🫣 3 rounds, public juge" | DUEL | jamais |
| "Mime — 3 manches, 30s par mime 🎭 Meilleur score sur 3 gagne" | DUEL | mime |
| "Alphabet Rapide — Marques de voitures 🚗 Premier qui bloque perd" | DUEL | alphabet |
| "Alphabet Rapide — Pays 🌍 Premier qui bloque perd" | DUEL | alphabet |
| "Alphabet Rapide — Cocktails 🍹 Premier qui bloque perd" | DUEL | alphabet |

---

## Composants

### `DuelRequestBanner.tsx`
Deux phases dans le même composant, contrôlées par `duelRequest.status`.

**Phase 1 — PENDING** (côté opponent)
- Fond plein écran `#FF2D6A`
- Hero text : `"⚔️ [Challenger] te défie !"`
- Sous-titre : nom du jeu
- Boutons : **Accepter** (vert) / **Décliner** (gris discret)

**Phase 2 — ACCEPTED** (côté opponent, après acceptation)
- Fond `#FF2D6A` avec texte "C'EST PARTI !"
- Instructions du jeu (1 ligne)
- Boutons : **"J'ai gagné"** / **"J'ai perdu"** (apparaissent après 5s pour éviter les fats taps)

**Côté challenger (GamePage) :**
- Petite notification "⏳ [Adversaire] a accepté — jouez !" (toast, pas plein écran)
- Quand résultat déclaré : overlay résultat (victoire ou défaite)

### Modale sélection adversaire
- Liste des joueurs actifs de la session (excluant soi-même)
- Style card avec avatar + pseudo + score
- Tap → envoie la demande

---

## Services `gameService.ts`

```typescript
// Créer une demande de duel
requestDuel(gameId: string, cellId: number, challengeText: string, opponentPlayerId: string): Promise<void>

// Accepter / décliner
acceptDuel(duelId: string): Promise<void>
declineDuel(duelId: string): Promise<void>

// Déclarer le résultat (appelé par l'opponent)
declareDuelResult(duelId: string, opponentWon: boolean): Promise<void>
  // Si !opponentWon : validateCell(challengerGameId, cellId) + unlockBadge(challenger, 'DUELISTE_WINNER')
  // Si opponentWon  : unlockBadge(opponent, 'DUELISTE_WINNER') + awardSabotage(opponentPlayerId)

// Realtime listener (côté opponent)
subscribeDuelRequests(playerId: string, callback): () => void
  // channel : `duel_${playerId}`

// Realtime listener (côté challenger)
subscribeDuelStatus(duelId: string, callback): () => void
```

---

## Migration

`supabase/migrations/004_duel_mode.sql`
- Créer table `duel_requests`
- RLS policies
- Ajouter challenges DUEL en DB (INSERT dans `challenges`)

---

## Design tokens

| Élément | Valeur |
|---------|--------|
| Couleur duel | `#FF2D6A` |
| Gradient banner | `linear-gradient(180deg, #FF2D6A 0%, #CC1A50 100%)` |
| Icône | ⚔️ |
| Badge | `DUELISTE_WINNER` |
| Délai boutons résultat | 5s (anti-fats-tap) |

---

## Hors scope (v1)

- Historique des duels
- Classement "meilleur dueliste"
- Jeux 3 joueurs (prévu v2)
- Statistiques win/loss par joueur
