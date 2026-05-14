---
type: entity
title: GameBackendService
aliases: [gameService, services/gameService.ts]
tags: [service, backend, god-node, supabase]
sources: 2
last_updated: 2026-05-05
---

# GameBackendService

## En bref

Hub central du [[The Bingo Crawl]] — 95 edges dans le graphe de code. Toute la logique Supabase, la file d'attente offline, le système témoin, et les mutations d'état passent par ce fichier. Candidat majeur à la décomposition si le projet grossit.

## Ce qu'on sait

**Fichier :** `services/gameService.ts` — 1741 lignes

**Rôle :** Point d'accès unique à Supabase. Toutes les mutations du jeu transitent par ses méthodes.

**Fonctions critiques (extrait) :**
- Gestion des sessions (`event_session`, OPEN/CLOSED)
- Validation des cellules (SOLO, WITNESS, MASTER)
- File d'attente offline (queue mutations pendant déconnexion)
- [[Système Témoin]] : `requestWitness`, `confirmWitness`, `rejectWitness`, `subscribeWitnessRequests`
- `reset_all_data()` — TRUNCATE CASCADE

**Position dans le graphe :**
- Betweenness centrality : **0.283** — nœud pont entre presque toutes les communautés
- 95 edges — plus connecté de tout le codebase
- Membre de Community 0 (cohésion 0.05 — très faiblement couplée en interne)

**Risque architectural :**
`GameBackendService` est un God Object. Si ce fichier est modifié, presque tous les autres fichiers peuvent être impactés. À surveiller lors des refactorisations.

## Liens vers le graphe

Community 0 contient : `GameBackendService`, `update()`, `handleLaunchGame()`.
Community 1 est pilotée par ses handlers : `handleClearDeviceLock`, `handleCreateNew`, `handleKickPlayer`, `handleReset`, `handleSaveRename`, `handleSendWitness`, `handleTriggerTransition`.

## Sources

- [[claude-md-project]] — "1741 lignes", Supabase + offline queue
- [[graph-report-2026-05-04]] — 95 edges, betweenness centrality 0.283

## Liens

- [[The Bingo Crawl]]
- [[Supabase]] — backend qu'il abstrait
- [[Système Témoin]] — mécanique témoin implémentée dans ce fichier
- [[Architecture Graphe]] — positionnement dans le graphe de code
- [[Architecture Technique]] — contexte stack
