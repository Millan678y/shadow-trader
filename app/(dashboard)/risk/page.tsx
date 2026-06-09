'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface RiskAlert { id: string; severity: 'critical' | 'warning' | 'info'; message: string; timestamp: string; read: boolean }
interface DailyRisk { date: string; pnl: number; drawdown: number; trades: number }

const RISK_ALERTS_RAW: RiskAlert[] = [
  { id: '1', severity: 'critical', message: '⚠️ Daily loss limit breached: -$1,240 (12.4%) — trading halted for 24h', timestamp: new Date(Date.now() - 300000).toISOString(), read: false },
  { id: '2', severity: 'warning', message: '⚡ Single position at 18% portfolio — exceeds 15% limit', timestamp: new Date(Date.now() - 900000).toISOString(), read: false },
  { id: '3', severity: 'warning', message: '📊 VaR(95%) exceeded: Estimated loss $1,820 under adverse conditions', timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: '4', severity: 'info', message: 'ℹ️ Position sizing recalculated: Risk per trade reduced to 1.5%', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
  { id: '5', severity: 'warning', message: '📉 3 consecutive losses — consider cooling off', timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
]

const RISK_RULES = [
  { label: 'Max Daily Loss', value: '$1,000 (10%)', current: '$1,240', status: 'critical' as const, pct: 124 },
  { label: 'Risk Per Trade', value: '$200 (2%)', current: '$180', status: 'ok' as const, pct: 90 },
  { label: 'Max Portfolio Risk', value: '$3,000 (30%)', current: '$1,820', status: 'ok' as const, pct: 61 },
  { label: 'Max Drawdown', value: '15%', current: '8.2%', status: 'ok' as const, pct: 55 },
  { label: 'Max Positions', value: '5 open', current: '3 open', status: 'ok' as const, pct: 60 },
  { label: 'Position Concentration', value: '<15%', current: '18%', status: 'warning' as const, pct: 100 },
]

const DAILY_HISTORY: DailyRisk[] = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
  pnl: (Math.random() - 0.45) * 500,
  drawdown: Math.random() * 8,
  trades: Math.floor(2 + Math.random() * 5),
}))

const STATUS_COLORS = { critical: 'var(--accent-red)', warning: 'var(--accent-yellow)', ok: 'var(--accent-green)', info: 'var(--accent-blue)' }

function RiskBar({ label, value, current, status, pct }: { label: string; value: string; current: string; status: 'critical' | 'warning' | 'ok'; pct: number }) {
  const capped = Math.min(pct, 100)
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>{current} / {value}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${capped}%`,
          background: STATUS_COLORS[status],
          borderRadius: '3px',
          transition: 'width .4s ease'
        }} />
      </div>
    </div>
  )
}

function DailyPnlChart({ data }: { data: DailyRisk[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { t: 10, r: 10, b: 28, l: 10 }
    const pnls = data.map(d => d.pnl)
    const max = Math.max(...pnls, 0), min = Math.min(...pnls, 0), range = max - min || 1
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b, barW = cw / data.length * 0.6

    ctx.clearRect(0, 0, W, H)
    // Zero line
    const zeroY = pad.t + ch * (1 - (0 - min) / range)
    ctx.strokeStyle = '#333345'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(W - pad.r, zeroY); ctx.stroke()
    ctx.fillStyle = '#444455'; ctx.font = '9px JetBrains Mono,monospace'
    ctx.textAlign = 'left'; ctx.fillText('$0', pad.l, zeroY - 2)

    // Bars
    data.forEach((d, i) => {
      const x = pad.l + (i / data.length) * cw + (cw / data.length - barW) / 2
      const barH = ch * Math.abs(d.pnl) / range
      const barY = d.pnl >= 0 ? zeroY - barH : zeroY
      ctx.fillStyle = d.pnl >= 0 ? '#00e67666' : '#ff174466'
      ctx.fillRect(x, barY, barW, barH)
      ctx.fillStyle = '#55556a'; ctx.font = '8px JetBrains Mono,monospace'; ctx.textAlign = 'center'
      ctx.fillText(d.date, x + barW / 2, H - pad.b + 12)
    })
  }, [data])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const obs = new ResizeObserver(draw)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [draw])
  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '160px' }} />
}

export default function RiskPage() {
  const [alerts, setAlerts] = useState(RISK_ALERTS_RAW)
  const [mode, setMode] = useState<'normal' | 'cooling'>('normal')
  const [posSizePct, setPosSizePct] = useState(2)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [coolingEnds, setCoolingEnds] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ posSize: '2', dailyLimit: '10', maxDD: '15', maxPos: '5', varConf: '95' })

  const unread = alerts.filter(a => !a.read).length

  const markRead = (id: string) => setAlerts(als => als.map(a => a.id === id ? { ...a, read: true } : a))
  const clearAll = () => setAlerts(als => als.map(a => ({ ...a, read: true })))

  const startCooling = () => {
    setMode('cooling')
    const end = new Date(Date.now() + 24 * 3600 * 1000)
    setCoolingEnds(end)
    setTimeout(() => setMode('normal'), 24 * 3600 * 1000)
  }

  const saveSettings = () => {
    setPosSizePct(parseFloat(form.posSize))
    setDailyLimit(parseFloat(form.dailyLimit))
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,23,68,.1)', border: '1px solid var(--accent-red)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-red)' }}>
              🔴 RISK MODE: {mode === 'cooling' ? 'COOLING OFF (24h)' : 'NORMAL'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {mode === 'normal' && alerts.some(a => a.severity === 'critical') && (
            <button onClick={startCooling} className="btn btn-red" style={{ fontSize: '11px' }}>⏸ Force Cooling Off (24h)</button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn btn-ghost" style={{ fontSize: '11px' }}>
            {showForm ? 'Close' : '⚙️ Configure'}
          </button>
        </div>

        {/* Risk config form */}
        {showForm && (
          <div className="panel">
            <div className="panel-header">⚙️ Risk Rules Configuration</div>
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Risk Per Trade (%)', key: 'posSize' },
                { label: 'Daily Loss Limit (%)', key: 'dailyLimit' },
                { label: 'Max Drawdown (%)', key: 'maxDD' },
                { label: 'Max Open Positions', key: 'maxPos' },
                { label: 'VaR Confidence (%)', key: 'varConf' },
              ].map(f => (
                <div key={f.key}>
                  <label>{f.label}</label>
                  <input type="number" value={(form as any)[f.key]} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ padding: '0 12px 12px' }}>
              <button onClick={saveSettings} className="btn btn-primary">Save Rules</button>
            </div>
          </div>
        )}

        {/* Current Risk Status */}
        <div className="panel">
          <div className="panel-header">📐 Active Risk Rules</div>
          <div style={{ padding: '12px' }}>
            {RISK_RULES.map(r => (
              <RiskBar key={r.label} label={r.label} value={r.value} current={r.current} status={r.status} pct={r.pct} />
            ))}
          </div>
        </div>

        {/* 14D P&L */}
        <div className="panel">
          <div className="panel-header">📈 14-Day P&L</div>
          <div style={{ padding: '8px' }}>
            <DailyPnlChart data={DAILY_HISTORY} />
          </div>
        </div>

        {/* Position Sizing Calculator */}
        <div className="panel">
          <div className="panel-header">🧮 Position Size Calculator</div>
          <div style={{ padding: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Account Size</label>
              <input type="number" value="10000" readOnly style={{ width: '130px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Risk %</label>
              <input type="number" value={posSizePct} onChange={e => setPosSizePct(parseFloat(e.target.value))} style={{ width: '80px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Entry Price</label>
              <input type="number" placeholder="63100" style={{ width: '120px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Stop Loss</label>
              <input type="number" placeholder="62500" style={{ width: '120px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Position Size</label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '16px', textAlign: 'center', width: '120px' }}>
                {(10000 * posSizePct / 100).toFixed(0)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>Max Loss</label>
              <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,.1)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)', fontSize: '16px', textAlign: 'center', width: '120px' }}>
                ${(10000 * posSizePct / 100).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* VaR / Monte Carlo Risk */}
        <div className="panel">
          <div className="panel-header">📉 VaR & Monte Carlo Risk Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-dim)' }}>
            {[
              { label: 'VaR 95%', value: '-$320', note: '1-day 95% confidence' },
              { label: 'VaR 99%', value: '-$580', note: '1-day 99% confidence' },
              { label: 'CVaR (ES)', value: '-$840', note: 'Expected Shortfall' },
              { label: 'Prob. of Ruin', value: '3.2%', note: 'Account < 50% initial' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-elevated)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-bright)' }}>{m.value}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts sidebar */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        <div className="panel">
          <div className="panel-header">
            🚨 Alerts {unread > 0 && <span style={{ marginLeft: '6px', background: 'var(--accent-red)', borderRadius: '999px', padding: '1px 7px', fontSize: '10px', color: '#fff' }}>{unread}</span>}
            <button onClick={clearAll} style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-dim)', cursor: 'pointer' }}>Clear all</button>
          </div>
          <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {alerts.map(a => (
              <div key={a.id} onClick={() => markRead(a.id)} style={{
                padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', lineHeight: 1.5,
                background: a.read ? 'var(--bg-elevated)' : `${STATUS_COLORS[a.severity]}18`,
                border: `1px solid ${STATUS_COLORS[a.severity]}44`,
                opacity: a.read ? 0.7 : 1,
              }}>
                <div style={{ marginBottom: '4px', color: STATUS_COLORS[a.severity], fontWeight: 600 }}>{a.severity.toUpperCase()}</div>
                <div>{a.message}</div>
                <div style={{ marginTop: '4px', color: 'var(--text-dim)', fontSize: '10px' }}>
                  {new Date(a.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade limits summary */}
        <div className="panel">
          <div className="panel-header">📊 Session Stats</div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Trades Today', value: '4/5' },
              { label: 'Win/Loss Today', value: '2W / 2L' },
              { label: 'Best Trade', value: '+$125' },
              { label: 'Worst Trade', value: '-$89' },
              { label: 'Daily P&L', value: '+$142', color: 'var(--accent-green)' },
              { label: 'Trades This Week', value: '18' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-dim)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: r.color || 'var(--text-bright)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div className="panel" style={{ border: '1px solid var(--accent-red)44' }}>
          <div className="panel-header" style={{ color: 'var(--accent-red)' }}>🛑 Emergency Actions</div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button className="btn btn-red" style={{ width: '100%', fontSize: '11px' }}>🛑 Close ALL Positions</button>
            <button className="btn btn-red" style={{ width: '100%', fontSize: '11px' }}>⏸ Trigger 24h Cooling Off</button>
            <button className="btn btn-ghost" style={{ width: '100%', fontSize: '11px', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>📧 Alert Manager</button>
          </div>
        </div>
      </div>
    </div>
  )
}