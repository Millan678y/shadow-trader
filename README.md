# Shadow Trader — AI Signal Co-Pilot

Institutional-grade trading signals for Solana & crypto traders.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Cache**: Upstash Redis
- **Auth**: Solana Wallet (SIWS)
- **Styling**: Tailwind CSS
- **Deploy**: Vercel

## Quick Start

```bash
cp .env.example .env.local
# Fill in your Supabase credentials
npm install
npm run dev
```

## Architecture

```
app/
  api/          # API routes (auth, signals, market)
  app/          # Protected routes (dashboard, signals, terminal, settings)
  page.tsx      # Landing page
lib/
  auth.ts       # SIWS verification + JWT sessions
  db.ts         # Supabase client
  risk.ts       # Deterministic position sizing engine
  redis.ts      # Cache + rate limiting
supabase/
  001_init.sql  # Database schema
```

## Key Principles

1. **Risk math is deterministic** — LLM provides direction + rationale; server computes position size
2. **Server-side validation** — No trade can be created without proper risk checks
3. **Auth via wallet** — SIWS (Sign-In With Solana) only
4. **Rate limiting** — Upstash Redis prevents API abuse

## Routes

- `/` — Landing
- `/app` — Dashboard
- `/app/signals` — Create & view signals
- `/app/terminal` — Live market analysis
- `/app/settings` — Profile, API keys, subscription