-- Shadow Trader — Full Supabase Schema
-- PostgreSQL with Row Level Security
-- Run in Supabase SQL Editor or via migration

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fuzzy search

-- ============================================================
-- ENUMS
-- ============================================================
create type subscription_tier as enum ('free', 'pro', 'elite', 'vip');
create type signal_direction as enum ('long', 'short', 'neutral');
create type signal_sentiment as enum ('bullish', 'bearish', 'neutral');
create type market_regime as enum ('trending_up', 'trending_down', 'ranging', 'volatile');
create type trade_status as enum ('open', 'closed', 'cancelled');
create type journal_mood as enum ('confident', 'neutral', 'fearful', 'greedy', 'calm', 'stressed');
create type backtest_status as enum ('pending', 'running', 'completed', 'failed');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  subscription  subscription_tier not null default 'free',
  subscription_expires_at timestamptz,
  max_watchlists integer not null default 3,
  max_signals_history integer not null default 100,
  telegram_id   bigint,
  alert_channel text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index profiles_wallet_idx on public.profiles (wallet_address);
create index profiles_subscription_idx on public.profiles (subscription);

-- ============================================================
-- TRADE SIGNALS (AI-generated)
-- ============================================================
create table public.signals (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  symbol           text not null,
  direction        signal_direction not null,
  entry_price      numeric(18, 8),
  stop_loss        numeric(18, 8),
  take_profit      numeric(18, 8),
  risk_percent     numeric(5, 2),

  -- 7-Factor Scoring (0-100 each)
  market_regime_score  smallint check (market_regime_score between 0 and 100),
  trend_score          smallint check (trend_score between 0 and 100),
  momentum_score       smallint check (momentum_score between 0 and 100),
  risk_score           smallint check (risk_score between 0 and 100),
  news_score           smallint check (news_score between 0 and 100),
  structure_score      smallint check (structure_score between 0 and 100),
  orderflow_score      smallint check (orderflow_score between 0 and 100),
  total_score          smallint check (total_score between 0 and 100),

  sentiment       signal_sentiment,
  regime          market_regime,
  timeframe      text not null default '1h',
  status          text not null default 'active',
  expires_at      timestamptz,
  executed_at     timestamptz,
  closed_at       timestamptz,
  pnl_percent     numeric(10, 4),
  pnl_abs         numeric(18, 8),

  -- Metadata
  ai_model        text,
  confidence      smallint check (confidence between 0 and 100),
  reasoning       text,
  source          text, -- 'news', 'orderflow', 'technical', 'macro'
  created_at      timestamptz not null default now()
);

create index signals_user_idx on public.signals (user_id);
create index signals_symbol_idx on public.signals (symbol);
create index signals_status_idx on public.signals (status);
create index signals_created_idx on public.signals (created_at desc);
create index signals_total_score_idx on public.signals (total_score desc);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  tier                subscription_tier not null,
  stripe_customer_id  text,
  stripe_subscription_id text,
  status              text not null default 'active',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

-- ============================================================
-- WATCHLISTS
-- ============================================================
create table public.watchlists (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index watchlists_user_idx on public.watchlists (user_id);

create table public.watchlist_items (
  id            uuid primary key default uuid_generate_v4(),
  watchlist_id  uuid not null references public.watchlists(id) on delete cascade,
  symbol        text not null,
  notes         text,
  alert_above   numeric(18, 8),
  alert_below   numeric(18, 8),
  position_size numeric(18, 8),
  created_at    timestamptz not null default now()
);

create index watchlist_items_list_idx on public.watchlist_items (watchlist_id);
create unique index watchlist_items_symbol_uniq on public.watchlist_items (watchlist_id, symbol);

-- ============================================================
-- TRADE JOURNAL
-- ============================================================
create table public.journal_entries (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  trade_id      text,  -- external reference

  -- Trade details
  symbol        text not null,
  direction     signal_direction not null,
  entry_price   numeric(18, 8) not null,
  exit_price    numeric(18, 8),
  quantity      numeric(18, 8),
  entry_time    timestamptz not null,
  exit_time     timestamptz,
  status        trade_status not null default 'open',
  pnl_percent   numeric(10, 4),
  pnl_abs       numeric(18, 8),
  fees          numeric(18, 8) default 0,

  -- Tags & notes
  tags          text[],
  mood          journal_mood,
  lesson        text,
  screenshot_url text,

  -- Strategy
  strategy_id   uuid,
  signal_id     uuid references public.signals(id) on delete set null,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index journal_user_idx on public.journal_entries (user_id);
create index journal_symbol_idx on public.journal_entries (symbol);
create index journal_status_idx on public.journal_entries (status);
create index journal_mood_idx on public.journal_entries (mood);

-- ============================================================
-- STRATEGY RULES
-- ============================================================
create table public.strategies (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  rules        jsonb not null default '[]',  -- Array of rule objects
  timeframe    text not null default '1h',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index strategies_user_idx on public.strategies (user_id);

-- ============================================================
-- BACKTESTS
-- ============================================================
create table public.backtests (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  strategy_id    uuid references public.strategies(id) on delete set null,
  name           text not null,
  params         jsonb not null default '{}',
  status         backtest_status not null default 'pending',

  -- Results
  start_date     timestamptz,
  end_date       timestamptz,
  total_trades   integer,
  win_rate       numeric(5, 2),
  profit_factor  numeric(10, 4),
  max_drawdown   numeric(5, 2),
  sharpe_ratio   numeric(8, 4),
  avg_trade      numeric(10, 4),
  total_pnl      numeric(18, 8),

  equity_curve   jsonb,  -- array of {time, equity} points
  trade_log      jsonb, -- array of trade results

  error_message  text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index backtests_user_idx on public.backtests (user_id);
create index backtests_status_idx on public.backtests (status);

-- ============================================================
-- API KEYS (user-managed)
-- ============================================================
create table public.api_keys (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  label         text not null,
  key_hash      text not null,  -- sha256 of actual key
  permissions   text[] not null default '{}',
  last_used_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index api_keys_user_idx on public.api_keys (user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.profiles enable row level security;
alter table public.signals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.journal_entries enable row level security;
alter table public.strategies enable row level security;
alter table public.backtests enable row level security;
alter table public.api_keys enable row level security;

-- Profiles: users can read all, update only own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Signals: users see only their own
create policy "Users manage own signals"
  on public.signals for all using (auth.uid() = user_id);

-- Subscriptions: users only see own
create policy "Users manage own subscriptions"
  on public.subscriptions for all using (auth.uid() = user_id);

-- Watchlists: users only see own
create policy "Users manage own watchlists"
  on public.watchlists for all using (auth.uid() = user_id);

create policy "Users manage own watchlist items"
  on public.watchlist_items for all
  using (watchlist_id in (select id from public.watchlists where user_id = auth.uid()));

-- Journal: users only see own
create policy "Users manage own journal entries"
  on public.journal_entries for all using (auth.uid() = user_id);

-- Strategies: users only see own
create policy "Users manage own strategies"
  on public.strategies for all using (auth.uid() = user_id);

-- Backtests: users only see own
create policy "Users manage own backtests"
  on public.backtests for all using (auth.uid() = user_id);

-- API Keys: users only see own
create policy "Users manage own api keys"
  on public.api_keys for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, wallet_address)
  values (new.id, new.raw_user_meta_data->>'wallet_address');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger watchlists_updated_at before update on public.watchlists for each row execute procedure public.set_updated_at();
create trigger journal_updated_at before update on public.journal_entries for each row execute procedure public.set_updated_at();
create trigger strategies_updated_at before update on public.strategies for each row execute procedure public.set_updated_at();

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Active signals with full scoring breakdown
create view public.active_signals_vw as
select
  s.*,
  p.display_name as trader_name,
  p.subscription as trader_tier
from public.signals s
join public.profiles p on p.id = s.user_id
where s.status = 'active' and s.expires_at > now();

-- Journal performance stats
create view public.journal_stats_vw as
select
  user_id,
  count(*) as total_trades,
  count(case when status = 'closed' then 1 end) as closed_trades,
  round(avg(case when status = 'closed' then pnl_percent end)::numeric, 2) as avg_pnl,
  round(
    (count(case when status = 'closed' and pnl_percent > 0 then 1 end)::numeric /
     nullif(count(case when status = 'closed' then 1 end), 0) * 100
    )::numeric, 2
  ) as win_rate,
  sum(case when status = 'closed' then pnl_abs else 0 end) as total_pnl,
  avg(case when mood is not null then 1 end) as entries_with_mood
from public.journal_entries
group by user_id;