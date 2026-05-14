---
type: concept
title: Architecture Graphe (Graphify)
aliases: [knowledge graph, graphe de code, god nodes]
tags: [architecture, analyse-statique, graphify, communautés]
sources: 1
last_updated: 2026-05-05
---

# Architecture Graphe — Bingo Crawl

## En bref

Analyse structurelle du codebase générée par Graphify (2026-05-04). 258 nœuds, 311 edges, 51 communautés. Révèle que `GameBackendService` est le hub central avec 95 connections — point de fragilité architecturale majeur.

## God Nodes (abstractions les plus connectées)

| Nœud | Edges | Verdict |
|------|-------|---------|
| `GameBackendService` | 95 | Hub unique — toute la logique Supabase |
| `update()` | 35 | Méthode état principale — 34 edges inférées à vérifier |
| `ErrorBoundary` | 5 | Gestion erreurs React globale |
| `useLanguage()` | 4 | Hook i18n — consommé par plusieurs composants |
| `getOrSetUnlockStart()` | 4 | Logique unlock cellule mystère |

**Risque :** `GameBackendService` à betweenness centrality 0.283 — si ce fichier casse, tout casse. Candidat à la décomposition.

## Communautés fonctionnelles

| Communauté | Cohésion | Fonction |
|------------|----------|----------|
| Community 0 | **0.05** (très faible) | GameBackendService + update() + handleLaunchGame() |
| Community 1 | **0.09** (faible) | Handlers Master (kick, reset, rename, witness, transition) |
| Community 2 | 0.21 | Logique unlock/cooldown cellule mystère |
| Community 5 | 0.20 | useLanguage + useBadges + useBingoGame + overlays |
| Community 9 | 0.29 | handleTutorialNext + shuffleArray + handleSimulate |
| Community 10 | 0.29 | handleApproveValidation + handleConfirm + handleReject |
| Community 16 | 0.50 | GameRoom() + useSessionGuard() — sécurité QR |
| Community 18 | **1.0** | handleResize() + updateRect() — cluster isolé |

La majorité des communautés (23-50) sont des **singletons** : composants UI non connectés dans le graphe → architecture correctement découplée côté UI.

## Connexions surprenantes (inférées)

Ces edges sont **inférés** (pas directement extractibles) — confidence 0.8 :

- `useLanguage()` → `useBingoGame()` : le contexte i18n est consommé dans le god hook
- `GameRoom()` → `useSessionGuard()` : guard QR intégré directement dans GameRoom
- `useBingoGame()` → `useBadges()` : les badges sont pilotés par l'état du jeu

## Comment utiliser ce graphe

```bash
# Question architecture
python3 -m graphify query "qui appelle GameBackendService"

# Chemin entre deux concepts
python3 -m graphify path "useBingoGame" "Supabase"

# Explication d'un nœud
python3 -m graphify explain "GameBackendService"

# Maintenir à jour après modif de code
python3 -m graphify update .
```

## Gaps / Points à investiguer

- Community 0 à cohésion 0.05 → trop couplée, devrait être refactorée
- 34 edges inférées de `update()` → vérifier si elles sont réelles
- `supabaseClient.ts` est un singleton isolé (Community 50) → normal ?

## Sources

- [[graph-report-2026-05-04]]

## Liens

- [[Architecture Technique]] — vue humaine de l'architecture
- [[GameBackendService]] — god node central
- [[The Bingo Crawl]] — projet analysé
