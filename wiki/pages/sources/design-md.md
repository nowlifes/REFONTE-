---
type: source
title: DESIGN.md — Design System Bingo Crawl
date_ingest: 2026-05-05
source_file: raw/design-md.md
tags: [design, ui, composants, typographie, couleurs]
entities: [The Bingo Crawl]
concepts: [design-system, composants-ui, animations]
---

# DESIGN.md — Design System

## Résumé

Documentation exhaustive du design system "Brutalist Arcade / Party Zine". Définit couleurs, typographie, espacements, borders, ombres, composants, animations et règles générales. Direction artistique : contraste maximal, noir absolu, énergie street — aucun glassmorphism ni ombre douce.

## Points clés

- Direction : **Brutalist Arcade / Party Zine**
- Fond global invariable : `#0A1629`
- Ombres : hard black uniquement — `Xpx Xpx 0px #000`
- Grille bingo fixe : 350×350px, cellules 66×66px

## Entités mentionnées

- [[The Bingo Crawl]] — produit auquel ce design system appartient

## Concepts clés

- [[Design System]] — système complet couleurs/typo/composants
- [[Composants UI]] — cellules bingo, boutons, footer nav, badges, modals
- [[Animations]] — `cell-winning`, `cell-mystery-unlock`, feedback haptique

## Couleurs sémantiques

| Token | Hex | Sémantique |
|-------|-----|-----------|
| `--color-bg` | `#0A1629` | Fond global (jamais modifié) |
| `--color-yellow` | `#FFD700` | Primary, score, CTA principal |
| `--color-green` | `#00F5A0` | Success, SOLO, connecté |
| `--color-pink` | `#FF2D6A` | Danger, WITNESS, fever, offline |
| `--color-orange` | `#FF8C00` | Warning, MASTER secondaire |

## Familles typographiques

| Famille | Usage |
|---------|-------|
| **Impact** | Titres, labels uppercase, scores — "tout ce qui crie" |
| **DM Sans** | Corps, descriptions, onboarding — "conversation" |
| **JetBrains Mono** | Chiffres, scores, timers, codes — "données système" |

## Décisions de design notables

- Grid fixe 350×350px → cohérence absolue sur tous les téléphones
- Cellule mystère (id=12) au centre → débloquée à score≥5 = objectif intermédiaire
- Footer nav jaune → seul élément clair sur fond sombre = attention maximale
- Hard shadows vs soft → identité "zine/print", différenciation vs app SaaS

## Citations notables

> "Contraste maximal. Noir absolu. Energie street. Pas de ombres douces, pas de glassmorphism tiède."

> "Les ombres sont toujours noires pures — jamais colorées, jamais `rgba()`"
