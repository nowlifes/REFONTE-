---
type: concept
title: Système Témoin
aliases: [Witness Mode, témoin]
tags: [gameplay, validation, mécanique]
sources: 1
last_updated: 2026-05-05
---

# Système Témoin (Witness Mode)

## Définition

Mécanique de validation de cellules WITNESS dans [[The Bingo Crawl]] : un joueur choisit un autre joueur comme témoin pour confirmer qu'il a accompli un défi. Le témoin voit une bannière et doit accepter ou refuser.

## Infrastructure

Entièrement implémentée dans `services/gameService.ts` (lignes ~1537+).

**Fonctions :**
- `requestWitness(gameId, cellId, witnessPlayerId)` — joueur choisit son témoin
- `requestWitnessConfirmation()` — envoi de la demande au témoin
- `confirmWitness()` — le témoin accepte
- `rejectWitness()` — le témoin refuse
- `subscribeWitnessRequests(playerId)` — realtime, côté témoin

**Composants :**
- `WitnessRequestBanner.tsx` — bannière affichée au témoin désigné

**Migration SQL :** `supabase/migrations/003_witness_mode.sql`

## Point ouvert — Feature perdue

La règle "Témoin 2/1" (1 ou 2 témoins requis ?) n'a jamais été tranchée ni implémentée dans `ValidationModal.tsx`. Voir [[Features Perdues]].

## Sources

- [[claude-md-project]]

## Liens

- [[The Bingo Crawl]]
- [[Architecture Technique]] — gameService.ts
- [[Features Perdues]] — règle témoin 2/1 à clarifier
- [[Supabase]] — realtime subscriptions
