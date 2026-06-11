'use client'
import { useState, useEffect } from 'react'

interface Signal {
  id: string
  symbol: string
  direction: 'long' | 'short' | 'neutral'
  totalScore: number
  entry: number
  stopLoss: number
  takeProfit: number
  riskPercent: number
  factors: Record<string, number>
  regime: string
  sentiment: string
  classification: string
  classificationColor: string
  action: string
  reasoning: string[]
  timestamp: number
}

interface Trade {
  id: string
  symbol: string
  direction: string
  entry: number
  exit: number
  pnl: number
  pnlPercent: number
  status: string
  time: string
}

const MOCK_SIGNALS: Signal[] = [
  {
    id: '1', symbol: 'SOL', direction: 'long', totalScore: 87, entry: 182.45, stopLoss: 175.20, takeProfit: 198.30, riskPercent: 1.5,
    factors: { marketRegime: 90, trend: 91, momentum: 84, orderflow: 89, risk: 78, news: 82, structure: 85 },
    regime: 'Strong Uptrend', sentiment: 'bullish', classification: 'HIGH CONVICTION', classificationColor: '#00e676', action: 'Normal size',
    reasoning: ['Strong uptrend: EMA 9/21/50 aligned bullishly', 'Whale accumulation detected: CVD positive', 'Breaking above $180 resistance'],
    timestamp: Date.now() - 3600000,
  },
  {
    id: '2', symbol: 'JTO', direction: 'long', totalScore: 82, entry: 3.82, stopLoss: 3.55, takeProfit: 4.35, riskPercent: 1.0,
    factors: { marketRegime: 78, trend: 85, momentum: 79, orderflow: 88, risk: 72, news: 75, structure: 80 },
    regime: 'Uptrend', sentiment: 'bullish', classification: 'HIGH CONVICTION', classificationColor: '#00e676', action: 'Normal size',
    reasoning: ['JTO breaking out of consolidation', 'DEX volume surging 3x WoW', 'TPS milestone approaching'],
    timestamp: Date.now() - 7200000,
  },
  {
    id: '3', symbol: 'WIF', direction: 'short', totalScore: 68, entry: 3.12, stopLoss: 3.35, takeProfit: 2.78, riskPercent: 1.0,
    factors: { marketRegime: 55, trend: 42, momentum: 38, orderflow: 45, risk: 68, news: 60, structure: 35 },
    regime: 'Ranging', sentiment: 'bearish', classification: 'MODERATE', classificationColor: '#f59e0b', action: 'Half size, tight SL',
    reasoning: ['WIF rejecting at $3.20 resistance', 'Funding rates turning negative', 'Potential liquidity sweep below'],
    timestamp: Date.now() - 14400000,
  },
]

const MOCK_TRADES: Trade[] = [
  { id: '1', symbol: 'SOL', direction: 'long', entry: 178.50, exit: 182.45, pnl: 395, pnlPercent: 2.21, status: 'closed', time: '2h ago' },
  { id: '2', symbol: 'PYTH', direction: 'long', entry: 0.42, exit: 0.38, pnl: -84, pnlPercent: -2.0, status: 'closed', time: '5h ago' },
  { id: '3', symbol: 'JTO', direction: 'long', entry: 3.65, exit: 3.82, pnl: 119, pnlPercent: 4.66, status: 'closed', time: '1d ago' },
  { id: '4', symbol: 'BONK', direction: 'short', entry: 0.000028, exit: 0.000031, pnl: -52, pnlPercent: -1.85, status: 'closed', time: '2d ago' },
]

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? '#00c853' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 3, height: 4 }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [solPrice, setSolPrice] = useState('182.45')
  const [signals, setSignals] = useState<Signal[]>(MOCK_SIGNALS)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(MOCK_SIGNALS[0])

  useEffect(() => {
    // Fetch live SOL price
    fetch('/api/market?symbol=SOL')
      .then(r => r.json())
      .then(d => { if (d.price) setSolPrice(d.price.toFixed(2)) })
      .catch(() => {})
  }, [])

  const totalPnL = MOCK_TRADES.reduce((sum, t) => sum + t.pnl, 0)
  const winRate = Math.round((MOCK_TRADES.filter(t => t.pnl > 0).length / MOCK_TRADES.length) * 100)
  const portfolioValue = 28450 + totalPnL

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08080d', color: '#e2e8f0' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#00c853,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000' }}>S</div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>SHADOW</span>
        </div>
        {[
          { icon: '◈', label: 'Dashboard', href: '/dashboard', active: true },
          { icon: '◉', label: 'Signals', href: '/signals', active: false },
          { icon: '◎', label: 'Terminal', href: '/terminal', active: false },
          { icon: '◆', label: 'Market', href: '/market', active: false },
          { icon: '◇', label: 'Portfolio', href: '/portfolio', active: false },
          { icon: '▣', label: 'Journal', href: '/journal', active: false },
          { icon: '◫', label: 'Strategies', href: '/strategies', active: false },
          { icon: '◰', label: 'Backtest', href: '/backtest', active: false },
          { icon: '◲', label: 'Risk', href: '/risk', active: false },
          { icon: '⚙', label: 'Settings', href: '/settings', active: false },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
            textDecoration: 'none', color: item.active ? '#e2e8f0' : '#64748b',
            background: item.active ? 'rgba(0,200,83,0.08)' : 'transparent',
            fontSize: 13, fontWeight: item.active ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Dashboard</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: '4px 12px' }}>
              <span style={{ fontSize: 11, color: '#00c853' }}>●</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>SOL ${solPrice}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Connected: 4x...9a2</div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00c853,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000' }}>M</div>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '24px 28px' }}>
          {[
            { label: 'Portfolio Value', value: `$${portfolioValue.toLocaleString()}`, sub: `+${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(0)}`, subColor: totalPnL >= 0 ? '#00c853' : '#ef4444', icon: '◈' },
            { label: 'Active Signals', value: '3', sub: '1 High Conviction', subColor: '#00e676', icon: '◉' },
            { label: "Today's PnL", value: `${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toFixed(0)}`, sub: `${winRate}% Win Rate`, subColor: '#00e676', icon: '◆' },
            { label: 'Win Rate (30d)', value: `${winRate}%`, sub: '12 trades', subColor: '#64748b', icon: '◇' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: stat.subColor }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Signals + Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '0 28px', flex: 1 }}>
          {/* Active Signals */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Active Signals</h2>
              <a href="/signals" style={{ fontSize: 12, color: '#00c853', textDecoration: 'none' }}>View All →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {signals.map(s => (
                <div key={s.id} onClick={() => setSelectedSignal(s)} style={{
                  background: selectedSignal?.id === s.id ? 'rgba(0,200,83,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedSignal?.id === s.id ? 'rgba(0,200,83,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{s.symbol}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.direction === 'long' ? '#00c853' : '#ef4444' }}>{s.direction.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: s.classificationColor + '20', border: `1px solid ${s.classificationColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: s.classificationColor }}>{s.totalScore}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#64748b' }}>
                    <span>Entry: ${s.entry}</span>
                    <span style={{ color: '#ef4444' }}>SL: ${s.stopLoss}</span>
                    <span style={{ color: '#00c853' }}>TP: ${s.takeProfit}</span>
                    <span>Risk: {s.riskPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Detail */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
            {selectedSignal ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{selectedSignal.symbol}/USDT</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: selectedSignal.classificationColor + '20', color: selectedSignal.classificationColor }}>
                      {selectedSignal.classification}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: selectedSignal.classificationColor }}>{selectedSignal.totalScore}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total Score</div>
                  </div>
                </div>

                {/* Price levels */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 20 }}>
                  {[
                    { label: 'Entry', value: `$${selectedSignal.entry}`, color: '#e2e8f0' },
                    { label: 'Stop', value: `$${selectedSignal.stopLoss}`, color: '#ef4444' },
                    { label: 'TP', value: `$${selectedSignal.takeProfit}`, color: '#00c853' },
                    { label: 'Risk', value: `${selectedSignal.riskPercent}%`, color: '#f59e0b' },
                  ].map(p => (
                    <div key={p.label}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{p.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.value}</div>
                    </div>
                  ))}
                </div>

                {/* 7-Factor Breakdown */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#94a3b8' }}>7-Factor Analysis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {Object.entries(selectedSignal.factors).map(([key, val]) => (
                      <ScoreBar key={key} score={val} label={key.replace(/([A-Z])/g, ' $1').trim()} />
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#94a3b8' }}>AI Reasoning</div>
                  {selectedSignal.reasoning.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid rgba(0,200,83,0.3)' }}>
                      {r}
                    </div>
                  ))}
                </div>

                <button style={{ width: '100%', background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer' }}>
                  {selectedSignal.action}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: 14 }}>
                Select a signal to view details
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div style={{ padding: '20px 28px 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Trades</h2>
              <a href="/journal" style={{ fontSize: 12, color: '#00c853', textDecoration: 'none' }}>View Journal →</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Symbol', 'Direction', 'Entry', 'Exit', 'PnL', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'left', padding: '0 12px 10px 0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TRADES.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 13, fontWeight: 600 }}>{t.symbol}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 12, fontWeight: 700, color: t.direction === 'long' ? '#00c853' : '#ef4444' }}>{t.direction.toUpperCase()}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#94a3b8' }}>${t.entry}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#94a3b8' }}>${t.exit}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 13, fontWeight: 700, color: t.pnl >= 0 ? '#00c853' : '#ef4444' }}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)} ({t.pnl >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%)
                    </td>
                    <td style={{ padding: '10px 12px 10px 0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 4 }}>{t.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#64748b' }}>{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}