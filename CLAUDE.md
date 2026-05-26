# Bingo Crawl Final

> Repo de référence unique. Toujours travailler dans `/Users/futharkiens/Projects/the-bingo-crawl`.
> Dev server : `bun run dev --port 5174`

## Wiki-Brain (session start obligatoire)

Avant toute chose, charger le contexte wiki — évite de relire le codebase brut :

1. Lire `wiki/index.md` — catalogue de tout ce qu'on sait
2. Lire `wiki/log.md` (10 dernières entrées) — activité récente
3. Lire `wiki/pages/synthesis/lessons.md` — règles apprises des erreurs passées
4. Question archi → `graphify-out/GRAPH_REPORT.md` section "God Nodes"

**Skill :** `/wiki-brain` pour charger tout le contexte d'un coup.
**Wiki :** `wiki/CLAUDE.md` pour le protocole complet.

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 (syntaxe `@theme` dans `index.css`, classes utilitaires `bg-[#hex]`)
- Supabase (PostgreSQL + RLS + RPC) — project `wcxtekmihkypevjdfffs`
- `bun` comme package manager — `bun install`, `bun run dev`
- Port dev : `5174`

## Design System

Voir [DESIGN.md](./DESIGN.md) pour le système complet.

**Règles critiques — ne jamais déroger :**

- **Fond global** : `bg-[#0A1629]` — jamais autre chose
- **Surfaces cartes** : `bg-white border-[3px] border-black` (design V2 validé)
- **Couleurs** : yellow `#FFD700`, green `#00F5A0`, pink `#FF2D6A`, orange `#FF8C00`
- **Ombres** : hard black uniquement — `shadow-[Xpx_Xpx_0px_black]`, jamais de soft shadow colorée
- **Borders** : `border-[3px] border-black` ou `border-[4px] border-black` sur les composants élevés
- **Typo** : `font-impact uppercase` pour tout ce qui compte, DM Sans pour le corps, JetBrains Mono pour les chiffres
- **Tailwind v4** : pas de classes custom non définies — utiliser `bg-[#hex]`, `text-[#hex]`, `shadow-[...]` explicitement
- **Boutons actifs** : `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

## Architecture

```
Bingo Crawl Final/
├── components/
│   ├── MasterPage.tsx          # Dashboard Master (cartes blanches — Recovery validé, 503 lignes)
│   ├── GamePage.tsx            # Grille bingo + header + overlays
│   ├── BingoCell.tsx           # Cellule flip 3D (états: normal/winning/locked/unlocking)
│   ├── ValidationModal.tsx     # Modal validation (dessin signature + témoin)
│   ├── WitnessRequestBanner.tsx # Banner témoin en attente (côté witness)
│   ├── EditProfileSheet.tsx    # Édition profil joueur (pseudo, avatar, pays)
│   ├── LobbyPage.tsx           # Lobby pré-session
│   ├── PreGamePage.tsx         # Phase pré-jeu
│   ├── GameRoom.tsx            # QR session security gate
│   ├── GameOverPage.tsx        # Fin de partie
│   ├── MissionReport.tsx       # Rapport de mission
│   ├── Leaderboard.tsx         # Classement
│   ├── NicknamePage.tsx        # Création pseudo + avatar
│   ├── MasterRunePad.tsx       # Code master (RunePad)
│   ├── BarTransitionOverlay.tsx # Overlay changement de bar (countdown)
│   ├── ActivityFeed.tsx        # Fil d'activité live
│   ├── BadgeNotification.tsx   # Notification badge gagné
│   ├── NFTBadgeModal.tsx       # Modal badge style NFT
│   ├── LegendsModal.tsx        # Modal légendes/règles
│   ├── QRScanner.tsx           # Scanner QR (rejoindre session)
│   ├── NetworkStatus.tsx       # Indicateur offline/syncing
│   ├── OnboardingCards.tsx     # Cards onboarding
│   ├── StyleSelection.tsx      # Choix style visuel
│   ├── TutorialLayer.tsx       # Layer tutorial
│   ├── TutorialOverlay.tsx     # Overlay tutorial
│   ├── Avatar.tsx              # Composant avatar
│   ├── BlobOverlay.tsx         # Overlay blob effect
│   ├── FlashlightOverlay.tsx   # Overlay flashlight
│   ├── ReverseOverlay.tsx      # Overlay reverse mode
│   ├── IceBlockOverlay.tsx     # Overlay ice/frozen
│   ├── TinyTargetOverlay.tsx   # Overlay tiny target
│   ├── ChallengeRevealSheet.tsx # Sheet reveal challenge
│   ├── SessionStartOverlay.tsx # Overlay démarrage session
│   ├── SessionEndOverlay.tsx   # Overlay fin de session
│   ├── ShieldLogo.tsx          # Logo shield
│   ├── BackgroundParticles.tsx # Particules de fond
│   ├── LockedPage.tsx          # Page locked/accès refusé
│   └── ErrorBoundary.tsx       # Gestion erreurs React
├── hooks/
│   ├── useBingoGame.ts         # État principal du jeu (god hook)
│   ├── useEventSession.ts      # Session active + realtime Supabase
│   ├── useAppUI.ts             # État UI global (overlays, modals)
│   ├── useBadges.ts            # Système de badges
│   ├── useTutorial.ts          # État tutorial
│   └── useSessionGuard.ts      # Guard QR session
├── services/
│   └── gameService.ts          # Supabase + offline queue (1741 lignes)
├── contexts/
│   └── LanguageContext.tsx     # i18n EN/FR
├── supabase/
│   └── migrations/
│       ├── 20260408_secure_sessions.sql
│       ├── 20260408_session_expires_at.sql
│       ├── 001_pregame.sql
│       ├── 002_master_validations.sql
│       └── 003_witness_mode.sql
├── index.css                   # Tailwind v4 @theme + animations custom
└── DESIGN.md                   # Design system complet
```

## Composants clés

### MasterPage.tsx (503 lignes — base Recovery validée)
- Dashboard blanc : `bg-white border-[4px] border-black shadow-[10px_10px_0px_black]`
- Session OPEN / CLOSED avec compteur joueurs realtime
- Section **Bar Change** : pills 2/5/10/15 min, input nom du bar, countdown actif + annulation
- QR code coloré par session (couleur change à chaque nouvelle session)
- QR plein écran (pour que les joueurs scannent)
- Modals confirmation Reset + New Session
- Simulate 5 players + Fin de soirée (Wrapped)

### GamePage.tsx
- Score animé via `requestAnimationFrame` (`displayScore` state)
- Cellule mystère (id=12) verrouillée si `score < 5`
- Avatar ring coloré selon état : vert (normal) / jaune (fever) / rose (frozen)
- Crown button : tap court → badges, long press 3s → action master

### BingoCell.tsx
- Props : `isWinning`, `winningIndex` (stagger delay), `isLocked`, `isUnlocking`
- Animation victoire : `cell-winning` avec `animationDelay: winningIndex * 80ms`
- Animation mystery unlock : `cell-mystery-unlock`
- Flip CSS 3D : face avant (challenge) + face arrière (check vert sur fond jaune)

### Système Témoin (Witness)
- Infrastructure complète dans `gameService.ts` (lignes ~1537+)
- `requestWitness(gameId, cellId, witnessPlayerId)` — joueur choisit son témoin
- `requestWitnessConfirmation()`, `confirmWitness()`, `rejectWitness()`
- `subscribeWitnessRequests(playerId)` — realtime côté témoin
- `WitnessRequestBanner.tsx` — banner affiché au témoin désigné
- Migration : `003_witness_mode.sql`

### NetworkStatus.tsx
- Syncing → badge jaune bas de page
- Offline → badge rose bas de page
- Reconnexion → badge vert bref (3s)

## Supabase

- `reset_all_data()` : utilise `TRUNCATE ... CASCADE`
- RLS activé — toutes les mutations passent par RPC ou `service_role`
- Secure sessions : table `sessions` avec UUID + `expires_at`
- `event_session` : contrôle l'état OPEN/CLOSED de l'événement

## Features à implémenter (perdues, jamais pushées)

Ces features avaient été développées en local mais jamais commitées — à refaire :

- [ ] **Mode KO** : élimination progressive des joueurs (règles à préciser)
- [ ] **Choix des barres** : liste de bars preset que le master peut sélectionner (plutôt que saisir manuellement)
- [ ] **Témoin 2/1** : règle sur le nombre de témoins requis (1 ou 2 ?) — à clarifier et implémenter dans ValidationModal

## Skill routing

- Design system, brand → `/design-consultation`
- Visual audit, polish → `/design-review`
- Bugs, erreurs → `/investigate`
- QA, test l'app → `/qa`
- Ship, deploy, PR → `/ship`
- Architecture → `/plan-eng-review`

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -m graphify update .` to keep the graph current (AST-only, no API cost)
- Run graphify update at the end of every session that modified code

## Session Memory

At the end of each session (or when work is done), save a summary to `/Users/futharkiens/.claude/projects/-Users-futharkiens/memory/session_last.md` with:
- What was done
- What bugs were fixed (with file:line refs)
- What is still pending / next steps
- Any decisions made

This saves tokens on the next session — read it first before exploring code.


## État actuel
_Mis à jour : 2026-05-26 16:10 — branche : main_

### Derniers commits
- 1d4249a 🐛 fix: 3 bugs Safari/témoin/taunt

### Fichiers récemment modifiés
- components/GamePage.tsx
- components/WitnessRequestBanner.tsx
- services/gameService.ts

### Non commité
```
 M CLAUDE.md
 M package.json
?? .agents/
?? .planning/
?? skills-lock.json
```

