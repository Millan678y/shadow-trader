# SHADOW TRADER — Executive Summary

## Platform Overview
**Shadow Trader** is an institutional-grade cloud trading platform designed for professional traders, portfolio managers, and trading firms. It operates entirely in the cloud — no local execution, no localhost dependencies, no desktop applications.

The platform provides real-time market analysis, strategy development, cloud-based backtesting, portfolio management, risk analytics, and AI-powered trading research — accessible from any device with a browser.

---

## Mission
Democratize institutional-grade trading infrastructure. Give individual traders and small funds access to the same caliber of tools that power billion-dollar hedge funds — at zero to near-zero cost.

---

## Target Users

| User Type | Description | Primary Use Case |
|-----------|-------------|-----------------|
| **Retail Trader** | Self-directed individual | Market analysis, trade journaling, strategy backtesting |
| **Professional Trader** | Active trader with proven edge | Real-time execution, risk management, performance analytics |
| **Portfolio Manager** | Manages capital for individuals/funds | Multi-asset allocation, correlation risk, drawdown control |
| **Trading Firm** | Small-to-medium prop shop | Strategy deployment, compliance monitoring, P&L attribution |

---

## Competitive Positioning

| Feature | Shadow Trader | TradingView | QuantConnect | Bloomberg |
|---------|-------------|-------------|-------------|-----------|
| Cloud-only execution | ✅ | ❌ | ✅ | ❌ |
| Free tier | ✅ | ✅ (limited) | ✅ (limited) | ❌ |
| Self-hostable | ❌ | ❌ | ❌ | ❌ |
| SMC/Order Flow natively | ✅ | ❌ | ❌ | ❌ |
| Killzone engine | ✅ | ❌ | ❌ | ❌ |
| Institutional risk rules | ✅ | Basic | Basic | ✅ |
| Mobile-first design | ✅ | ✅ | ❌ | ❌ |

---

## Core Modules

1. **Market Overview** — Global multi-asset watchlists, heatmaps, gainers/losers
2. **Trading Terminal** — Multi-chart layouts, TradingView integration, 8 timeframes
3. **Strategy Builder** — Visual drag-and-drop rule constructor, JSON export
4. **Cloud Backtesting** — Server-side historical simulation, no local compute
5. **Portfolio Management** — Equity curves, holdings, allocation, correlation
6. **Trade Journal** — Structured entries, AI pattern detection, performance insights
7. **Risk Management** — VaR/CVaR, position sizing, daily loss limits, drawdown gates
8. **AI Research** — Strategy analysis, trade review, market summaries, diagnostics

---

## Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 portfolio, 50 trades, basic analytics, 1 strategy |
| **Pro** | $19/mo | Unlimited portfolios, trades, strategies, backtesting |
| **Institutional** | $99/mo | API access, multi-user, custom data feeds, SLA |

---

## Asset Class Support
- **Crypto:** BTC, ETH, SOL, and 200+ altcoins via Binance
- **Stocks:** US equities via Yahoo Finance
- **Forex:** Majors, minors, exotics via Yahoo Finance
- **Futures:** CME equity index futures
- **ETFs:** SPY, QQQ, sector ETFs
- **Commodities:** Gold, oil, agricultural via CME

---

## Technical Philosophy
- **Cloud-native:** Every component runs in the cloud. Zero local compute.
- **Privacy-first:** User data encrypted at rest, never sold, exportable anytime
- **Resilient:** Graceful degradation when data providers are unavailable
- **Extensible:** Modular architecture allows plugin-style feature addition
- **Transparent:** Open logging, auditable P&L, no black-box decisions

---

## Deployment Target
- **Frontend:** Vercel (free tier, global CDN)
- **Backend:** Render / Fly.io (free tier, auto-sleeps on inactivity)
- **Database:** Supabase (500MB PostgreSQL, free tier)
- **Auth:** Supabase Auth (email + Google OAuth, free tier)
- **Storage:** Cloudflare R2 (free tier, 10GB/mo)
- **Domain:** Custom domain on Hostinger ($2-5/month)

---

## Current Status
- ✅ Phase 1-5 complete (local bot with real-time data)
- 🔄 Phase 6 in progress (cloud dashboard migration)
- ⬜ Phase 7+ (multi-tenant, backtesting engine, AI integration)

---

*Last updated: June 2026*