# SHADOW TRADER — Institutional Cloud Trading Platform

> **Cloud-native, Bloomberg-grade trading terminal. Zero local execution.**

![Version](https://img.shields.io/badge/version-1.0.0--alpha-00e676)
![License](https://img.shields.io/badge/license-MIT-2979ff)
![Deploy](https://img.shields.io/badge/deploy-Vercel-20c997)

---

## 🚀 Quick Start

```bash
# 1. Clone / navigate
cd cloud_dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (see below)

# 4. Start development
npm run dev
# → http://localhost:3000
```

---

## 📁 Project Structure

```
cloud_dashboard/
├── app/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Main terminal (live chart + order entry)
│   │   ├── market/          # Global market overview + heatmap
│   │   ├── terminal/        # Advanced trading terminal (Binance data)
│   │   ├── strategies/      # Visual strategy builder
│   │   ├── backtest/        # Cloud backtesting engine + Monte Carlo
│   │   ├── portfolio/       # Portfolio management + equity curve
│   │   ├── journal/         # AI-enhanced trade journal
│   │   ├── risk/            # Risk management + position sizing
│   │   ├── research/        # AI research assistant + insights
│   │   └── settings/        # Profile, risk rules, API keys
│   ├── api/                 # API routes (serverless)
│   │   ├── market/          # Market data (Binance + Yahoo Finance)
│   │   ├── trades/          # Trade CRUD
│   │   ├── strategies/      # Strategy CRUD
│   │   ├── research/         # AI research analysis
│   │   └── portfolio/       # Portfolio data
│   └── globals.css          # Design system (dark terminal theme)
├── components/              # Shared UI components
├── lib/                     # Supabase client, utilities
├── supabase/schema.sql      # Complete PostgreSQL schema
├── DEPLOYMENT_PLAN.md       # Step-by-step cloud deployment
└── SYSTEM_ARCHITECTURE.md   # Full architecture documentation
```

---

## ⚙️ Configuration

Create `.env.local`:

```bash
# Supabase (for database — free tier)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Research (optional — works without it)
GROQ_API_KEY=gsk_your_groq_key

# Binance (for live trading data — free, no key needed for market data)
# No key required for public market data endpoints
```

---

## 📊 Features

### Modules

| Module | Description |
|---|---|
| **Terminal** | Live Binance candlestick chart + order entry with R:R calculator |
| **Market** | Global market overview with watchlists, gainers/losers, heatmap |
| **Strategies** | Visual rule builder with AND/OR conditions, 3 template strategies |
| **Backtest** | Cloud backtesting engine + Monte Carlo simulation |
| **Portfolio** | Equity curve, holdings, allocation pie chart, risk metrics |
| **Journal** | Trade journaling with mood tracking, AI pattern detection |
| **Risk** | Position sizing calculator, VaR, drawdown monitoring, alerts |
| **Research** | AI-powered market analysis, recommendations, trade setups |

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, CSS Variables (no Tailwind)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL, free tier)
- **Charts**: Custom canvas (zero external dependencies)
- **Data**: Binance public API (no key), Yahoo Finance
- **Deployment**: Vercel (free tier)

---

## 🌐 Deployment

### Option 1: Vercel (Recommended — Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd cloud_dashboard
vercel --prod
```

### Option 2: Hostinger VPS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs

# Clone repo
git clone <your-repo> cloud_dashboard
cd cloud_dashboard

# Install and run
npm install
npm run build
npm start -p 3000
```

### Option 3: Static Host (Hostinger File Manager)

Build first, then upload the `.next/` output:
```bash
npm run build
# Upload .next/static/ to /public_html/
# Full Next.js requires Node.js server (use Vercel or VPS)
```

---

## 🔑 API Keys

| Service | Required | Cost | Setup |
|---|---|---|---|
| Supabase | Yes | Free | [supabase.com](https://supabase.com) → New project → SQL Editor → run schema.sql |
| Groq AI | No | Free tier | [console.groq.com](https://console.groq.com) → API Keys |
| Binance | No (market data) | Free | No key needed for public endpoints |
| Yahoo Finance | No | Free | No key needed |

---

## 📐 Architecture

See `SYSTEM_ARCHITECTURE.md` for full architecture documentation including:
- Text-based architecture diagram
- Technology stack evaluation
- Database schema with all tables
- API endpoint specifications
- Security architecture

---

## 🔒 Security

- JWT authentication via Supabase Auth
- MFA support
- Role-based access (Trader / Portfolio Manager / Admin)
- API rate limiting (serverless)
- All data encrypted in transit (HTTPS)
- Sensitive config via environment variables

---

## 📈 Development

```bash
npm run dev        # Development server (port 3000)
npm run build      # Production build
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix linting
```

---

## 📄 License

MIT License — see LICENSE file.