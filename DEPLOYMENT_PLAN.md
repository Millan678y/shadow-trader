# CLOUD DEPLOYMENT PLAN — Shadow Trader

## Architecture Overview
```
Vercel (Frontend/CDN)
    └── https://shadow-trader-cloud.vercel.app
            │
            ├── Static pages (SSG)
            ├── API routes (serverless)
            └── Realtime subscriptions (Supabase)
                    │
    ┌───────────────┼───────────────────┐
    ▼               ▼                   ▼
Supabase       Render/Fly.io        Cloudflare
(PostgreSQL    (Background Jobs     (CDN + Storage
 + Auth +        + Backtest          for images
  Storage)        Compute)             + video)
```

---

## STEP 1 — Supabase Setup (Database + Auth)

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Click **New Project** → Name: `shadow-trader`
3. Choose region closest to your users
4. Save the password shown — this is your database password
5. Wait 2 minutes for project to provision
6. Go to **Settings → API** and copy:
   - `SUPABASE_URL` (e.g. `https://xxxxx.supabase.co`)
   - `SUPABASE_ANON_KEY` (public, safe for browser)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret, server-side only)

### 1.2 Run Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Create a **New Query**
3. Paste contents of `supabase/schema.sql`
4. Click **Run** — should say "Success: 0 rows affected"

### 1.3 Configure Auth Settings
1. **Authentication → Providers → Email** — Enable email/password
2. **Authentication → Providers → Google** — Enable OAuth (need Google Cloud Console credentials)
3. **Authentication → Settings**:
   - Site URL: `https://shadow-trader-cloud.vercel.app`
   - Redirect URLs: `https://shadow-trader-cloud.vercel.app/api/auth/callback`

### 1.4 Get Supabase Credentials
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...xxxx
```

---

## STEP 2 — GitHub Repository

### 2.1 Push to GitHub
```bash
cd /root/ai_trading_system/cloud_dashboard
git init
git add .
git commit -m "Initial commit: Shadow Trader Cloud Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shadow-trader-cloud.git
git push -u origin main
```

---

## STEP 3 — Vercel Deployment (Frontend)

### 3.1 Connect to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **Add New → Project**
4. Find `shadow-trader-cloud` repo
5. Click **Import**

### 3.2 Configure Environment Variables
In Vercel → Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...xxxx
NEXT_PUBLIC_BINANCE_API=https://api.binance.com
NEXT_PUBLIC_YAHOO_PROXY=https://query1.finance.yahoo.com
```

### 3.3 Deploy
- Framework Preset: **Next.js**
- Root Directory: `.` (default)
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)

Click **Deploy** — takes ~2 minutes.

Your app is now live at: `https://shadow-trader-cloud.vercel.app`

---

## STEP 4 — Custom Domain (Hostinger)

### 4.1 Buy Domain on Hostinger
1. Go to https://hostinger.com → Domains
2. Search for your domain (e.g. `shadowtrader.cloud`)
3. Purchase (~₹500/year for `.cloud` TLD)
4. Go to **hPanel → DNS Zone**

### 4.2 Point to Vercel
Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Wait 5-30 minutes for DNS propagation.

### 4.3 Connect in Vercel
1. Vercel → Project → Settings → Domains
2. Add `shadowtrader.cloud`
3. Vercel will auto-detect and configure SSL

---

## STEP 5 — Background Jobs (Free Tier Alternative)

Since Vercel serverless functions timeout at 10s, backtests need a separate worker:

### Option A: Render Free Tier (Recommended)
1. Go to https://render.com → Sign up
2. **New → Background Worker**
3. Connect your GitHub repo
4. Set:
   - Start Command: `node supabase/functions/backtest-worker/index.js`
   - Plan: **Free** (sleeps after 15 min inactivity)

### Option B: Fly.io Free Tier
```bash
fly launch --image node:18
fly scale count 0  # scale to zero when not running
fly deploy
```

### Option C: Keep It Simple (Recommended for MVP)
**Skip background workers entirely.** Run backtests as synchronous API routes:
- Supabase REST API timeout: 60s
- For backtests < 60s, synchronous execution works fine
- Use smaller datasets (1 year instead of 5) for free tier

---

## STEP 6 — Free Market Data Sources

### Binance (Crypto — No API Key for Public Data)
```javascript
// All these are free, no API key needed:
GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1000
GET https://api.binance.com/api/v3/orderbook?symbol=BTCUSDT&limit=20
```

### Yahoo Finance (Stocks/Forex/Commodities)
```javascript
// Free via their API (unofficial but stable):
GET https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD
GET https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC  // SPX
GET https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX   // VIX
GET https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X  // Forex
```

### CoinGecko (Alternative Crypto)
```javascript
// Free tier: 10-50 calls/minute
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
```

---

## STEP 7 — Environment Variables Summary

Create `.env.local` in your project root:
```bash
# Supabase (from Step 1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...xxx

# Database (for server-side operations)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# AI (optional — for AI research module)
OPENAI_API_KEY=sk-xxxx  # or use free Groq/Anthropic
GROQ_API_KEY=gsk_xxxx

# Exchange APIs (optional — for live trading)
BINANCE_API_KEY=xxx
BINANCE_SECRET=xxx
```

---

## STEP 8 — Post-Deployment Checklist

- [ ] `.env.local` variables set in Vercel
- [ ] Database schema applied in Supabase
- [ ] Supabase Auth redirect URLs configured
- [ ] Custom domain connected (if using Hostinger)
- [ ] SSL certificate active (auto-provisioned by Vercel)
- [ ] First user registration works
- [ ] Market data API returns live prices
- [ ] Dashboard loads without errors in Chrome mobile

---

## Deployment Summary

| Component | Service | Cost | URL |
|-----------|---------|------|-----|
| Frontend | Vercel Free | $0 | shadow-trader-cloud.vercel.app |
| Database | Supabase Free | $0 | db.xxxxx.supabase.co |
| Auth | Supabase | $0 | (included above) |
| Background Jobs | Render Free (optional) | $0 | shadow-trader.onrender.com |
| Domain | Hostinger | ~$3/mo | shadowtrader.cloud |
| CDN/Storage | Cloudflare R2 Free | $0 | (if needed) |

**Total: ~$3/month** for a fully cloud-hosted institutional trading platform.

---

## Troubleshooting

**Market data not loading?**
→ Check CORS headers. Use Next.js API routes as proxies instead of calling Binance directly from the browser.

**Auth redirects failing?**
→ Verify Site URL in Supabase matches exactly (including https:// and no trailing slash).

**Build failing on Vercel?**
→ Check `package.json` scripts. Ensure `npm run build` works locally first with `npm run build`.

**Database connection errors?**
→ Supabase connection pool size is limited on free tier. Use connection pooling via Supabase's built-in pooler (port 6543).