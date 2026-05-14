# The Bingo Crawl

**The Bingo Crawl** is a real-time multiplayer bingo game designed for bar crawls and social events.

Players complete live challenges on a bingo grid while a **Bingo Master** orchestrates the session — managing bar transitions, validating completions, and triggering special events.

## Features

- **Real-time multiplayer** — live game state synced across all players via Supabase
- **Bingo grid** — 25 challenges per player, including a mystery cell unlocked by score
- **Witness system** — players designate a witness to validate their challenge completion
- **Joker system** — skip a challenge when you're stuck
- **Bar transitions** — master triggers timed countdowns when moving to the next bar
- **Badges & leaderboard** — earn badges, compete on the live scoreboard
- **Session security** — QR code-based session access with expiration
- **Offline support** — action queue that syncs when reconnected
- **i18n** — English and French

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4
- Supabase (PostgreSQL + RLS + Realtime)

## Getting Started

```bash
bun install
bun run dev
```

Requires a `.env.local` with:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## License

Copyright © 2026. All rights reserved. See [LICENSE](./LICENSE).
