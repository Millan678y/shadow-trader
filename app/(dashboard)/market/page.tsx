'use client'
import { useState, useEffect, useCallback } from 'react'

interface MarketAsset {
  symbol: string; name: string; price: number; change: number; volume: string;
  market_cap?: string; high: number; low: number; asset_class: string;
}

const ASSET_CLASSES = ['All', 'Crypto', 'Stock', 'Forex', 'Futures', 'ETF', 'Commodity']
const SORT_OPTIONS = ['Price', 'Change %', 'Volume', 'Market Cap']

// Demo market data (in production, this comes from /api/market)
const DEMO_MARKETS: MarketAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 63248, change: 2.34, volume: '$28.4B', market_cap: '$1.24T', high: 64100, low: 61800, asset_class: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3482, change: 1.87, volume: '$14.2B', market_cap: '$418B', high: 3520, low: 3410, asset_class: 'Crypto' },
  { symbol: 'SOL', name: 'Solana', price: 148.5, change: -1.24, volume: '$2.8B', market_cap: '$64B', high: 152, low: 146, asset_class: 'Crypto' },
  { symbol: 'BNB', name: 'Binance Coin', price: 584, change: 0.92, volume: '$1.1B', market_cap: '$87B', high: 590, low: 578, asset_class: 'Crypto' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 874, change: 3.21, volume: '$38B', market_cap: '$2.15T', high: 882, low: 848, asset_class: 'Stock' },
  { symbol: 'AAPL', name: 'Apple', price: 214.5, change: 0.45, volume: '$52B', market_cap: '$3.3T', high: 216, low: 213, asset_class: 'Stock' },
  { symbol: 'TSLA', name: 'Tesla', price: 248.9, change: -2.18, volume: '$28B', market_cap: '$790B', high: 255, low: 246, asset_class: 'Stock' },
  { symbol: 'MSFT', name: 'Microsoft', price: 421.8, change: 1.12, volume: '$22B', market_cap: '$3.13T', high: 424, low: 417, asset_class: 'Stock' },
  { symbol: 'EURUSD', name: 'Euro / Dollar', price: 1.0842, change: -0.31, volume: '$180B/day', high: 1.0870, low: 1.0830, asset_class: 'Forex' },
  { symbol: 'GBPUSD', name: 'Pound / Dollar', price: 1.2724, change: -0.18, volume: '$120B/day', high: 1.2750, low: 1.2710, asset_class: 'Forex' },
  { symbol: 'USDJPY', name: 'Dollar / Yen', price: 157.82, change: 0.44, volume: '$200B/day', high: 158.2, low: 157.0, asset_class: 'Forex' },
  { symbol: 'GC=F', name: 'Gold Futures', price: 2318.4, change: 0.67, volume: '$45B', market_cap: 'N/A', high: 2330, low: 2300, asset_class: 'Futures' },
  { symbol: 'CL=F', name: 'Crude Oil', price: 77.42, change: -1.03, volume: '$32B', market_cap: 'N/A', high: 78.5, low: 76.8, asset_class: 'Futures' },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 527.8, change: 0.89, volume: '$8.2B', market_cap: '$510B', high: 529, low: 524, asset_class: 'ETF' },
  { symbol: 'GLD', name: 'Gold ETF', price: 232.4, change: 0.64, volume: '$4.1B', market_cap: '$60B', high: 233, low: 231, asset_class: 'ETF' },
]

function GainBar({ change }: { change: number }) {
  const pct = Math.min(Math.abs(change) / 5 * 100, 100)
  return (
    <div style={{ width: '60px', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
        borderRadius: '2px',
      }} />
    </div>
  )
}

function MarketRow({ asset }: { asset: MarketAsset }) {
  const up = asset.change >= 0
  const col = up ? 'var(--accent-green)' : 'var(--accent-red)'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 60px',
      gap: '8px',
      alignItems: 'center',
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-dim)',
      cursor: 'pointer',
      transition: 'background .1s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-bright)' }}>{asset.symbol}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{asset.name}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--text-bright)' }}>
        {asset.asset_class === 'Forex' ? asset.price.toFixed(4) : '$' + asset.price.toLocaleString('en', { maximumFractionDigits: asset.price < 10 ? 2 : 0 })}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px', color: col }}>
          {up ? '+' : ''}{asset.change.toFixed(2)}%
        </div>
        <GainBar change={asset.change} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{asset.volume}</div>
      <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}>
        {asset.asset_class}
      </div>
    </div>
  )
}

function MarketHeatmap() {
  const colors = [
    '#00e676', '#00c853', '#69f0ae', '#b2ff59',
    '#ff1744', '#d50000', '#ff5252', '#ff8a80',
    '#ffea00', '#ffd600', '#ffff00',
  ]
  const tiles = [
    { symbol: 'BTC', change: 2.3, size: 2 },
    { symbol: 'NVDA', change: 3.2, size: 2 },
    { symbol: 'ETH', change: 1.9, size: 1 },
    { symbol: 'TSLA', change: -2.2, size: 1 },
    { symbol: 'SOL', change: -1.2, size: 1 },
    { symbol: 'MSFT', change: 1.1, size: 1 },
    { symbol: 'AAPL', change: 0.5, size: 1 },
    { symbol: 'EURUSD', change: -0.3, size: 1 },
    { symbol: 'GLD', change: 0.6, size: 1 },
    { symbol: 'SPY', change: 0.9, size: 1 },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
      {tiles.map(t => {
        const intensity = Math.min(Math.abs(t.change) / 3, 1)
        const color = t.change >= 0 ? `rgba(0,230,118,${0.15 + intensity * 0.7})` : `rgba(255,23,68,${0.15 + intensity * 0.7})`
        const borderColor = t.change >= 0 ? `rgba(0,230,118,${0.3 + intensity * 0.5})` : `rgba(255,23,68,${0.3 + intensity * 0.5})`
        const gridClass = t.size === 2 ? 'span-2' : ''
        return (
          <div key={t.symbol} style={{
            background: color,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80px',
            cursor: 'pointer',
          }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-bright)' }}>{t.symbol}</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '13px',
              color: t.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MarketPage() {
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Volume')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'heatmap'>('table')
  const [data, setData] = useState<MarketAsset[]>(DEMO_MARKETS)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/market')
      if (r.ok) {
        const d = await r.json()
        // Update BTC/ETH/SOL from live data
        setData(prev => prev.map(a => {
          if (a.symbol === 'BTC' && d.btc) return { ...a, price: d.btc.price, change: d.btc.change_24h }
          if (a.symbol === 'ETH' && d.eth) return { ...a, price: d.eth.price, change: d.eth.change_24h }
          if (a.symbol === 'SOL' && d.sol) return { ...a, price: d.sol.price, change: d.sol.change_24h }
          return a
        }))
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [fetchData])

  const filtered = data
    .filter(a => filter === 'All' || a.asset_class === filter)
    .filter(a => !search || a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Change %') return b.change - a.change
      if (sort === 'Volume') return b.volume.localeCompare(a.volume)
      if (sort === 'Market Cap') return (b.market_cap || '').localeCompare(a.market_cap || '')
      return a.price - b.price
    })

  const gainers = [...data].sort((a, b) => b.change - a.change).slice(0, 5)
  const losers = [...data].sort((a, b) => a.change - b.change).slice(0, 5)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* ── Main Market Table ──────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
        {/* Controls */}
        <div className="panel" style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search symbol..."
            style={{ maxWidth: '200px', fontSize: '12px' }}
          />

          {/* Asset class filters */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {ASSET_CLASSES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: filter === c ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  color: filter === c ? '#fff' : 'var(--text-secondary)',
                  border: filter === c ? '1px solid var(--accent-blue)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: '120px', fontSize: '12px' }}>
            {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: '6px', overflow: 'hidden' }}>
            <button onClick={() => setView('table')} style={{
              padding: '4px 10px', fontSize: '11px', background: view === 'table' ? 'var(--bg-elevated)' : 'transparent',
              color: view === 'table' ? 'var(--text-bright)' : 'var(--text-dim)', borderRight: '1px solid var(--border-default)',
            }}>Table</button>
            <button onClick={() => setView('heatmap')} style={{
              padding: '4px 10px', fontSize: '11px', background: view === 'heatmap' ? 'var(--bg-elevated)' : 'transparent',
              color: view === 'heatmap' ? 'var(--text-bright)' : 'var(--text-dim)',
            }}>Heatmap</button>
          </div>

          {loading && <div style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>Updating...</div>}
        </div>

        {/* Table / Heatmap */}
        <div className="panel" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="panel-header">
            <span>📈 Markets</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>
              {filtered.length} assets
            </span>
          </div>
          <div style={{ overflow: 'auto', height: 'calc(100% - 40px)' }}>
            {view === 'heatmap' ? (
              <div style={{ padding: '12px' }}>
                <MarketHeatmap />
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr 60px',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                  color: 'var(--text-dim)',
                  borderBottom: '1px solid var(--border-dim)',
                }}>
                  <span>Symbol</span>
                  <span>Price</span>
                  <span>Change</span>
                  <span>Volume</span>
                  <span>Class</span>
                </div>
                {filtered.map(a => <MarketRow key={a.symbol} asset={a} />)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar: Gainers / Losers ─────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {/* Top Gainers */}
        <div className="panel">
          <div className="panel-header" style={{ color: 'var(--accent-green)' }}>🟢 Top Gainers</div>
          <div>
            {gainers.map((a, i) => (
              <div key={a.symbol} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderBottom: '1px solid var(--border-dim)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>{a.symbol}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{a.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>
                    +{a.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="panel">
          <div className="panel-header" style={{ color: 'var(--accent-red)' }}>🔴 Top Losers</div>
          <div>
            {losers.map((a, i) => (
              <div key={a.symbol} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderBottom: '1px solid var(--border-dim)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>{a.symbol}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{a.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-red)' }}>
                    {a.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="panel">
          <div className="panel-header">📊 Market Stats</div>
          <div style={{ padding: '8px 0' }}>
            {[
              { label: 'BTC Dominance', value: '52.4%', sub: '+0.3%' },
              { label: 'ETH/BTC Ratio', value: '0.055', sub: '-0.4%' },
              { label: 'Total Mkt Cap', value: '$2.48T', sub: '+1.8%' },
              { label: 'Altcoin Season', value: '67 / 100', sub: 'Bullish' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderBottom: '1px solid var(--border-dim)',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{s.sub}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-bright)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add to Watchlist */}
        <div className="panel">
          <div className="panel-header">⭐ Watchlist</div>
          <div style={{ padding: '8px 0' }}>
            {['BTC', 'ETH', 'SOL', 'NVDA', 'TSLA'].map(s => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderBottom: '1px solid var(--border-dim)',
              }}>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>{s}</span>
                <button style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  background: 'transparent', border: '1px solid var(--accent-yellow)',
                  color: 'var(--accent-yellow)', cursor: 'pointer',
                }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}