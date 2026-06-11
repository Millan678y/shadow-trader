'use client'
import { useState, useEffect } from 'react'

interface FactorScores {
  marketRegime: number; trend: number; momentum: number
  risk: number; news: number; structure: number; orderflow: number
}

interface Signal {
  id: string; symbol: string; direction: 'long' | 'short' | 'neutral'
  totalScore: number; confidence: number; entry: number; stopLoss: number
  takeProfit: number; riskPercent: number; timeframe: string; factors: FactorScores
  regime: string; sentiment: string; classification: string
  classificationColor: string; action: string; reasoning: string[]
  warnings: string[]; timestamp: number; expiresAt: number
}

const FILTER_TABS = ['All', 'Long', 'Short', 'Strong Conviction', 'High Conviction', 'Moderate']
const TIMEFRAMES = ['1H', '4H', '1D']
const TIER_REQUIREMENTS: Record<string, string> = {
  'Strong Conviction': 'Elite',
  'High Conviction': 'Pro',
  'Moderate': 'Free',
}

export default function SignalsClient() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [timeframe, setTimeframe] = useState('4H')
  const [selected, setSelected] = useState<Signal | null>(null)
  const [wallet, setWallet] = useState('')

  useEffect(() => {
    fetch('/api/signals?symbol=SOL')
      .then(r => r.json())
      .then(d => {
        if (d.symbol) {
          const mock: Signal[] = [
            { ...d, id: '1', symbol: 'SOL' } as Signal,
            { ...d, id: '2', symbol: 'JTO', totalScore: 82, entry: 3.82, stopLoss: 3.55, takeProfit: 4.35, direction: 'long' } as Signal,
            { ...d, id: '3', symbol: 'WIF', totalScore: 68, entry: 3.12, stopLoss: 3.35, takeProfit: 2.78, direction: 'short' } as Signal,
            { ...d, id: '4', symbol: 'RAY', totalScore: 91, entry: 8.42, stopLoss: 8.10, takeProfit: 9.20, direction: 'long' } as Signal,
            { ...d, id: '5', symbol: 'SRM', totalScore: 74, entry: 1.15, stopLoss: 1.08, takeProfit: 1.35, direction: 'long' } as Signal,
          ]
          setSignals(mock)
          setSelected(mock[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = signals.filter(s => {
    if (filter === 'All') return true
    if (filter === 'Long') return s.direction === 'long'
    if (filter === 'Short') return s.direction === 'short'
    if (filter === 'Strong Conviction') return s.totalScore >= 90
    if (filter === 'High Conviction') return s.totalScore >= 75 && s.totalScore < 90
    if (filter === 'Moderate') return s.totalScore >= 60 && s.totalScore < 75
    return true
  })

  function FactorBar({ score, label }: { score: number; label: string }) {
    const c = score >= 75 ? '#00c853' : score >= 60 ? '#f59e0b' : '#ef4444'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', width: 80 }}>{label}</span>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 3, height: 6 }}>
          <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: c }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: c, width: 28 }}>{score}</span>
      </div>
    )
  }

  const tier = 'Pro' // would come from auth
  const canExecute = (signal: Signal) => {
    const required = TIER_REQUIREMENTS[signal.classification] || 'Free'
    const tierOrder = ['Free', 'Pro', 'Elite', 'VIP']
    return tierOrder.indexOf(tier) >= tierOrder.indexOf(required)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08080d', color: '#e2e8f0' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#00c853,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000' }}>S</div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>SHADOW</span>
        </div>
        {[
          { icon: '◈', label: 'Dashboard', href: '/dashboard' },
          { icon: '◉', label: 'Signals', href: '/signals', active: true },
          { icon: '◎', label: 'Terminal', href: '/terminal' },
          { icon: '◆', label: 'Market', href: '/market' },
          { icon: '◇', label: 'Portfolio', href: '/portfolio' },
          { icon: '▣', label: 'Journal', href: '/journal' },
          { icon: '◫', label: 'Strategies', href: '/strategies' },
          { icon: '◰', label: 'Backtest', href: '/backtest' },
          { icon: '◲', label: 'Risk', href: '/risk' },
          { icon: '⚙', label: 'Settings', href: '/settings' },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
            textDecoration: 'none', color: item.active ? '#e2e8f0' : '#64748b',
            background: item.active ? 'rgba(0,200,83,0.08)' : 'transparent',
            fontSize: 13, fontWeight: item.active ? 600 : 400,
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
          </a>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>AI Signals</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: timeframe === tf ? 'rgba(0,200,83,0.15)' : 'transparent',
                  color: timeframe === tf ? '#00c853' : '#64748b',
                }}>{tf}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 6, padding: '4px 10px', color: '#00c853' }}>
              Tier: {tier}
            </div>
          </div>
        </header>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto' }}>
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: '1px solid',
              borderColor: filter === f ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.08)',
              background: filter === f ? 'rgba(0,200,83,0.1)' : 'transparent',
              color: filter === f ? '#00c853' : '#94a3b8', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{f}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 0, flex: 1, overflow: 'hidden' }}>
          {/* Signal List */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b' }}>Loading signals...</div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                <div style={{ fontSize: 32 }}>◉</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>No signals match your filters</div>
              </div>
            ) : (
              filtered.map(s => (
                <div key={s.id} onClick={() => setSelected(s)} style={{
                  padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: selected?.id === s.id ? 'rgba(0,200,83,0.04)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: s.classificationColor + '15', border: `1px solid ${s.classificationColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: s.classificationColor }}>{s.totalScore}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{s.symbol}/USDT</span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: s.classificationColor + '20', color: s.classificationColor }}>{s.classification}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {s.direction.toUpperCase()} · {s.regime} · {new Date(s.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#94a3b8' }}>Entry / SL / TP</div>
                        <div style={{ fontWeight: 600 }}>${s.entry} / ${s.stopLoss} / ${s.takeProfit}</div>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>Risk {s.riskPercent}%</div>
                    </div>
                  </div>

                  {/* Mini factor bars */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Object.entries(s.factors).map(([k, v]) => (
                      <div key={k} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 4, padding: '4px 6px' }}>
                        <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>{k.slice(0, 3).toUpperCase()}</div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                          <div style={{ width: `${v}%`, height: '100%', borderRadius: 2, background: v >= 75 ? '#00c853' : v >= 60 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Signal Detail Panel */}
          {selected && (
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)', padding: 24 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{selected.symbol}/USDT</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{selected.regime} · {selected.timeframe}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: selected.classificationColor }}>{selected.totalScore}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Total Score</div>
                </div>
              </div>

              {/* Classification badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: selected.classificationColor + '15', border: `1px solid ${selected.classificationColor}40`, borderRadius: 8, padding: '8px 14px', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: selected.classificationColor }}>{selected.classification}</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>·</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: selected.direction === 'long' ? '#00c853' : '#ef4444' }}>{selected.direction.toUpperCase()}</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>·</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{selected.confidence}% confidence</span>
              </div>

              {/* Price Levels */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Entry', val: `$${selected.entry}`, c: '#e2e8f0' },
                  { label: 'Stop Loss', val: `$${selected.stopLoss}`, c: '#ef4444' },
                  { label: 'Take Profit', val: `$${selected.takeProfit}`, c: '#00c853' },
                  { label: 'Risk', val: `${selected.riskPercent}%`, c: '#f59e0b' },
                ].map(p => (
                  <div key={p.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{p.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: p.c }}>{p.val}</div>
                  </div>
                ))}
              </div>

              {/* 7-Factor Analysis */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: 10 }}>7-Factor Analysis</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(selected.factors).map(([k, v]) => (
                    <FactorBar key={k} score={v} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()} />
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI Reasoning</div>
                {selected.reasoning.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, paddingLeft: 10, borderLeft: '2px solid rgba(0,200,83,0.25)', lineHeight: 1.6 }}>{r}</div>
                ))}
              </div>

              {/* Warnings */}
              {selected.warnings.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {selected.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>⚠ {w}</div>
                  ))}
                </div>
              )}

              {/* Execute */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canExecute(selected) ? (
                  <button style={{ background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 8, padding: '13px 0', fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer' }}>
                    {selected.action}
                  </button>
                ) : (
                  <button disabled style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '13px 0', fontSize: 13, color: '#64748b', cursor: 'not-allowed' }}>
                    Upgrade to {TIER_REQUIREMENTS[selected.classification]} to execute
                  </button>
                )}
                <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, color: '#94a3b8', cursor: 'pointer' }}>
                  Add to Watchlist
                </button>
              </div>

              {/* Expiry */}
              <div style={{ marginTop: 16, fontSize: 11, color: '#475569', textAlign: 'center' }}>
                Signal expires {new Date(selected.expiresAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}