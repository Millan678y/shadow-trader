'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

function EquityChart({ data }: { data: { d: string; v: number }[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { t: 10, r: 60, b: 24, l: 10 }
    const vals = data.map(d => d.v)
    const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1
    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b)
    grad.addColorStop(0, 'rgba(41,121,255,0.3)'); grad.addColorStop(1, 'rgba(41,121,255,0)')

    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = '#1a1b25'; ctx.lineWidth = 1
    for (let i = 0; i <= 3; i++) {
      const y = pad.t + ((H - pad.t - pad.b) * i) / 3
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke()
      const val = max - (range * i) / 3
      ctx.fillStyle = '#55556a'; ctx.font = '9px JetBrains Mono,monospace'; ctx.textAlign = 'left'
      ctx.fillText('$' + val.toFixed(0), W - pad.r + 4, y + 3)
    }
    ctx.beginPath()
    data.forEach((d, i) => {
      const x = pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r)
      const y = pad.t + (H - pad.t - pad.b) * (1 - (d.v - min) / range)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#2979ff'; ctx.lineWidth = 2; ctx.stroke()

    const last = data[data.length - 1].v
    const ly = pad.t + (H - pad.t - pad.b) * (1 - (last - min) / range)
    ctx.strokeStyle = '#2979ff33'; ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(W - pad.r, ly); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#2979ff'; ctx.font = 'bold 10px JetBrains Mono,monospace'
    ctx.textAlign = 'left'; ctx.fillText('$' + last.toFixed(0), W - pad.r + 4, ly + 3)
  }, [data])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const obs = new ResizeObserver(draw)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [draw])
  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '280px' }} />
}

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  let start = 0
  const paths = slices.map(sl => {
    const pct = sl.value / total
    const angle = pct * 2 * Math.PI
    const x1 = 100 + 80 * Math.cos(start - Math.PI / 2)
    const y1 = 100 + 80 * Math.sin(start - Math.PI / 2)
    const x2 = 100 + 80 * Math.cos(start + angle - Math.PI / 2)
    const y2 = 100 + 80 * Math.sin(start + angle - Math.PI / 2)
    const large = angle > Math.PI ? 1 : 0
    start += angle
    return { ...sl, path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${large} 1 ${x2} ${y2} Z`, pct }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} stroke="var(--bg-primary)" strokeWidth="2" />
        ))}
        <circle cx="100" cy="100" r="45" fill="var(--bg-panel)" />
        <text x="100" y="96" textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-mono)">TOTAL</text>
        <text x="100" y="110" textAnchor="middle" fill="var(--text-bright)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">${(total).toFixed(0)}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: sl.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', width: '50px' }}>{sl.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-bright)' }}>{sl.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const HOLDINGS = [
  { symbol: 'BTC', side: 'LONG', qty: 0.05, entry: 58200, current: 63248, pnl: 252.40, pct: 40 },
  { symbol: 'ETH', side: 'LONG', qty: 0.8, entry: 3200, current: 3482, pnl: 225.60, pct: 25 },
  { symbol: 'SOL', side: 'SHORT', qty: 15, entry: 155.00, current: 148.50, pnl: 97.50, pct: 15 },
  { symbol: 'SPX', side: 'LONG', qty: 0.5, entry: 5100, current: 5278, pnl: 89.00, pct: 20 },
]
const HISTORY = Array.from({ length: 30 }, (_, i) => ({
  d: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
  v: 9700 + Math.sin(i * 0.3) * 300 + i * 15,
}))

export default function PortfolioPage() {
  const [equity] = useState(10450)
  const [dailyPnl] = useState(142.50)
  const totalReturn = ((equity - 10000) / 10000 * 100).toFixed(2)

  const metricCards = [
    { label: 'Total Equity', value: '$' + equity.toLocaleString(), color: 'var(--text-bright)' },
    { label: 'Daily P&L', value: (dailyPnl >= 0 ? '+' : '') + '$' + dailyPnl.toFixed(2), color: dailyPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
    { label: 'Total Return', value: (parseFloat(totalReturn) >= 0 ? '+' : '') + totalReturn + '%', color: parseFloat(totalReturn) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
    { label: 'Open Positions', value: '3', color: 'var(--accent-blue)' },
  ]
  const riskMetrics = [
    { label: 'Sharpe', value: '1.84' }, { label: 'Sortino', value: '2.12' },
    { label: 'VaR 95%', value: '-$320' }, { label: 'Max DD', value: '-8.2%' }, { label: 'Volatility', value: '14.3%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)', overflow: 'auto' }}>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {metricCards.map(m => (
          <div key={m.label} className="panel" style={{ padding: '0' }}>
            <div style={{ padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Equity + Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="panel">
          <div className="panel-header">📈 Equity Curve (30D)</div>
          <div style={{ padding: '8px' }}><EquityChart data={HISTORY} /></div>
        </div>
        <div className="panel">
          <div className="panel-header">🥧 Allocation</div>
          <div style={{ padding: '12px' }}>
            <PieChart slices={[
              { label: 'BTC', value: 40, color: '#f7931a' },
              { label: 'ETH', value: 25, color: '#627eea' },
              { label: 'SOL', value: 15, color: '#00ffa3' },
              { label: 'SPX', value: 20, color: '#2979ff' },
            ]} />
          </div>
        </div>
      </div>

      {/* Holdings + Risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Holdings */}
        <div className="panel">
          <div className="panel-header">💼 Holdings</div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                  {['Symbol', 'Side', 'Qty', 'Entry', 'Current', 'PnL', '%'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', fontSize: '9px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{h.symbol}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: h.side === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{h.side}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{h.qty}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>${h.entry.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-bright)' }}>${h.current.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{h.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="panel">
          <div className="panel-header">⚖️ Risk Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border-dim)' }}>
            {riskMetrics.map(r => (
              <div key={r.label} style={{ background: 'var(--bg-elevated)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>{r.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>{r.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-dim)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Win Rate Donut</div>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block', margin: '0 auto' }}>
              <circle cx="60" cy="60" r="45" fill="none" stroke="var(--bg-elevated)" strokeWidth="20" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="var(--accent-green)" strokeWidth="20"
                strokeDasharray={`${2 * Math.PI * 45 * 0.58} ${2 * Math.PI * 45}`} strokeDashoffset={Math.PI / 2 * -1 * 2 * Math.PI * 45} />
              <text x="60" y="57" textAnchor="middle" fill="var(--text-bright)" fontSize="18" fontWeight="700" fontFamily="var(--font-mono)">58%</text>
              <text x="60" y="72" textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-sans)">Win Rate</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}