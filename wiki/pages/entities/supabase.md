---
type: entity
title: Supabase
aliases: [supabase]
tags: [service, backend, base-de-données]
sources: 1
last_updated: 2026-05-05
---

# Supabase

## En bref

Backend-as-a-service utilisé par [[The Bingo Crawl]] — fournit PostgreSQL, Row Level Security (RLS), fonctions RPC, et realtime subscriptions.

## Ce qu'on sait

**Project ID :** `wcxtekmihkypevjdfffs`

**Fonctions clés :**
- `reset_all_data()` — utilise `TRUNCATE ... CASCADE`
- RLS activé — toutes les mutations passent par RPC ou `service_role`
- Secure sessions : table `sessions` avec UUID + `expires_at`
- `event_session` : contrôle l'état OPEN/CLOSED de l'événement

**Migrations existantes :**
- `20260408_secure_sessions.sql`
- `20260408_session_expires_at.sql`
- `001_pregame.sql`
- `002_master_validations.sql`
- `003_witness_mode.sql`

**Realtime :** utilisé pour les subscriptions joueurs, le système témoin (`subscribeWitnessRequests`), le feed d'activité.

## Sources

- [[claude-md-project]] — architecture Supabase

## Liens

- [[The Bingo Crawl]] — projet qui l'utilise
- [[Système Témoin]] — utilise les realtime subscriptions Supabase
