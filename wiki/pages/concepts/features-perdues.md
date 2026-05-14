---
type: concept
title: Features Perdues
aliases: [features à refaire, lost features]
tags: [backlog, dette-technique, priorité]
sources: 1
last_updated: 2026-05-05
---

# Features Perdues

## Définition

Fonctionnalités développées en local pour [[The Bingo Crawl]] mais jamais commitées — perdues. À refaire from scratch.

## Liste

### Mode KO
- **Quoi :** élimination progressive des joueurs
- **Statut :** règles à préciser avant implémentation
- **Complexité estimée :** haute (nouveau flow de jeu)

### Choix des barres
- **Quoi :** liste de bars preset que le Master peut sélectionner au lieu de saisir manuellement le nom
- **Statut :** à implémenter dans `MasterPage.tsx` (section Bar Change)
- **Complexité estimée :** moyenne

### Témoin 2/1
- **Quoi :** règle sur le nombre de témoins requis (1 ou 2 ?)
- **Statut :** à clarifier avec l'équipe, puis implémenter dans `ValidationModal.tsx`
- **Dépend de :** [[Système Témoin]]
- **Complexité estimée :** faible (une fois la règle décidée)

## Nuances

Ces features sont listées dans `CLAUDE.md` comme "jamais pushées". Pas de code existant à récupérer — repartir de zéro en lisant la logique actuelle de `gameService.ts`.

## Sources

- [[claude-md-project]]

## Liens

- [[The Bingo Crawl]]
- [[Système Témoin]] — Témoin 2/1 dépend de cette infrastructure
