-- =========== TRIAL TOKENS ===========

create table trial_grants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique not null references users(id) on delete cascade,
  granted_at      timestamptz default now(),
  expires_at      timestamptz not null,
  signals_used    integer default 0,
  signals_quota   integer default 3
);
