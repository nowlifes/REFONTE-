---
type: source
title: GRAPH_REPORT.md — Graphify Knowledge Graph (2026-05-04)
date_ingest: 2026-05-05
source_file: raw/graph-report-2026-05-04.md
tags: [architecture, graphe, analyse-statique, communautés]
entities: [GameBackendService, The Bingo Crawl]
concepts: [architecture-graphe, god-nodes, communautés-fonctionnelles]
---

# GRAPH_REPORT — Analyse Graphify

## Résumé

Analyse statique automatisée du codebase Bingo Crawl. 54 fichiers, ~70 473 mots, 258 nœuds, 311 edges, 51 communautés détectées. Extraction : 80% directe, 20% inférée (confidence moyenne 0.8).

## Points clés

- **God node central :** `GameBackendService` (95 edges) — hub de toute la logique métier
- **Méthode la plus connectée :** `update()` (35 edges) — pont entre presque toutes les communautés
- **Architecture faiblement couplée** : la plupart des composants UI sont dans des communautés isolées (cohésion 1.0 = singleton)

## God Nodes (top 10)

| Nœud | Edges | Rôle |
|------|-------|------|
| `GameBackendService` | 95 | Hub central — toute logique Supabase transite par lui |
| `update()` | 35 | Méthode de mise à jour état — pont inter-communautés |
| `ErrorBoundary` | 5 | Gestion erreurs React globale |
| `useLanguage()` | 4 | Hook i18n — inféré comme appelé par plusieurs composants |
| `getOrSetUnlockStart()` | 4 | Logique de déverrouillage cellule mystère |

## Communautés fonctionnelles notables

| Communauté | Cohésion | Contenu |
|------------|----------|---------|
| Community 0 | 0.05 (faible) | `GameBackendService`, `update()`, `handleLaunchGame()` |
| Community 1 | 0.09 (faible) | Handlers Master : kick, reset, rename, witness, transition |
| Community 2 | 0.21 | Logique unlock/cooldown cellule mystère |
| Community 5 | 0.20 | `useLanguage()`, `useBadges()`, `useBingoGame()`, overlays |
| Community 16 | 0.50 | `GameRoom()` + `useSessionGuard()` — sécurité QR |

## Connexions surprenantes (inférées)

- `useLanguage()` → `useBingoGame()` — le hook i18n est consommé dans le god hook
- `GameRoom()` → `useSessionGuard()` — guard QR intégré dans GameRoom
- `useBingoGame()` → `useBadges()` — badges pilotés par l'état du jeu

## Gaps / Points faibles identifiés

- Community 0 : cohésion 0.05 → `GameBackendService` trop couplé, candidat à la refactorisation
- 34 edges de `update()` **inférés** → à vérifier manuellement
- Beaucoup de communautés singletons (Community 27-50) → composants UI non connectés dans le graphe

## Questions que ce graphe peut répondre

- Pourquoi `GameBackendService` est-il un hub à 95 edges ?
- Les 34 relations inférées de `update()` sont-elles correctes ?
- Community 0 devrait-elle être splitée en modules plus petits ?

## Citations notables

> "GameBackendService - 95 edges" — nœud le plus connecté, betweenness centrality 0.283
