# Wiki-Brain — Protocole Agent Bingo Crawl

> Source de vérité pour le comportement de l'agent wiki.
> Ce fichier définit comment naviguer la connaissance, apprendre des erreurs, et rester rapide.

---

## Philosophie : token-first

L'objectif est de **ne jamais relire le codebase brut** si l'information existe déjà dans le wiki.
Ordre de consultation obligatoire :

```
1. wiki/index.md            → savoir ce qui existe
2. wiki/pages/...           → lire les pages ciblées
3. graphify-out/            → architecture de code (god nodes, communautés)
4. fichiers bruts           → seulement si wiki + graphify ne suffisent pas
```

---

## Protocole Session Start (obligatoire, ≤ 4 lectures)

À chaque début de session, lire dans cet ordre :

1. `wiki/index.md` — catalogue complet
2. `wiki/log.md` dernières 10 entrées — activité récente
3. `wiki/pages/synthesis/lessons.md` — règles apprises des erreurs passées
4. Si question archi : `graphify-out/GRAPH_REPORT.md` section "God Nodes"

---

## Protocole Session End (obligatoire)

Avant de terminer, si du code a été modifié :

```bash
cd /Users/futharkiens/Projects/the-bingo-crawl && python3 -m graphify update .
```

Toujours :
- Appender dans `wiki/log.md`
- Mettre à jour `wiki/index.md` si nouvelles pages créées
- Si erreur corrigée → appender dans `wiki/pages/synthesis/lessons.md`

---

## Auto-apprentissage (Self-Learning)

### Quand écrire dans lessons.md

- Après toute **correction** de l'utilisateur ("non pas ça", "tu as oublié", "relis")
- Après tout **bug récurrent** qu'on a dû déboguer
- Après toute **décision surprenante** validée par l'utilisateur

### Format d'une leçon

```
[YYYY-MM-DD] | ce qui s'est mal passé | règle à suivre
```

### Utilisation

- Lire `lessons.md` en session start → appliquer chaque règle
- Ne jamais répéter une erreur déjà dans lessons.md
- Leçons Bingo Crawl surclassent les heuristiques génériques

---

## Opérations Wiki

### INGEST — Nouvelle source

1. Lire la source dans `raw/`
2. Discuter points clés avec l'utilisateur
3. Créer `pages/sources/[nom].md`
4. Créer/mettre à jour pages entités + concepts concernées
5. Signaler contradictions avec l'existant
6. Mettre à jour `index.md` + appender `log.md`

### QUERY — Répondre à une question

1. Lire `index.md` → identifier pages pertinentes
2. Lire les pages ciblées
3. Si question archi → consulter `graphify-out/GRAPH_REPORT.md`
4. Synthétiser avec citations `[[page]]`
5. Si réponse substantielle → proposer de la filer dans `pages/synthesis/`

### LINT — Audit de santé

Vérifier : contradictions, pages orphelines, concepts sans page, refs croisées manquantes, données périmées.
Produire `pages/synthesis/lint-[date].md`.

### GRAPH-QUERY — Question d'architecture code

Pour "comment X appelle Y" ou "qui dépend de Z" :
1. Lire `graphify-out/GRAPH_REPORT.md` → god nodes + communautés
2. Si insuffisant : `python3 -m graphify query "[question]"`

---

## Intégration Graphify

| Situation | Action |
|-----------|--------|
| Question archi générale | Lire `GRAPH_REPORT.md` god nodes |
| Trouver qui appelle une fonction | `graphify query "fonction"` |
| Après modif de code | `python3 -m graphify update .` |
| Comprendre une communauté | Page concept correspondante dans wiki |

**God nodes actuels (2026-05-04) :**
- `GameBackendService` — 95 edges, hub central de toute la logique métier
- `update()` — 35 edges, méthode de mise à jour état principale
- `ErrorBoundary` — 5 edges, gestion erreurs React globale

---

## Structure des répertoires

```
wiki/
├── CLAUDE.md              ← ce fichier (protocole agent)
├── index.md               ← catalogue (mis à jour à chaque ingest)
├── log.md                 ← journal append-only
├── raw/                   ← sources brutes (LECTURE SEULE)
│   ├── assets/
│   └── *.md
└── pages/
    ├── entities/          ← personnes, services, produits
    ├── concepts/          ← idées, patterns, mécaniques
    ├── sources/           ← résumés de sources
    └── synthesis/         ← analyses, leçons, audits
```

---

## Format des pages

### Source

```markdown
---
type: source
title: ...
date_ingest: YYYY-MM-DD
source_file: raw/...
tags: [...]
entities: [...]
concepts: [...]
---
```

### Entité / Concept

```markdown
---
type: entity|concept
title: ...
tags: [...]
sources: N
last_updated: YYYY-MM-DD
---
```

### Log entry

```
## [YYYY-MM-DD] [opération] | [description]
[1-3 lignes contexte]
Pages touchées : [liste]
```

---

## Règles générales

- **Jamais modifier** `raw/` — lecture seule
- **Signaler** les contradictions, ne jamais les écraser silencieusement
- **Filer** les bonnes réponses dans `pages/synthesis/`
- **Pas d'hallucination** — n'affirmer que ce qui vient d'une source `raw/` ou d'une page wiki
- Langue : français pour le contenu, termes techniques en anglais
