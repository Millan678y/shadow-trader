'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────
interface Candle { t: number; o: number; h: number; l: number; c: number; v: number }
interface State {
  btc_price: number; btc_change_24h: number; equity: { equity: number; balance: number; daily_pnl: number; open_positions: number };
  macro: { dxy: number; spx: number; vix: number; regime: string; directive: string; dxy_change: number; spx_change: number };
  killzones: { london: { active: boolean; score: number }; ny: { active: boolean; score: number }; asia: { active: boolean; score: number } };
  orderflow: { delta_1m: number; delta_5m: number; bid_vol: number; ask_vol: number; sweep: string; absorption: boolean };
  candles: Candle[]; positions: Record<string, any>; trades: any[]; mode: string; halted: boolean;
}

// ── Utility ───────────────────────────────────────────────
function fmt(n: number, decimals = 0) { return n.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) }
function pct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%' }
function cn(n: number) { return n >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }

// ── Canvas Candlestick Chart ───────────────────────────────
function CanvasChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas || candles.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const pad = { top: 10, right: 60, bottom: 28, left: 10 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom
    const n = Math.min(candles.length, 60)
    const slice = candles.slice(-n)
    const cw = chartW / n

    const max = Math.max(...slice.map(c => c.h))
    const min = Math.min(...slice.map(c => c.l))
    const range = max - min || 1

    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#1a1b25'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * i) / 4
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(W - pad.right, y)
      ctx.stroke()
      const price = max - (range * i) / 4
      ctx.fillStyle = '#55556a'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(fmt(price), W - pad.right + 4, y + 3)
    }

    // Candles
    slice.forEach((c, i) => {
      const x = pad.left + i * cw + cw / 2
      const open = pad.top + chartH * (1 - (c.o - min) / range)
      const close = pad.top + chartH * (1 - (c.c - min) / range)
      const high = pad.top + chartH * (1 - (c.h - min) / range)
      const low = pad.top + chartH * (1 - (c.l - min) / range)
      const bull = c.c >= c.o
      const color = bull ? '#00e676' : '#ff1744'

      ctx.strokeStyle = color + '55'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, high)
      ctx.lineTo(x, low)
      ctx.stroke()

      const bodyTop = Math.min(open, close)
      const bodyH = Math.max(1, Math.abs(close - open))
      ctx.fillStyle = color
      ctx.fillRect(x - cw * 0.35, bodyTop, cw * 0.7, bodyH)
    })

    // Current price line
    if (slice.length > 0) {
      const last = slice[slice.length - 1]
      const lastY = pad.top + chartH * (1 - (last.c - min) / range)
      ctx.strokeStyle = '#00e67655'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(pad.left, lastY)
      ctx.lineTo(W - pad.right, lastY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#00e676'
      ctx.font = 'bold 10px JetBrains Mono, monospace'
      ctx.textAlign = 'left'
      ctx.fillText('$' + fmt(last.c), W - pad.right + 4, lastY + 3)

      // Change %
      const pct_change = ((last.c - slice[0].o) / slice[0].o) * 100
      ctx.fillStyle = pct_change >= 0 ? '#00e676' : '#ff1744'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText((pct_change >= 0 ? '+' : '') + pct_change.toFixed(2) + '%', W - pad.right, H - 10)
    }
  }, [candles])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const obs = new ResizeObserver(draw)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [draw])

  return (
    <canvas
      ref={ref}
      style={{
        display: 'block',
        width: '100%',
        flex: 1,
        background: 'var(--bg-primary)',
        cursor: 'crosshair',
        minHeight: '200px',
      }}
    />
  )
}

// ── Panel ────────────────────────────────────────────────
function Panel({ title, live, children, style }: { title: string; live?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div className="panel-header">
        {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-green 2s infinite' }} />}
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Metric ───────────────────────────────────────────────
function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4px' }}>
      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: color || 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '1px' }}>{sub}</div>}
    </div>
  )
}

// ── Killzone ─────────────────────────────────────────────
function Killzone({ name, active, score, utc }: { name: string; active: boolean; score: number; utc: string }) {
  const colors = { london: '🇬🇧', ny: '🇺🇸', asia: '🇯🇵' }
  const em = colors[name.toLowerCase() as keyof typeof colors] || '🌐'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--border-dim)',
    }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>{em} {name}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{utc}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: score >= 0.7 ? 'var(--accent-green)' : score >= 0.4 ? 'var(--accent-yellow)' : 'var(--text-dim)',
        }}>
          {score.toFixed(2)}
        </div>
        <div style={{ fontSize: '9px', color: active ? 'var(--accent-green)' : 'var(--text-dim)' }}>
          {active ? '● ACTIVE' : '○ INACTIVE'}
        </div>
      </div>
    </div>
  )
}

// ── Order Flow ───────────────────────────────────────────
function OFRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: positive === undefined ? 'var(--text-secondary)' : positive ? 'var(--accent-green)' : positive === false ? 'var(--accent-red)' : 'var(--text-secondary)',
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Trade Row ────────────────────────────────────────────
function TradeRow({ t }: { t: any }) {
  const pnl = t.pnl || 0
  const win = pnl > 0
  const be = pnl === 0
  const cls = win ? 'badge-green' : be ? 'badge-blue' : 'badge-red'
  const lbl = win ? 'WIN' : be ? 'BE' : 'LOSS'
  const time = t.exit_time ? new Date(t.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 0',
      borderBottom: '1px solid var(--border-dim)',
      fontSize: '11px',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }} className={`badge ${cls}`}>
        {lbl}
      </span>
      <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{t.symbol || 'BTC'}</span>
      <span style={{ color: 'var(--text-dim)' }}>{t.side || 'LONG'}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
      </span>
      <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{time}</span>
    </div>
  )
}

// ── Main Dashboard Page ──────────────────────────────────
export default function DashboardPage() {
  const [state, setState] = useState<State | null>(null)

  const poll = useCallback(async () => {
    try {
      const r = await fetch('http://127.0.0.1:5000/api/state')
      if (!r.ok) return
      const d: State = await r.json()
      setState(d)
    } catch {}
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [poll])

  const eq = state?.equity
  const m = state?.macro

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      gridTemplateRows: 'auto 1fr',
      gap: '8px',
      height: 'calc(100vh - var(--topbar-height) - 24px)',
    }}>
      {/* ── Chart ────────────────────── */}
      <div style={{ gridColumn: '1', gridRow: '1/3', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
        {/* Chart Panel */}
        <Panel title="BTC/USDT — 1 Min" live>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
            {state?.candles && state.candles.length > 0
              ? <CanvasChart candles={state.candles} />
              : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  Loading chart data...
                </div>
              )
            }
          </div>
          {/* Chart controls */}
          <div style={{ display: 'flex', gap: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-dim)' }}>
            {['1M', '5M', '15M'].map(tf => (
              <button key={tf} className="btn btn-ghost" style={{ fontSize: '10px', padding: '3px 10px' }}>{tf}</button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', alignSelf: 'center' }}>
              HTF: <span style={{ color: 'var(--accent-blue)' }}>{m?.directive || 'NEUTRAL'}</span>
            </span>
          </div>
        </Panel>

        {/* Bottom Row: Positions + Trade Log */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: '0 0 auto' }}>
          {/* Open Positions */}
          <div className="panel">
            <div className="panel-header">
              <span>📋 Positions</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>
                {eq?.open_positions || 0} open
              </span>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {(eq?.open_positions || 0) > 0
                ? <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No open positions</div>
                : <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No open positions</div>
              }
            </div>
          </div>

          {/* Trade Log */}
          <div className="panel">
            <div className="panel-header">
              <span>📜 Trade Log</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>
                {eq?.daily_pnl && eq.daily_pnl >= 0 ? '+' : ''}{eq?.daily_pnl?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{ padding: '4px 12px', maxHeight: '120px', overflow: 'auto' }}>
              {state?.trades?.slice(-10).reverse().map((t, i) => (
                <TradeRow key={i} t={t} />
              )) || (
                <>
                  {[
                    { symbol: 'BTC', side: 'LONG', pnl: 142.50, exit_time: new Date(Date.now() - 3600000) },
                    { symbol: 'ETH', side: 'SHORT', pnl: -38.20, exit_time: new Date(Date.now() - 7200000) },
                    { symbol: 'BTC', side: 'LONG', pnl: 0, exit_time: new Date(Date.now() - 10800000) },
                  ].map((t, i) => <TradeRow key={i} t={t} />)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ──────────────── */}
      <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Account */}
        <div className="panel">
          <div className="panel-header">💼 Account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-dim)' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '3px' }}>Balance</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                ${eq?.balance?.toFixed(2) || '1,000.00'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '3px' }}>Equity</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)' }}>
                ${eq?.equity?.toFixed(2) || '1,000.00'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '3px' }}>Daily PnL</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: cn(eq?.daily_pnl || 0) }}>
                {(eq?.daily_pnl || 0) >= 0 ? '+' : ''}{(eq?.daily_pnl || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '3px' }}>Mode</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                color: state?.mode === 'LIVE' ? 'var(--accent-green)' : 'var(--text-dim)',
              }}>
                {state?.mode || 'DRY-RUN'}
              </div>
            </div>
          </div>
        </div>

        {/* Macro */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            🌐 Macro Context
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1px', background: 'var(--border-dim)' }}>
            <Metric label="DXY" value={m?.dxy?.toFixed(2) || '--'} sub={m?.dxy_change ? pct(m.dxy_change) : ''} />
            <Metric label="SPX" value={m?.spx?.toFixed(0) || '--'} sub={m?.spx_change ? pct(m.spx_change) : ''} />
            <Metric label="VIX" value={m?.vix?.toFixed(1) || '--'} color={m?.vix && m.vix > 22 ? 'var(--accent-red)' : 'var(--text-bright)'} />
            <Metric label="Regime" value={m?.regime || '---'} color="var(--accent-blue)" />
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid var(--border-dim)', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Directive: </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: m?.directive === 'RISK_ON' ? 'var(--accent-green)'
                : m?.directive === 'RISK_OFF' || m?.directive === 'NO_TRADE' ? 'var(--accent-red)'
                : m?.directive === 'FULL_LONG_BIAS' ? 'var(--accent-green)'
                : m?.directive === 'FULL_SHORT_BIAS' ? 'var(--accent-red)'
                : 'var(--accent-blue)',
            }}>
              {m?.directive || 'NEUTRAL'}
            </span>
          </div>
        </div>

        {/* Killzones */}
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-header">⚡ Killzones</div>
          <div style={{ padding: '4px 12px' }}>
            <Killzone name="London" utc="07:00–10:00 UTC" active={state?.killzones?.london?.active || false} score={state?.killzones?.london?.score || 0} />
            <Killzone name="New York" utc="13:00–16:00 UTC" active={state?.killzones?.ny?.active || false} score={state?.killzones?.ny?.score || 0} />
            <Killzone name="Asia Scalp" utc="00:00–04:00 UTC" active={state?.killzones?.asia?.active || false} score={state?.killzones?.asia?.score || 0} />
          </div>
        </div>

        {/* Order Flow */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            📊 Order Flow
          </div>
          <div style={{ padding: '4px 0' }}>
            <OFRow label="Delta 1m" value={(state?.orderflow?.delta_1m || 0) >= 0 ? '+' + (state?.orderflow?.delta_1m || 0).toFixed(0) : (state?.orderflow?.delta_1m || 0).toFixed(0)} positive={(state?.orderflow?.delta_1m || 0) > 0 ? true : (state?.orderflow?.delta_1m || 0) < 0 ? false : undefined} />
            <OFRow label="Delta 5m" value={(state?.orderflow?.delta_5m || 0) >= 0 ? '+' + (state?.orderflow?.delta_5m || 0).toFixed(0) : (state?.orderflow?.delta_5m || 0).toFixed(0)} positive={(state?.orderflow?.delta_5m || 0) > 0 ? true : (state?.orderflow?.delta_5m || 0) < 0 ? false : undefined} />
            <OFRow label="Bid Vol" value={(state?.orderflow?.bid_vol || 0).toFixed(2)} />
            <OFRow label="Ask Vol" value={(state?.orderflow?.ask_vol || 0).toFixed(2)} />
            <OFRow label="Sweep" value={state?.orderflow?.sweep || 'None'} positive={state?.orderflow?.sweep === 'BULLISH' ? true : state?.orderflow?.sweep === 'BEARISH' ? false : undefined} />
            <OFRow label="Absorption" value={state?.orderflow?.absorption ? 'YES' : 'No'} positive={state?.orderflow?.absorption ? false : undefined} />
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
        }
      `}</style>
    </div>
  )
}