# Log du Wiki Bingo Crawl

> Journal append-only. Ne jamais supprimer d'entrées.
> Format : `## [YYYY-MM-DD] [opération] | [description]`

---

## [2026-05-05] create | Initialisation du wiki dans le projet Bingo Crawl

Structure créée dans `the-bingo-crawl/wiki/`.
Répertoires : `raw/`, `raw/assets/`, `pages/entities/`, `pages/concepts/`, `pages/sources/`, `pages/synthesis/`
Pages touchées : CLAUDE.md, index.md, log.md

---

## [2026-05-05] ingest | CLAUDE.md — Configuration projet

Source copiée dans `raw/claude-md-project.md`.
Résumé : stack technique, architecture fichiers, composants critiques, features perdues, skill routing.
Pages créées : `pages/sources/claude-md-project.md`, `pages/entities/the-bingo-crawl.md`, `pages/entities/supabase.md`, `pages/concepts/architecture-technique.md`, `pages/concepts/systeme-temoin.md`, `pages/concepts/features-perdues.md`
Pages touchées : index.md, log.md

---

## [2026-05-05] ingest | DESIGN.md — Design System

Source copiée dans `raw/design-md.md`.
Résumé : design system Brutalist Arcade, couleurs sémantiques, typographie 3 familles, composants, animations, décisions de design.
Pages créées : `pages/sources/design-md.md`, `pages/concepts/design-system.md`
Pages touchées : `pages/entities/the-bingo-crawl.md` (enrichi), index.md, log.md

---

## [2026-05-05] ingest | GRAPH_REPORT.md — Graphify Knowledge Graph

Source copiée dans `raw/graph-report-2026-05-04.md`.
Résumé : 258 nœuds, 311 edges, 51 communautés. God node : GameBackendService (95 edges). Architecture faiblement couplée côté UI, très couplée côté backend.
Pages créées : `pages/sources/graph-report-2026-05-04.md`, `pages/concepts/architecture-graphe.md`, `pages/entities/game-backend-service.md`
Pages touchées : index.md, log.md

---

## [2026-05-05] update | Wiki-Brain — Unification wiki + graphify + self-learning

Refonte complète du protocole CLAUDE.md : session start/end, auto-apprentissage, intégration graphify.
Création : `pages/synthesis/lessons.md` (auto-apprentissage vide, prêt à être rempli).
Skill `wiki-brain` créé dans `~/.claude/skills/wiki-brain/SKILL.md`.
Hook Stop mis à jour dans `settings.json` : graphify update automatique.
Pages touchées : CLAUDE.md, index.md, log.md, lessons.md
