// Supabase client for Shadow Trader
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars

let supabase: any = null

try {
  const { createClient } = require('@supabase/supabase-js')
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
} catch (e) {
  // Supabase not configured — use demo mode
}

export const db = supabase

// ── Auth helpers ──────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  if (!db) return { user: null, error: 'Supabase not configured — demo mode' }
  return await db.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  if (!db) return { user: null, error: 'Supabase not configured — demo mode' }
  return await db.auth.signUp({ email, password })
}

export async function signOut() {
  if (!db) return
  return await db.auth.signOut()
}

export async function getUser() {
  if (!db) return null
  const { data } = await db.auth.getUser()
  return data?.user || null
}

// ── Portfolio helpers ─────────────────────────────────────────────
export async function getPortfolios(userId: string) {
  if (!db) return { data: getDemoPortfolios(), error: null }
  return await db.from('portfolios').select('*').eq('user_id', userId).order('created_at', { ascending: true })
}

export async function getPortfolioSummary(userId: string) {
  if (!db) return getDemoPortfolioSummary()
  // Fetch portfolio + aggregate trades
  const { data: portfolios } = await db.from('portfolios').select('*').eq('user_id', userId)
  if (!portfolios?.length) return getDemoPortfolioSummary()
  const p = portfolios[0]

  // Get closed trades
  const { data: trades } = await db.from('trades').select('*')
    .eq('portfolio_id', p.id).eq('status', 'CLOSED')

  const realized = trades?.reduce((s: number, t: any) => s + (t.pnl || 0), 0) || 0
  const equity = p.initial_balance + realized

  return {
    balance: p.initial_balance,
    equity,
    daily_pnl: realized,
    open_positions: 0,
    trades_today: trades?.length || 0,
  }
}

// ── Trade helpers ─────────────────────────────────────────────────
export async function getTrades(userId: string, limit = 50) {
  if (!db) return { data: getDemoTrades(), error: null }
  return await db.from('trades').select('*').eq('user_id', userId)
    .order('entry_time', { ascending: false }).limit(limit)
}

export async function saveTrade(trade: any) {
  if (!db) return { data: trade, error: null }
  return await db.from('trades').insert(trade)
}

// ── Strategy helpers ─────────────────────────────────────────────
export async function getStrategies(userId: string) {
  if (!db) return { data: getDemoStrategies(), error: null }
  return await db.from('strategies').select('*').eq('user_id', userId).order('created_at', { ascending: false })
}

export async function saveStrategy(strategy: any) {
  if (!db) return { data: strategy, error: null }
  return await db.from('strategies').insert(strategy)
}

export async function updateStrategy(id: string, updates: any) {
  if (!db) return { data: null, error: null }
  return await db.from('strategies').update(updates).eq('id', id)
}

// ── Journal helpers ───────────────────────────────────────────────
export async function getJournalEntries(userId: string, limit = 30) {
  if (!db) return { data: getDemoJournalEntries(), error: null }
  return await db.from('journal_entries').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(limit)
}

export async function saveJournalEntry(entry: any) {
  if (!db) return { data: entry, error: null }
  return await db.from('journal_entries').insert(entry)
}

// ── Backtest helpers ─────────────────────────────────────────────
export async function getBacktests(userId: string) {
  if (!db) return { data: [], error: null }
  return await db.from('backtests').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function saveBacktest(backtest: any) {
  if (!db) return { data: backtest, error: null }
  return await db.from('backtests').insert(backtest)
}

// ── Demo data (when Supabase not configured) ─────────────────────
function getDemoPortfolios() {
  return [
    {
      id: 'demo-1',
      name: 'Main Trading Account',
      initial_balance: 10000,
      currency: 'USD',
      created_at: new Date().toISOString(),
    }
  ]
}

function getDemoPortfolioSummary() {
  return {
    balance: 10000,
    equity: 10342.50,
    daily_pnl: 142.50,
    open_positions: 0,
    trades_today: 3,
  }
}

function getDemoTrades() {
  return [
    {
      id: 't1',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entry_price: 62450,
      exit_price: 63100,
      quantity: 0.05,
      pnl: 32.50,
      fees: 0.50,
      entry_time: new Date(Date.now() - 3600000).toISOString(),
      exit_time: new Date(Date.now() - 1800000).toISOString(),
      status: 'CLOSED',
      tags: ['scalp', 'killzone'],
      mood: 'disciplined',
    },
    {
      id: 't2',
      symbol: 'ETHUSDT',
      side: 'SHORT',
      entry_price: 3520,
      exit_price: 3480,
      quantity: 0.5,
      pnl: 20.00,
      fees: 0.40,
      entry_time: new Date(Date.now() - 7200000).toISOString(),
      exit_time: new Date(Date.now() - 5400000).toISOString(),
      status: 'CLOSED',
      tags: ['swing'],
      mood: 'neutral',
    },
    {
      id: 't3',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entry_price: 61800,
      exit_price: 62200,
      quantity: 0.1,
      pnl: 40.00,
      fees: 0.60,
      entry_time: new Date(Date.now() - 10800000).toISOString(),
      exit_time: new Date(Date.now() - 9000000).toISOString(),
      status: 'CLOSED',
      tags: ['setup'],
      mood: 'disciplined',
    },
    {
      id: 't4',
      symbol: 'SOLUSDT',
      side: 'LONG',
      entry_price: 145.00,
      exit_price: 143.50,
      quantity: 5,
      pnl: -7.50,
      fees: 0.30,
      entry_time: new Date(Date.now() - 14400000).toISOString(),
      exit_time: new Date(Date.now() - 12600000).toISOString(),
      status: 'CLOSED',
      tags: ['mistake'],
      mood: 'revenge',
    },
    {
      id: 't5',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entry_price: 61000,
      exit_price: 61500,
      quantity: 0.08,
      pnl: 40.00,
      fees: 0.50,
      entry_time: new Date(Date.now() - 18000000).toISOString(),
      exit_time: new Date(Date.now() - 16200000).toISOString(),
      status: 'CLOSED',
      tags: ['scalp'],
      mood: 'disciplined',
    },
  ]
}

function getDemoStrategies() {
  return [
    {
      id: 's1',
      name: 'SMC Killzone Long',
      description: 'Entry during London/NY killzone with order flow confirmation',
      rules: [
        { type: 'killzone', session: 'LONDON' },
        { type: 'orderflow', delta: 'positive' },
        { type: 'structure', bos: 'bullish' },
      ],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 's2',
      name: 'EMA Cross Reversal',
      description: 'RSI divergence at EMA crossover',
      rules: [
        { type: 'indicator', indicator: 'RSI', compare: '<', value: 30 },
        { type: 'indicator', indicator: 'EMA20', compare: '>', value: 'EMA50' },
      ],
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 's3',
      name: 'VIX Spike Short',
      description: 'Short during high VIX regime (>25)',
      rules: [
        { type: 'indicator', indicator: 'VIX', compare: '>', value: 25 },
        { type: 'regime', regime: 'RISK_OFF' },
      ],
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]
}

function getDemoJournalEntries() {
  return [
    {
      id: 'j1',
      title: 'Good London killzone scalp',
      content: 'Entered long on BTC at 62100 during London killzone. Order flow showed positive delta. Exited at 62800 for +$35. Stick to the plan next time.',
      tags: ['scalp', 'killzone', 'london'],
      mood: 'disciplined',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'j2',
      title: 'Revenge trade after SOL loss',
      content: 'Took a large SOL long immediately after a loss to "make it back". Ended up losing more. Need to enforce the 30-minute cooling-off rule.',
      tags: ['mistake', 'revenge'],
      mood: 'revenge',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'j3',
      title: 'Pattern: RSI < 30 + EMA50 support = high win rate',
      content: 'Reviewed last 20 trades using RSI < 30 at EMA50 support. 75% win rate on this setup. Need to add this to primary strategies.',
      tags: ['lesson', 'pattern', 'RSI'],
      mood: 'disciplined',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}

export default db