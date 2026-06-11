'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

// ── Types ───────────────────────────────────────────────
interface NavItem {
  label: string
  icon: string
  href: string
  badge?: string
}

// ── Icons (inline SVG) ───────────────────────────────────
const icons: Record<string, string> = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  market:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  terminal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8l4 4-4 4M12 16h6"/></svg>`,
  strategy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 7l3 10M17 7l-3 10M5 7h14"/></svg>`,
  backtest: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-6 6"/></svg>`,
  portfolio:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 3"/></svg>`,
  journal:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  risk:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  research: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
}

// ── Nav Items ───────────────────────────────────────────
const navItems: NavItem[] = [
  { label: 'Dashboard',  icon: 'dashboard',  href: '/dashboard' },
  { label: 'Market',     icon: 'market',     href: '/dashboard/market' },
  { label: 'Terminal',   icon: 'terminal',   href: '/dashboard/terminal' },
  { label: 'Strategies', icon: 'strategy',   href: '/dashboard/strategies' },
  { label: 'Backtest',   icon: 'backtest',   href: '/dashboard/backtest' },
  { label: 'Portfolio',  icon: 'portfolio',  href: '/dashboard/portfolio' },
  { label: 'Journal',    icon: 'journal',    href: '/dashboard/journal' },
  { label: 'Risk',       icon: 'risk',       href: '/dashboard/risk' },
  { label: 'Research',   icon: 'research',   href: '/dashboard/research' },
]

// ── Live Price Fetcher ──────────────────────────────────
async function fetchMarketData() {
  try {
    const r = await fetch('/api/market')
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

// ── Layout Component ────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [btcPrice, setBtcPrice] = useState('--')
  const [btcChange, setBtcChange] = useState(0)
  const [equity, setEquity] = useState('$1,000')
  const [time, setTime] = useState('')
  const [mode, setMode] = useState<'DRY-RUN' | 'LIVE'>('DRY-RUN')

  // Live time
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toUTCString().slice(17, 25) + ' UTC')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Live BTC price from Binance public API (no key needed)
  useEffect(() => {
    let mounted = true
    const fetchBtc = async () => {
      try {
        const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
        if (!r.ok) return
        const d = await r.json()
        if (!mounted) return
        if (d.lastPrice) setBtcPrice('$' + Number(d.lastPrice).toLocaleString('en', { maximumFractionDigits: 0 }))
        if (d.priceChangePercent) setBtcChange(Number(d.priceChangePercent))
      } catch {}
    }
    fetchBtc()
    const id = setInterval(fetchBtc, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  // Equity state (demo)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-dim)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        transition: 'width .2s ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px 12px',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: 'var(--topbar-height)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-green), #00bfa5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}>
            📊
          </div>
          {expanded && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: 'var(--accent-green)', letterSpacing: '1px' }}>
                SHADOW
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
                TRADER
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  margin: '2px 6px',
                  borderRadius: '8px',
                  color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
                  background: active ? 'rgba(0,230,118,.08)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 500,
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: icons[item.icon] || '' }} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                {expanded && item.label}
              </a>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-dim)' }}>
          <a
            href="/dashboard/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              margin: '2px 6px',
              borderRadius: '8px',
              color: 'var(--text-dim)',
              textDecoration: 'none',
              fontSize: '12px',
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: icons.settings }} style={{ flexShrink: 0 }} />
            {expanded && 'Settings'}
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: 'calc(100% - 12px)',
              margin: '4px 6px',
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              color: 'var(--text-dim)',
              fontSize: '10px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {expanded ? '◀ Collapse' : '▶ Expand'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────── */}
      <div style={{
        marginLeft: expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-width)',
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left .2s ease',
      }}>
        {/* ── Top Bar ─────────────────────────────── */}
        <header style={{
          height: 'var(--topbar-height)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {/* Time */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {time}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-dim)' }} />

          {/* BTC Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '.5px' }}>BTC</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
              {btcPrice}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: btcChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </span>
            <div className={btcPrice !== '--' ? 'live-dot' : ''} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-dim)' }} />

          {/* Equity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '.5px' }}>EQUITY</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)' }}>
              {equity}
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Mode Toggle */}
          <button
            onClick={() => setMode(m => m === 'DRY-RUN' ? 'LIVE' : 'DRY-RUN')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '.5px',
              border: `1px solid ${mode === 'LIVE' ? 'var(--accent-green)' : 'var(--border-default)'}`,
              color: mode === 'LIVE' ? 'var(--accent-green)' : 'var(--text-dim)',
              background: mode === 'LIVE' ? 'rgba(0,230,118,.08)' : 'transparent',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {mode === 'LIVE' ? '● LIVE' : '○ DRY-RUN'}
          </button>
        </header>

        {/* ── Page Content ───────────────────────── */}
        <main style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}