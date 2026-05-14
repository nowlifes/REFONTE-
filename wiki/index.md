# Index — Wiki Bingo Crawl

> Catalogue de toutes les pages du wiki. Mis à jour automatiquement à chaque INGEST.

**Dernière mise à jour :** 2026-05-05
**Sources ingérées :** 3
**Pages totales :** 13

---

## Sources (`pages/sources/`)

| Page | Titre | Date ingest | Tags |
|------|-------|-------------|------|
| [claude-md-project](pages/sources/claude-md-project.md) | CLAUDE.md — Configuration projet | 2026-05-05 | architecture, stack, référence |
| [design-md](pages/sources/design-md.md) | DESIGN.md — Design System | 2026-05-05 | design, ui, composants |
| [graph-report-2026-05-04](pages/sources/graph-report-2026-05-04.md) | GRAPH_REPORT — Graphify Knowledge Graph | 2026-05-05 | architecture, graphe, analyse-statique |

---

## Entités (`pages/entities/`)

| Page | Nom | Type | Sources |
|------|-----|------|---------|
| [the-bingo-crawl](pages/entities/the-bingo-crawl.md) | The Bingo Crawl | produit/application | 2 |
| [supabase](pages/entities/supabase.md) | Supabase | service/backend | 1 |
| [game-backend-service](pages/entities/game-backend-service.md) | GameBackendService | god-node/service | 2 |

---

## Concepts (`pages/concepts/`)

| Page | Nom | Tags | Sources |
|------|-----|------|---------|
| [design-system](pages/concepts/design-system.md) | Design System — Brutalist Arcade | design, ui, identité-visuelle | 1 |
| [architecture-technique](pages/concepts/architecture-technique.md) | Architecture Technique | architecture, stack, react | 1 |
| [systeme-temoin](pages/concepts/systeme-temoin.md) | Système Témoin | gameplay, validation, mécanique | 1 |
| [features-perdues](pages/concepts/features-perdues.md) | Features Perdues | backlog, priorité | 1 |
| [architecture-graphe](pages/concepts/architecture-graphe.md) | Architecture Graphe (Graphify) | architecture, analyse-statique, communautés | 1 |

---

## Synthèses (`pages/synthesis/`)

| Page | Titre | Date | Type |
|------|-------|------|------|
| [lessons](pages/synthesis/lessons.md) | Lessons Learned — Règles apprises | 2026-05-05 | auto-apprentissage |

---

## Statistiques

```
Sources brutes   : 3
Pages sources    : 3
Pages entités    : 3
Pages concepts   : 5
Pages synthèses  : 1
─────────────────
Total pages wiki : 12
```

---

## Tags utilisés

`architecture` `stack` `référence` `design` `ui` `composants` `produit` `application` `jeu` `mobile` `service` `backend` `god-node` `gameplay` `validation` `mécanique` `backlog` `priorité` `identité-visuelle` `react` `typescript` `graphe` `analyse-statique` `communautés`

---

## Gaps identifiés

- Aucune page sur le **Business Model** (modèle 60/40 mentionné en mémoire)
- Aucune page sur le **flow d'onboarding joueur** (QR → Nickname → Game)
- Aucune page sur le **système de badges** (`useBadges.ts`)
- Aucune page sur l'**i18n** (EN/FR via `LanguageContext`)
- Features perdues : règles de **Mode KO** à préciser
- Community 0 cohésion 0.05 → **refactorisation GameBackendService** à planifier
