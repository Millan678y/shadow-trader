# SYSTEM ARCHITECTURE

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Mobile   │  │ Tablet   │  │ Desktop  │  │ TradingView Embed    │  │
│  │ Chrome   │  │ Safari   │  │ Chrome   │  │ (iframe)             │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
└───────┼─────────────┼─────────────┼───────────────────┼─────────────┘
        │             │             │                   │
        └─────────────┴─────────────┴───────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    VERCEL CDN       │
                    │  (Next.js 14 App)   │
                    │  Static + SSR       │
                    │  Edge Caching       │
                    └─────────┬──────────┘
                              │ HTTPS/WSS
        ┌─────────────────────┼──────────────────────┐
        │                     │                       │
┌───────▼───────┐   ┌─────────▼──────┐   ┌───────────▼─────────┐
│ SUPABASE      │   │ RENDER/Fly.io   │   │ MARKET DATA         │
│ ├─ PostgreSQL │   │ (Node.js API)   │   │ ├─ Binance WebSocket│
│ ├─ Auth       │   │                 │   │ ├─ Yahoo Finance    │
│ ├─ Storage    │   │ Rate Limiter    │   │ ├─ CoinGecko        │
│ └─ Realtime   │   │ Business Logic  │   │ └─ Alpha Vantage    │
│   (WS push)   │   │ Backtest Engine │   └─────────────────────┘
└───────────────┘   └─────────────────┘
```

## Component Architecture

```
shadow-trader-cloud/
│
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth pages (login, register, reset)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Sidebar + TopBar layout
│   │   ├── page.tsx              # Main dashboard (live bot view)
│   │   ├── market/page.tsx        # Market overview + heatmap
│   │   ├── terminal/page.tsx      # TradingView terminal
│   │   ├── strategies/page.tsx    # Strategy builder
│   │   ├── backtest/page.tsx      # Cloud backtesting
│   │   ├── portfolio/page.tsx     # Portfolio analytics
│   │   ├── journal/page.tsx       # Trade journal
│   │   ├── risk/page.tsx          # Risk management
│   │   └── research/page.tsx      # AI research assistant
│   │
│   ├── api/                      # API Routes (serverless)
│   │   ├── auth/[...supabase]/    # Supabase auth handler
│   │   ├── market/route.ts        # Market data proxy
│   │   ├── portfolio/route.ts     # Portfolio CRUD
│   │   ├── trades/route.ts         # Trade CRUD
│   │   ├── backtest/route.ts      # Backtest runner (async)
│   │   ├── journal/route.ts        # Journal CRUD
│   │   ├── risk/route.ts           # Risk calculations
│   │   └── ai/route.ts             # AI research proxy
│   │
│   ├── globals.css               # Design system (CSS variables)
│   └── layout.tsx                # Root layout (fonts, metadata)
│
├── components/                   # React component library
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── TopBar.tsx            # Header bar
│   ├── charts/
│   │   ├── CandlestickChart.tsx  # Chart.js candlestick
│   │   ├── EquityCurve.tsx       # Portfolio equity line chart
│   │   ├── PieChart.tsx          # Allocation pie
│   │   └── HeatmapChart.tsx      # Market heatmap grid
│   ├── trading/
│   │   ├── PositionsTable.tsx     # Open positions
│   │   ├── TradeLog.tsx          # Recent trades
│   │   └── OrderFlow.tsx         # Delta/absorption display
│   ├── strategy/
│   │   ├── StrategyBuilder.tsx   # Visual rule constructor
│   │   └── BacktestForm.tsx      # Backtest parameter form
│   ├── journal/
│   │   └── JournalEntry.tsx      # Journal form + cards
│   ├── risk/
│   │   └── RiskMeter.tsx         # VaR gauge
│   ├── macro/
│   │   ├── MacroContext.tsx      # DXY/VIX/SPX panel
│   │   └── KillzoneStatus.tsx    # Session indicators
│   └── ui/
│       ├── MetricCard.tsx        # Single KPI
│       ├── DataTable.tsx          # Sortable table
│       └── AIChat.tsx            # Research chat
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client (SSR)
│   │   └── middleware.ts         # Auth middleware
│   ├── market/
│   │   ├── binance.ts            # Binance REST + WebSocket
│   │   └── yahoo.ts              # Yahoo Finance scraper
│   ├── backtest/
│   │   └── engine.ts             # Server-side backtest logic
│   ├── risk/
│   │   └── calculations.ts        # VaR, position sizing, drawdown
│   └── utils/
│       ├── formatters.ts         # Price/number formatting
│       └── constants.ts          # Trading constants
│
├── types/
│   └── index.ts                 # All TypeScript interfaces
│
├── supabase/
│   ├── schema.sql                # Full PostgreSQL schema
│   └── migrations/               # Migration files
│
└── public/
    ├── icons/                   # SVG icons
    └── og-image.png             # Social sharing image
```

## Data Flow

### Real-Time Market Data Flow
```
Binance WebSocket ──→ API Route ──→ Supabase Realtime ──→ Browser (via subscriptions)
                    ──→ Cache (in-memory, 3s TTL)
```

### Backtest Flow
```
User submits parameters
        │
        ▼
POST /api/backtest ──→ Job queued ──→ Background worker (Render)
        │                                    │
        └── 202 Accepted (job_id)            ▼
                              Worker fetches historical data from Binance
                                    │
                                    ▼
                              Backtest simulation runs
                                    │
                                    ▼
                              Results stored in PostgreSQL
                                    │
                                    ▼
                              GET /api/backtest/[id] ──→ User polls for results
```

### Trade Execution Flow
```
Strategy signal generated
        │
        ▼
Risk check (VaR, position size, daily DD)
        │
        ├── PASS ──→ Order placed via exchange API
        │
        └── FAIL ──→ Trade rejected, logged
        │
        ▼
Trade recorded in PostgreSQL
        │
        ▼
P&L calculated, equity updated
        │
        ▼
Real-time update via Supabase Realtime → Dashboard refreshes
```

## Authentication Flow
```
User submits email/password
        │
        ▼
Supabase Auth (email) or Google OAuth
        │
        ▼
JWT issued (access_token + refresh_token)
        │
        ├── Access token stored in httpOnly cookie
        ├── Refresh token stored in Supabase
        └── User metadata (role, subscription) stored in JWT claims
        │
        ▼
Next.js Middleware validates JWT on every protected route
        │
        ├── Valid ──→ Request proceeds
        └── Invalid ──→ Redirect to /login
```

## Caching Strategy
```
Request ──→ Vercel Edge Cache (60s for market data)
                    │
                    ├── HIT ──→ Return cached
                    │
                    └── MISS ──→ API Route
                                        │
                                        ├── /api/market ──→ 3s memory cache
                                        ├── /api/backtest ──→ No cache (compute)
                                        └── /* ──→ Supabase (direct)
```

## Environment Architecture
```
DEVELOPMENT:  localhost:3000 (next dev)
STAGING:      vercel.app preview deploys
PRODUCTION:   shadowtrader.cloud (custom domain)
               shadowtrader-app.vercel.app (Vercel subdomain)

Database:     db.[project].supabase.co (PostgreSQL 5432)
Auth:         [project].supabase.co/auth/v1
Storage:      [project].supabase.co/storage/v1
Realtime:     [project].supabase.co/realtime/v1
```