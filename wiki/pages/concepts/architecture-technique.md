---
type: concept
title: Architecture Technique
tags: [architecture, stack, react, typescript]
sources: 1
last_updated: 2026-05-05
---

# Architecture Technique

## Stack

| Couche | Technologie |
|--------|-------------|
| UI | React 19 + TypeScript |
| Build | Vite 6 |
| Styles | Tailwind CSS v4 (syntaxe `@theme`) |
| Backend | Supabase (PostgreSQL + RLS + RPC) |
| Package manager | Bun |
| Déploiement | Vercel |

**Tailwind v4 :** pas de classes custom non définies — utiliser `bg-[#hex]`, `text-[#hex]`, `shadow-[...]` explicitement.

## Structure des fichiers

```
components/     ← composants React (UI, overlays, modals)
hooks/          ← logique state (useBingoGame = god hook)
services/       ← gameService.ts (Supabase + offline queue)
contexts/       ← LanguageContext (i18n EN/FR)
supabase/migrations/  ← SQL migrations
index.css       ← Tailwind v4 @theme + animations custom
```

## Fichiers critiques

| Fichier | Rôle | Taille |
|---------|------|--------|
| `components/MasterPage.tsx` | Dashboard Master | 503 lignes |
| `services/gameService.ts` | Toute la logique Supabase | 1741 lignes |
| `hooks/useBingoGame.ts` | God hook état du jeu | — |
| `hooks/useEventSession.ts` | Session + realtime Supabase | — |

## Patterns notables

- **God hook** : `useBingoGame.ts` centralise l'état principal du jeu
- **Offline queue** : `gameService.ts` gère la file d'attente hors-ligne
- **RLS strict** : toutes les mutations via RPC ou `service_role`, jamais direct
- **Realtime** : subscriptions Supabase pour joueurs + témoin + activity feed

## Sources

- [[claude-md-project]]

## Liens

- [[The Bingo Crawl]]
- [[Supabase]]
- [[Système Témoin]]
