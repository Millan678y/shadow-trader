'use client'
import { useState } from 'react'

const INSIGHTS = [
  { category: 'market', severity: 'bullish', title: 'BTC forming Higher Low on 4H — likely push to $68K', summary: 'Price action shows clean higher low pattern at $61.5K with strong order flow absorption at each dip. VIX declining below 18 suggests risk-on environment favorable for crypto.', time: '2m ago', actionable: true },
  { category: 'risk', severity: 'warning', title: 'ETH position at 18% — exceeds 15% concentration rule', summary: 'ETH allocation has grown from 12% to 18% due to price appreciation. Consider trimming to 12-13% to rebalance portfolio risk. Over-concentration in single asset increases tail risk.', time: '15m ago', actionable: true },
  { category: 'strategy', severity: 'info', title: 'SMC Killzone strategy: 72% win rate this week', summary: 'Your London killzone strategy has outperformed by 340% vs buy-and-hold. Consider increasing position sizing by 10-15% on this strategy given positive edge.', time: '1h ago', actionable: false },
  { category: 'sentiment', severity: 'neutral', title: 'Fear & Greed: 62 (Greed) — monitor for reversal', summary: 'Fear & Greed index at 62 indicates elevated optimism. Historically, readings above 65 precede corrections. Tighten stop losses on speculative positions.', time: '2h ago', actionable: true },
  { category: 'pattern', severity: 'bullish', title: 'RSI < 30 + Killzone confluence detected on SOL', summary: 'Historical analysis shows RSI < 30 during NY killzone has 78% win rate with 2.4 avg R. High-probability entry setup forming — consider scaling in.', time: '3h ago', actionable: true },
  { category: 'journal', severity: 'warning', title: '3 revenge trades detected this week — cooling period recommended', summary: 'Your journal shows 3 trades taken within 15 minutes of a loss — a pattern associated with 68% higher drawdowns. Enforce 30-minute cooling-off rule.', time: '5h ago', actionable: true },
]

const MARKETS = [
  { name: 'BTC', price: '$63,248', change: '+2.4%', trend: 'up' },
  { name: 'ETH', price: '$3,482', change: '+1.8%', trend: 'up' },
  { name: 'SOL', price: '$148.50', change: '-0.6%', trend: 'down' },
  { name: 'SPX', price: '5,278', change: '+0.3%', trend: 'up' },
  { name: 'VIX', price: '18.4', change: '-2.1%', trend: 'down' },
]

const RECOMMENDATIONS = [
  { action: 'TRIM', target: 'ETH', reason: 'Reduce concentration from 18% to 13%', urgency: 'high' as const, r: 2.4 },
  { action: 'SCALE IN', target: 'BTC', reason: 'Higher low + VIX declining = favorable setup', urgency: 'medium' as const, r: 1.8 },
  { action: 'CLOSE', target: 'SOL SHORT', reason: 'RSI < 30 at NY killzone — setup expired', urgency: 'low' as const, r: 0 },
  { action: 'ALERT', target: 'BTC', reason: 'Watch $68K resistance for breakout or rejection', urgency: 'medium' as const, r: 0 },
]

const SENTIMENT_COLORS: Record<string, string> = { bullish: 'var(--accent-green)', bearish: 'var(--accent-red)', warning: 'var(--accent-yellow)', neutral: 'var(--text-dim)', info: 'var(--accent-blue)' }

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai'; text: string; time: string}[]>([])

  const askAI = async () => {
    if (!query.trim()) return
    const userQ = query
    const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    setChatHistory(h => [...h, { role: 'user', text: userQ, time: now }])
    setQuery('')
    setLoading(true)

    const ANALYSES: Record<string, string> = {
      'btc': `BTC Analysis — ${new Date().toLocaleDateString()}\n\nPrice: $63,248 (+2.4% 24h)\nKey Level: $61,500 (higher low confirmed)\nResistance: $64,800 → $68,000\n\nBias: BULLISH on intraday. Clean higher low forming.\nOrder Flow: Absorption detected at $62,200 — smart money accumulating.\nRSI: 54 — neutral, room to run\n\nTrade Plan:\n• Entry: $62,800-$63,100 (pullback)\n• SL: $61,200 (ATR x 1.5)\n• TP1: $65,200 (+1.5R)\n• TP2: $68,000 (+2.8R)\n\nRisk: Rejection at $64,800 if VIX spikes above 22`,
      'eth': `ETH Analysis — ${new Date().toLocaleDateString()}\n\nPrice: $3,482 (+1.8% 24h)\nNote: ETH/BTC ratio recovering — alt season可能在酝酿\nKey Level: $3,200 support, $3,650 resistance\n\nBias: NEUTRAL-BULLISH\n• On-chain: Exchange outflows increasing (hodling signal)\n• DeFi TVL up 12% WoW\n• ETF flows: +$48M inflow yesterday\n\nAlert: Position at 18% — trim to 13% per risk rules`,
      'risk': `Risk Assessment — ${new Date().toLocaleDateString()}\n\nPortfolio Risk Score: 6.8/10 (ELEVATED)\n\n⚠️ Critical:\n• ETH concentration 18% (limit 15%)\n• Daily loss: $1,240 (limit $1,000)\n\n⚡ Warnings:\n• VaR(95%): $320 potential 1-day loss\n• 3 consecutive losses — revenge trade pattern detected\n\n✅ Healthy:\n• Sharpe Ratio: 1.84 (good)\n• Max DD: 8.2% (within 15% limit)\n• Position sizing within rules\n\nAction: Trim ETH, enforce 24h cooling off`,
      'default': `Shadow Trader AI Analysis — ${new Date().toLocaleDateString()}\n\n"${userQ}"\n\nBased on current market conditions:\n\n• BTC: $63,248 | Trend: Higher Low | Bias: BULLISH\n• ETH: $3,482 | Ratio recovering | Bias: NEUTRAL\n• VIX: 18.4 (falling) = RISK-ON environment\n\nKey Insight: Institutional inflows into BTC ETF remain strong (+$180M/24h). This supports prices. However, Fear & Greed at 62 (Greed) warrants caution.\n\nRecommended Actions:\n1. Look for pullback entries (not FOMO)\n2. Keep position sizing to 2% max risk\n3. Monitor $61,500 as key invalidation\n\nRemember: Markets at support = opportunity. Markets at resistance = danger.`,
    }

    const key = Object.keys(ANALYSES).find(k => userQ.toLowerCase().includes(k))
    const answer = ANALYSES[key || 'default']

    await new Promise(r => setTimeout(r, 800))
    setResponse(answer)
    setChatHistory(h => [...h, { role: 'ai', text: answer, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }])
    setLoading(false)
  }

  const filtered = filter === 'All' ? INSIGHTS : INSIGHTS.filter(i => i.category === filter || i.severity === filter)

  return (
    <div style={{ display: 'flex', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Left: insights + chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'market', 'risk', 'strategy', 'sentiment', 'pattern'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: filter === f ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border-default)'}`,
              color: filter === f ? '#fff' : 'var(--text-secondary)',
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {/* AI Chat */}
        <div className="panel">
          <div className="panel-header">🤖 AI Research Assistant</div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  background: msg.role === 'user' ? 'rgba(41,121,255,.15)' : 'var(--bg-elevated)',
                  border: msg.role === 'user' ? '1px solid var(--accent-blue)44' : '1px solid var(--border-dim)',
                  color: 'var(--text-bright)',
                  borderBottomLeftRadius: msg.role === 'user' ? '10px' : '2px',
                  borderBottomRightRadius: msg.role === 'ai' ? '10px' : '2px',
                }}>
                  {msg.text}
                  <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px', textAlign: msg.role === 'ai' ? 'left' : 'right' }}>{msg.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-dim)', fontSize: '12px', padding: '8px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: `bounce 1s ${i*0.15}s infinite` }} />)}
                </div>
                Analyzing...
              </div>
            )}
          </div>
          {/* Input */}
          <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-dim)', paddingTop: '12px', display: 'flex', gap: '6px' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
              placeholder="Ask: analyze BTC, assess risk, review portfolio..."
              style={{ flex: 1, fontSize: '12px' }}
            />
            <button onClick={askAI} disabled={loading || !query.trim()} className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 14px' }}>
              Ask AI
            </button>
          </div>
        </div>

        {/* Insights */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(insight => (
            <div key={insight.title} className="panel" style={{ borderLeft: `3px solid ${SENTIMENT_COLORS[insight.severity]}`, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: SENTIMENT_COLORS[insight.severity], letterSpacing: '.5px' }}>
                  {insight.category} · {insight.severity}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{insight.time}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: 'var(--text-bright)' }}>{insight.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight.summary}</div>
              {insight.actionable && (
                <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: 600, color: 'var(--accent-blue)' }}>→ Actionable: Review in Terminal</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {/* AI Recommendations */}
        <div className="panel">
          <div className="panel-header">🎯 AI Recommendations</div>
          <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {RECOMMENDATIONS.map((r, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-dim)',
                background: r.urgency === 'high' ? 'rgba(255,23,68,.08)' : 'var(--bg-elevated)',
                borderColor: r.urgency === 'high' ? 'var(--accent-red)44' : 'var(--border-dim)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-bright)' }}>{r.target}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '1px 6px', borderRadius: '3px',
                    background: r.urgency === 'high' ? 'var(--accent-red)' : r.urgency === 'medium' ? 'var(--accent-yellow)' : 'var(--bg-primary)',
                    color: r.urgency === 'medium' ? '#000' : r.urgency === 'high' ? '#fff' : 'var(--text-dim)'
                  }}>{r.urgency}</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px', color: r.action === 'TRIM' ? 'var(--accent-red)' : r.action === 'CLOSE' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                  {r.action}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.reason}</div>
                {r.r > 0 && <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Est. R: {r.r}x</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Market Snapshot */}
        <div className="panel">
          <div className="panel-header">📊 Market Snapshot</div>
          <div style={{ padding: '4px' }}>
            {MARKETS.map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)', fontSize: '11px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.price}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: m.trend === 'up' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{m.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick commands */}
        <div className="panel">
          <div className="panel-header">⚡ Quick Ask</div>
          <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {['Analyze BTC', 'Assess portfolio risk', 'Find trade setups', 'Review journal patterns'].map(q => (
              <button key={q} onClick={() => { setQuery(q); setTimeout(() => askAI(), 100) }} style={{
                textAlign: 'left', padding: '7px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              }}>→ {q}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}