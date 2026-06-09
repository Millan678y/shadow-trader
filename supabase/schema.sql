-- SHADOW TRADER — Complete PostgreSQL Schema (Supabase)
-- Run this in Supabase SQL Editor to initialize your database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════
CREATE TYPE user_role AS ENUM ('trader', 'portfolio_manager', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'institutional');
CREATE TYPE asset_class AS ENUM ('crypto', 'stock', 'forex', 'futures', 'etf', 'commodity', 'index');
CREATE TYPE trade_side AS ENUM ('LONG', 'SHORT');
CREATE TYPE trade_status AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE backtest_status AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE regime_type AS ENUM ('RISK_ON', 'RISK_OFF', 'NEUTRAL', 'HIGH_VOL', 'DXY_BULL', 'DXY_BEAR');

-- ═══════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    role            user_role DEFAULT 'trader',
    subscription    subscription_tier DEFAULT 'free',
    preferences     JSONB DEFAULT '{}',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX users_email_idx ON public.users (email);

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIOS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.portfolios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    initial_balance REAL DEFAULT 10000.0,
    currency        TEXT DEFAULT 'USD',
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX portfolios_user_id_idx ON public.portfolios (user_id);

-- ═══════════════════════════════════════════════════════════
-- HOLDINGS (current positions)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.holdings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    symbol          TEXT NOT NULL,
    asset_class     asset_class DEFAULT 'crypto',
    quantity        REAL NOT NULL,
    avg_entry_price REAL NOT NULL,
    current_price   REAL,
    realized_pnl    REAL DEFAULT 0,
    unrealized_pnl  REAL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);
CREATE INDEX holdings_portfolio_id_idx ON public.holdings (portfolio_id);
CREATE INDEX holdings_symbol_idx ON public.holdings (symbol);

-- ═══════════════════════════════════════════════════════════
-- STRATEGIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.strategies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    rules       JSONB NOT NULL DEFAULT '[]',
    -- rules format: [{"type":"indicator","indicator":"RSI","compare":"<","value":30,"and":true},{"type":"time","session":"LONDON"}]
    parameters  JSONB DEFAULT '{}',
    is_active   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX strategies_user_id_idx ON public.strategies (user_id);
CREATE INDEX strategies_is_active_idx ON public.strategies (is_active);

-- ═══════════════════════════════════════════════════════════
-- TRADES (complete trade history)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.trades (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    portfolio_id    UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
    strategy_id     UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
    symbol          TEXT NOT NULL,
    asset_class     asset_class DEFAULT 'crypto',
    side            trade_side NOT NULL,
    entry_price     REAL NOT NULL,
    exit_price      REAL,
    quantity        REAL NOT NULL,
    entry_time      TIMESTAMPTZ NOT NULL,
    exit_time       TIMESTAMPTZ,
    status          trade_status DEFAULT 'OPEN',
    pnl             REAL,
    fees            REAL DEFAULT 0,
    entry_reason    TEXT,
    exit_reason     TEXT,
    tags            TEXT[] DEFAULT '{}',
    journal_entry_id UUID,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX trades_user_id_idx ON public.trades (user_id);
CREATE INDEX trades_portfolio_id_idx ON public.trades (portfolio_id);
CREATE INDEX trades_symbol_idx ON public.trades (symbol);
CREATE INDEX trades_entry_time_idx ON public.trades (entry_time DESC);
CREATE INDEX trades_status_idx ON public.trades (status);
CREATE INDEX trades_pnl_idx ON public.trades (pnl);

-- ═══════════════════════════════════════════════════════════
-- WATCHLISTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.watchlists (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX watchlists_user_id_idx ON public.watchlists (user_id);

CREATE TABLE public.watchlist_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
    symbol       TEXT NOT NULL,
    asset_class  asset_class DEFAULT 'crypto',
    added_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(watchlist_id, symbol)
);
CREATE INDEX watchlist_items_watchlist_id_idx ON public.watchlist_items (watchlist_id);

-- ═══════════════════════════════════════════════════════════
-- ALERTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.alerts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    symbol        TEXT,
    condition     TEXT NOT NULL, -- 'RSI > 70', 'price < 60000', 'VIX > 30'
    target_value  REAL,
    is_triggered  BOOLEAN DEFAULT FALSE,
    triggered_at  TIMESTAMPTZ,
    message       TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX alerts_user_id_idx ON public.alerts (user_id);
CREATE INDEX alerts_is_triggered_idx ON public.alerts (is_triggered);

-- ═══════════════════════════════════════════════════════════
-- BACKTESTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.backtests (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
    name        TEXT,
    status      backtest_status DEFAULT 'QUEUED',
    parameters  JSONB NOT NULL DEFAULT '{}',
    -- {symbol, timeframe, start_date, end_date, initial_balance, risk_per_trade}
    results     JSONB,
    -- {trades_count, win_rate, profit_factor, sharpe, sortino, max_drawdown, cagr, equity_curve: []}
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX backtests_user_id_idx ON public.backtests (user_id);
CREATE INDEX backtests_status_idx ON public.backtests (status);

-- ═══════════════════════════════════════════════════════════
-- JOURNAL ENTRIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.journal_entries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trade_id    UUID REFERENCES public.trades(id) ON DELETE SET NULL,
    title       TEXT,
    content     TEXT NOT NULL,
    tags        TEXT[] DEFAULT '{}',
    mood        TEXT CHECK (mood IN ('disciplined', 'neutral', 'revenge', 'fear', 'greedy', 'fOMO')),
    screenshot_url TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX journal_entries_user_id_idx ON public.journal_entries (user_id);
CREATE INDEX journal_entries_tags_idx ON public.journal_entries USING GIN(tags);

-- ═══════════════════════════════════════════════════════════
-- AI REPORTS (generated analysis)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.ai_reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_type  TEXT NOT NULL, -- 'trade_review', 'strategy_analysis', 'risk_assessment', 'market_summary'
    title        TEXT,
    content      JSONB NOT NULL,
    -- {summary, key_findings: [], recommendations: [], warnings: []}
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ai_reports_user_id_idx ON public.ai_reports (user_id);
CREATE INDEX ai_reports_type_idx ON public.ai_reports (report_type);

-- ═══════════════════════════════════════════════════════════
-- PERFORMANCE METRICS (daily snapshots)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.performance_metrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    portfolio_id    UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    equity          REAL NOT NULL,
    daily_pnl       REAL DEFAULT 0,
    cumulative_pnl  REAL DEFAULT 0,
    drawdown        REAL DEFAULT 0,
    win_rate        REAL,
    sharpe_ratio    REAL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, portfolio_id, date)
);
CREATE INDEX perf_user_date_idx ON public.performance_metrics (user_id, date DESC);
CREATE INDEX perf_portfolio_date_idx ON public.performance_metrics (portfolio_id, date DESC);

-- ═══════════════════════════════════════════════════════════
-- MARKET DATA CACHE (for API performance)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.market_cache (
    symbol      TEXT NOT NULL,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (symbol)
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users: users see own row only
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Portfolios: users see own portfolios
CREATE POLICY "portfolios_all_own" ON public.portfolios FOR ALL USING (auth.uid() = user_id);

-- Holdings: users see holdings in their portfolios (via portfolio join)
CREATE POLICY "holdings_all_own" ON public.holdings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolios p
            WHERE p.id = holdings.portfolio_id AND p.user_id = auth.uid()
        )
    );

-- Strategies: users see own strategies
CREATE POLICY "strategies_all_own" ON public.strategies FOR ALL USING (auth.uid() = user_id);

-- Trades: users see own trades
CREATE POLICY "trades_all_own" ON public.trades FOR ALL USING (auth.uid() = user_id);

-- Watchlists: users see own watchlists
CREATE POLICY "watchlists_all_own" ON public.watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "watchlist_items_all_own" ON public.watchlist_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.watchlists w
            WHERE w.id = watchlist_items.watchlist_id AND w.user_id = auth.uid()
        )
    );

-- Alerts: users see own alerts
CREATE POLICY "alerts_all_own" ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- Backtests: users see own backtests
CREATE POLICY "backtests_all_own" ON public.backtests FOR ALL USING (auth.uid() = user_id);

-- Journal: users see own journal
CREATE POLICY "journal_all_own" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- AI Reports: users see own reports
CREATE POLICY "ai_reports_all_own" ON public.ai_reports FOR ALL USING (auth.uid() = user_id);

-- Performance: users see own metrics
CREATE POLICY "perf_all_own" ON public.performance_metrics FOR ALL USING (auth.uid() = user_id);

-- Market cache: public read
CREATE POLICY "market_cache_public_read" ON public.market_cache FOR SELECT USING (true);
CREATE POLICY "market_cache_public_write" ON public.market_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "market_cache_public_update" ON public.market_cache FOR UPDATE USING (true);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_portfolios_updated_at BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_strategies_updated_at BEFORE UPDATE ON public.strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_journal_updated_at BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate unrealized P&L on holding update
CREATE OR REPLACE FUNCTION update_holding_pnl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_price IS NOT NULL THEN
        NEW.unrealized_pnl = (NEW.current_price - NEW.avg_entry_price) * NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_holding_pnl BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION update_holding_pnl();

-- ═══════════════════════════════════════════════════════════
-- PERFORMANCE VIEWS
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_open_positions AS
SELECT
    t.portfolio_id,
    t.symbol,
    t.asset_class,
    t.side,
    t.entry_price,
    t.quantity,
    t.entry_time,
    (t.entry_price * t.quantity) AS exposure,
    p.name AS portfolio_name,
    u.id AS user_id
FROM public.trades t
JOIN public.portfolios p ON p.id = t.portfolio_id
JOIN public.users u ON u.id = p.user_id
WHERE t.status = 'OPEN';

CREATE OR REPLACE VIEW v_trade_performance AS
SELECT
    t.user_id,
    DATE_TRUNC('day', t.entry_time) AS trade_date,
    COUNT(*) AS total_trades,
    COUNT(*) FILTER (WHERE t.pnl > 0) AS winning_trades,
    COUNT(*) FILTER (WHERE t.pnl < 0) AS losing_trades,
    AVG(t.pnl) AS avg_pnl,
    SUM(t.pnl) AS total_pnl,
    MAX(t.pnl) AS best_trade,
    MIN(t.pnl) AS worst_trade,
    AVG(t.pnl) FILTER (WHERE t.pnl > 0) AS avg_win,
    AVG(t.pnl) FILTER (WHERE t.pnl < 0) AS avg_loss
FROM public.trades t
WHERE t.status = 'CLOSED' AND t.pnl IS NOT NULL
GROUP BY t.user_id, DATE_TRUNC('day', t.entry_time)
ORDER BY trade_date DESC;

CREATE OR REPLACE VIEW v_portfolio_summary AS
SELECT
    p.id AS portfolio_id,
    p.user_id,
    p.name,
    p.initial_balance,
    COALESCE(SUM(t.pnl) FILTER (WHERE t.status = 'CLOSED'), 0) AS realized_pnl,
    COALESCE(SUM(t.pnl) FILTER (WHERE t.status = 'OPEN'), 0) AS unrealized_pnl,
    COUNT(t.id) FILTER (WHERE t.status = 'OPEN') AS open_positions,
    COUNT(t.id) FILTER (WHERE t.status = 'CLOSED') AS closed_trades
FROM public.portfolios p
LEFT JOIN public.trades t ON t.portfolio_id = p.id
GROUP BY p.id;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA (optional demo)
-- ═══════════════════════════════════════════════════════════
-- Uncomment below to create a demo portfolio with sample trades
/*
INSERT INTO public.portfolios (user_id, name, initial_balance)
VALUES (auth.uid(), 'Main Trading Portfolio', 10000);

INSERT INTO public.strategies (user_id, name, rules, is_active)
VALUES (
    auth.uid(),
    'SMC Killzone Long',
    '[{"type":"killzone","session":"LONDON"},{"type":"structure","bos":"bullish"},{"type":"orderflow","delta":">0"}]',
    true
);
*/