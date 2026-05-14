---
type: concept
title: Design System
aliases: [Brutalist Arcade, Party Zine]
tags: [design, ui, identité-visuelle]
sources: 1
last_updated: 2026-05-05
---

# Design System — Brutalist Arcade / Party Zine

## Définition

Système de design du [[The Bingo Crawl]]. Direction : contraste maximal, noir absolu, énergie street. Aucun glassmorphism, aucune ombre douce, pas de mode clair.

## Couleurs

| Token | Hex | Sémantique |
|-------|-----|-----------|
| Fond global | `#0A1629` | **Invariable** — jamais modifié |
| Surfaces secondaires | `#1A1A2E` | Grille bingo, modals |
| Yellow | `#FFD700` | Primary, score, CTA principal |
| Green | `#00F5A0` | Success, SOLO, connecté |
| Pink | `#FF2D6A` | Danger, WITNESS, fever, offline |
| Orange | `#FF8C00` | Warning, MASTER secondaire |
| Black | `#000000` | Borders et ombres — toujours pur |

## Typographie

| Famille | Usage |
|---------|-------|
| **Impact** | Tout ce qui "crie" : titres, scores, CTA, uppercase |
| **DM Sans** | Corps de texte, descriptions, onboarding |
| **JetBrains Mono** | Données chiffrées : scores, timers, codes |

Règle : jamais de font-weight sur Impact (un seul weight).

## Ombres

Hard black uniquement : `box-shadow: Xpx Xpx 0px #000`

| Token | Value | Usage |
|-------|-------|-------|
| sm | `3px 3px 0px #000` | Badges, tags |
| md | `5px 5px 0px #000` | Boutons, inputs |
| lg | `8px 8px 0px #000` | Cards |
| xl | `10px 10px 0px #000` | Modals, hero |

Active state : `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

## Composants clés

**Cellule bingo :** 66×66px fixe. Grid 5×5, gap 4px, container 350×350px.

**Bouton primary :**
```tsx
bg-[#FFD93D] text-black font-impact uppercase tracking-widest
px-6 py-3 rounded-[12px] border-[3px] border-black shadow-[5px_5px_0px_black]
active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
```

**Footer nav :** `bg-[#FFD700] border-[3px] border-black rounded-[32px] shadow-[8px_8px_0px_black]`

## Animations

- `cell-winning` : victoire ligne, stagger `winningIndex * 80ms`, durée 0.45s
- `cell-mystery-unlock` : déverrouillage cellule mystère, 0.6s
- Easing pop : `cubic-bezier(0.34, 1.56, 0.64, 1)` (légèrement overshoot)

## Feedback haptique

- Clic cellule : `navigator.vibrate(30)`
- Victoire ligne : `navigator.vibrate([100, 50, 200])`
- Long press : `navigator.vibrate(20)` par tick

## Décisions

| Décision | Raison |
|----------|--------|
| Grid fixe 350×350px | Cohérence absolue sur tous les téléphones |
| Hard shadows | Identité "zine/print" vs app SaaS |
| Footer nav jaune | Seul élément clair = attention maximale |
| Cellule mystère center | Objectif intermédiaire à score≥5 |

## Sources

- [[design-md]] — source primaire

## Liens

- [[The Bingo Crawl]] — produit qui l'applique
- [[Composants UI]] — implémentation des composants
