# Shadow Trader — AI Signal Co-Pilot

**The AI Signal Co-Pilot for Solana & Crypto Traders**

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Auth**: SIWS (Sign-In-With-Solana) — wallet-based, no passwords
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Cache/Rate Limiting**: Upstash Redis
- **Risk Engine**: Deterministic position sizing (server-side, LLM cannot override)
- **Deploy**: Cloudflare Pages

---

## Features

### Signal Generation
- Multi-factor scoring: trend, momentum, risk, news, structure, order flow
- Server-side risk calculation (2% trade / 10% daily drawdown cap / 5 trades/24h)
- R-multiple targeting with ATR-based stops
- Trial: 3 free signals, server-enforced

### Risk Engine Rules (Non-Negotiable)
- Position size = deterministic formula, not LLM opinion
- Rejects if: risk% < 0.25%, risk% > 5%, R-mult < 0.5, stop distance <= 0
- Max 5 trades per rolling 24h
- 10% max daily drawdown

### Pages
| Route | Description |
|---|---|
| `/` | Landing |
| `/app` | Dashboard (KPIs, live signals, recent trades, watchlist) |
| `/app/signals` | Signal form + submit |
| `/app/terminal` | Trading terminal |
| `/app/settings` | API keys, risk rules |

---

## Deploy to Cloudflare Pages

### One-Time GitHub Connection (in Cloudflare Dashboard)

1. Go to **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select `Millan678y/shadow-trader`
4. **Build settings**:
   - Build command: `npm install && npm run build`
   - Build output directory: `.next`
5. Click **Deploy**

### Add GitHub Secrets (for the deploy workflow)

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | How to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → **My Profile** → **API Tokens** → Create token (use "Edit Cloudflare Workers" template) |
| `CLOUDFLARE_ACCOUNT_ID` | Found in the Cloudflare Pages project URL or overview page |

### Environment Variables

Add these in Cloudflare Pages → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `JWT_SECRET` | Any random 32+ char string |

### Supabase Database Setup

1. Create project at **[supabase.com](https://supabase.com)**
2. Go to **SQL Editor** → run the schema from `supabase/001_init.sql`
3. Copy URL + anon key → into Cloudflare env vars above

---

## Local Dev Setup

```bash
git clone https://github.com/Millan678y/shadow-trader
cd shadow-trader
cp .env.example .env.local   # fill in credentials
npm install
npm run dev
```

---

## Architecture

```
lib/
  auth.ts       — SIWS wallet verification + JWT sessions
  risk.ts       — Deterministic position sizing engine
  db.ts         — Supabase client
  redis.ts      — Upstash cache + rate limiting

app/
  api/
    auth/       — SIWS nonce + verify + session
    signals/    — POST (create signal w/ risk calc), GET (list)
    market/     — Market data (mock or real Binance)
  app/
    page.tsx    — Dashboard
    signals/    — Signal form
    terminal/   — Trading terminal
    settings/   — Config
  layout.tsx    — Root layout
  page.tsx      — Landing

supabase/
  001_init.sql  — Full schema (users, signals, subscriptions,
                  watchlists, journal, alerts, trial_grants, referrals)
```

---

## Signal Scoring

Every signal receives a 0-100 score across 6 dimensions:

| Factor | Weight | Description |
|---|---|---|
| Market Regime | 15% | Trend, range, volatile |
| Trend Score | 20% | MA alignment, higher highs/lows |
| Momentum Score | 20% | RSI, MACD divergence |
| Risk Score | 20% | ATR stops, drawdown |
| News Score | 10% | Sentiment from news feeds |
| Order Flow | 15% | Volume profile, liquidations |

**Signal thresholds**: ≥75 = BUY, ≤45 = SELL, 45-75 = NEUTRAL

---

## Multi-Agent Pipeline

```
Research Agent
     ↓
News Agent
     ↓
Order Flow Agent
     ↓
Risk Agent (veto authority)
     ↓
Execution Agent
     ↓
Portfolio Agent
```

---

## License

MIT
