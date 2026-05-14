---
type: entity
title: The Bingo Crawl
aliases: [Bingo Crawl, bingo-crawl]
tags: [produit, application, jeu, mobile]
sources: 2
last_updated: 2026-05-05
---

# The Bingo Crawl

## En bref

Application mobile de bingo en bar — jeu multijoueur en temps réel où les joueurs valident des défis sur une grille 5×5, supervisés par un Master qui gère la session depuis son tableau de bord.

## Ce qu'on sait

**Concept produit :** Bingo crawl de bar — les joueurs rejoignent une session via QR code, remplissent une grille de défis (SOLO, WITNESS, MASTER), et progressent en accumulant des points. Un "Master" (barmaid/animateur) contrôle la session.

**Stack technique :**
- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 (syntaxe `@theme`)
- Supabase — PostgreSQL + RLS + RPC (project ID : `wcxtekmihkypevjdfffs`)
- Bun comme package manager
- Vercel pour le déploiement
- Port dev : `5174`

**Répertoire :** `/Users/futharkiens/Projects/the-bingo-crawl`

**Design system :** Brutalist Arcade / Party Zine — fond `#0A1629`, hard shadows noires, Impact uppercase, couleurs sémantiques (jaune, vert, rose, orange).

**Modes de jeu :**
- Cellule SOLO : validée seul
- Cellule WITNESS : nécessite un témoin désigné
- Cellule MASTER : validée par le Master
- Cellule MYSTERY (id=12) : verrouillée, débloquée à score≥5

**Composants critiques :**
- `MasterPage.tsx` — dashboard Master (503 lignes, base Recovery validée)
- `gameService.ts` — toute la logique Supabase + offline queue (1741 lignes)
- `useBingoGame.ts` — god hook état principal du jeu

**Features perdues (jamais commitées) :** [[Features Perdues]]

## Sources

- [[claude-md-project]] — architecture, stack, features
- [[design-md]] — design system complet

## Liens

- [[Design System]] — identité visuelle du produit
- [[Architecture Technique]] — stack et structure
- [[Système Témoin]] — mécanique de validation par témoin
- [[Features Perdues]] — fonctionnalités à refaire
- [[Supabase]] — backend du projet
