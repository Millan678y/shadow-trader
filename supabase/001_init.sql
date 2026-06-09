-- =============================================================================
-- SHADOW TRADER — Phase 1 Database Schema
-- Supabase-compatible PostgreSQL
-- =============================================================================

-- =========== AUTH / IDENTITY ===========

create table users (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  text unique,
  email           text unique,
  telegram_id     text unique,
  discord_id      text unique,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz,
  deleted_at      timestamptz
);

create table user_identities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  provider        text not null,
  provider_id     text not null,
  is_primary      boolean default false,
  linked_at       timestamptz default now(),
  unique(provider, provider_id)
);

-- =========== SUBSCRIPTIONS ===========

create type plan_tier as enum ('free','trial','monthly','yearly','lifetime');

create table subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  plan            plan_tier not null,
  status          text not null default 'active',
  payment_method  text,
  tx_signature    text,
  amount          numeric,
  started_at      timestamptz not null default now(),
  expires_at      timestamptz,
  created_at      timestamptz default now()
);

create index idx_subs_user_active on subscriptions(user_id, expires_at desc);

-- =========== SIGNALS ===========

create table signals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  symbol          text not null,
  interval        text not null,
  direction       text not null,
  entry           numeric,
  stop_loss       numeric,
  take_profit     numeric,
  r_multiple      numeric,
  position_size_usd numeric,
  risk_budget_pct numeric,
  atr_stop_mult   numeric,
  rationale       jsonb,
  model_name      text,
  model_seed      integer,
  prompt_hash     text,
  raw_response    jsonb,
  status          text not null default 'pending',
  closed_at       timestamptz,
  realized_pnl_pct numeric,
  created_at      timestamptz default now()
);

create index idx_signals_user_created on signals(user_id, created_at desc);
create index idx_signals_status on signals(status);

-- =========== NEWS CACHE ===========

create table news_summaries (
  id              uuid primary key default gen_random_uuid(),
  symbol          text not null,
  bucket_hour     timestamptz not null,
  summary         text not null,
  sentiment       text not null,
  sentiment_score numeric,
  sources         jsonb,
  model_name      text,
  created_at      timestamptz default now(),
  unique (symbol, bucket_hour)
);

-- =========== WATCHLISTS ===========

create table watchlists (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  name            text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz default now()
);

create table watchlist_items (
  id              uuid primary key default gen_random_uuid(),
  watchlist_id    uuid not null references watchlists(id) on delete cascade,
  symbol          text not null,
  sort_order      integer not null default 0,
  added_at        timestamptz default now(),
  unique (watchlist_id, symbol)
);

-- =========== JOURNAL ===========

create table journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  signal_id       uuid references signals(id),
  notes           text,
  tags            text[],
  screenshot_url  text,
  ai_review       jsonb,
  created_at      timestamptz default now()
);

-- =========== ALERTS ===========

create table alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  symbol          text not null,
  rule_type       text not null,
  rule_value      numeric,
  delivery        text[] not null,
  is_active       boolean default true,
  last_fired_at   timestamptz,
  created_at      timestamptz default now()
);

-- =========== TRIAL TOKENS ===========

create table trial_grants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique not null references users(id) on delete cascade,
  granted_at      timestamptz default now(),
  expires_at      timestamptz not null,
  signals_used    integer default 0,
  signals_quota   integer default 3
);

-- =========== AFFILIATE / REFERRAL ===========

create table referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references users(id),
  referred_user_id  uuid not null references users(id) unique,
  bonus_paid        boolean default false,
  created_at        timestamptz default now()
);

-- =========== ROW LEVEL SECURITY ===========

alter table signals enable row level security;

create policy "users read own signals"
  on signals for select
  using (auth.uid()::text = user_id::text);

create policy "users write own signals"
  on signals for insert
  with check (auth.uid()::text = user_id::text);
