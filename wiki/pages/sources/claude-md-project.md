---
type: source
title: CLAUDE.md — Configuration projet Bingo Crawl
date_ingest: 2026-05-05
source_file: raw/claude-md-project.md
tags: [architecture, stack, configuration, référence]
entities: [The Bingo Crawl, Supabase]
concepts: [architecture-technique, systeme-temoin, features-perdues, skill-routing]
---

# CLAUDE.md — Configuration projet

## Résumé

Document de référence unique du projet, destiné à l'agent Claude Code. Définit la stack technique, l'architecture des fichiers, les règles de design, et les features perdues à refaire. Sert aussi de router pour les différentes skills selon le type de tâche.

## Points clés

- Repo unique : `/Users/futharkiens/Projects/the-bingo-crawl`
- Dev server : `bun run dev --port 5174`
- Supabase project ID : `wcxtekmihkypevjdfffs`
- Port dev : `5174`

## Entités mentionnées

- [[The Bingo Crawl]] — le projet lui-même
- [[Supabase]] — backend PostgreSQL + RLS + RPC

## Concepts clés

- [[Architecture Technique]] — React 19 + TypeScript + Vite 6 + Tailwind v4 + Bun
- [[Système Témoin]] — validation par témoin, infrastructure complète dans `gameService.ts`
- [[Features Perdues]] — Mode KO, Choix des barres, Témoin 2/1 — à refaire
- [[Skill Routing]] — tableau de routing par type de tâche

## Composants critiques

| Fichier | Rôle | Taille |
|---------|------|--------|
| `components/MasterPage.tsx` | Dashboard Master | 503 lignes |
| `services/gameService.ts` | Supabase + offline queue | 1741 lignes |
| `hooks/useBingoGame.ts` | État principal du jeu (god hook) | — |
| `index.css` | Tailwind v4 @theme + animations | — |

## Citations notables

> "Repo de référence unique. Toujours travailler dans `/Users/futharkiens/Projects/the-bingo-crawl`."

> "Ces features avaient été développées en local mais jamais commitées — à refaire"
