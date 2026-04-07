# Bingo Crawl — REFONTE-app

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 (syntaxe `@theme` dans `index.css`, classes utilitaires `bg-[#hex]`)
- Supabase (PostgreSQL + RLS + RPC) — project `wcxtekmihkypevjdfffs`
- `bun` comme package manager — `bun install`, `bun run dev`
- Port dev : `5174` (`bun run dev --port 5174`)

## Design System

Voir [DESIGN.md](./DESIGN.md) pour le système complet.

**Règles critiques à respecter :**

- **Fond global** : `bg-[#0A1629]` — jamais autre chose
- **Surfaces** : `bg-[#1A1A2E]`
- **Couleurs** : yellow `#FFD700`, green `#00F5A0`, pink `#FF2D6A`, orange `#FF8C00`
- **Ombres** : hard black uniquement — `shadow-[Xpx_Xpx_0px_black]`, jamais de soft shadow colorée
- **Borders** : `border-[3px] border-black` ou `border-[4px] border-black` sur les composants élevés
- **Typo** : `font-impact uppercase` pour tout ce qui compte, DM Sans pour le corps, JetBrains Mono pour les chiffres
- **Tailwind v4** : pas de classes custom non définies — utiliser `bg-[#hex]`, `text-[#hex]`, `shadow-[...]` explicitement
- **Boutons actifs** : `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

## Architecture

```
REFONTE-app/
├── components/        # Composants React
│   ├── GamePage.tsx   # Page principale (grille + header + footer)
│   ├── BingoCell.tsx  # Cellule individuelle (front/back flip, états)
│   ├── ValidationModal.tsx
│   ├── NFTBadgeModal.tsx
│   ├── LegendsModal.tsx
│   ├── QRScanner.tsx
│   ├── NetworkStatus.tsx   # Offline/syncing indicator
│   ├── ActivityFeed.tsx
│   ├── BadgeNotification.tsx
│   ├── Avatar.tsx
│   ├── BackgroundParticles.tsx
│   └── OnboardingCards.tsx
├── contexts/
│   └── LanguageContext.tsx  # i18n (EN/FR)
├── services/
│   └── gameService.ts       # Supabase + offline queue
├── hooks/
│   └── useGameState.ts      # État principal du jeu
├── types/                   # Types TypeScript
├── index.css                # Tailwind v4 @theme + animations custom
└── DESIGN.md                # Design system complet
```

## Composants clés

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

### NetworkStatus.tsx
- Syncing → badge jaune bas de page
- Offline → badge rose bas de page
- Reconnexion → badge vert bref (3s)

## Supabase

- `reset_all_data()` : utilise `TRUNCATE ... CASCADE` (pg_safeupdate bloque les DELETE sans WHERE)
- RLS activé — toutes les mutations passent par RPC ou `service_role`

## Skill routing

Quand la demande correspond à un skill, utiliser le Skill tool en premier.

- Design system, brand → `/design-consultation`
- Visual audit, polish → `/design-review`  
- Bugs, erreurs → `/investigate`
- QA, test l'app → `/qa`
- Ship, deploy, PR → `/ship`
- Architecture → `/plan-eng-review`
