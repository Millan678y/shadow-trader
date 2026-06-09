'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────
interface Kline { t: number; o: number; h: number; l: number; c: number; v: number }
interface OrderForm { side: 'LONG' | 'SHORT'; qty: string; entry: string; sl: string; tp: string }

// ── Calculation helpers ──────────────────────────────────
function calcRSI(klines: Kline[], period = 14): number {
  if (klines.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = klines.length - period; i < klines.length; i++) {
    const diff = klines[i].c - klines[i - 1].c
    if (diff >= 0) gains += diff; else losses += Math.abs(diff)
  }
  const avgGain = gains / period, avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function calcEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  const k = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k)
  return ema
}

function calcATR(klines: Kline[], period = 14): number {
  if (klines.length < 2) return 0
  const trs: number[] = []
  for (let i = 1; i < klines.length; i++) {
    const tr = Math.max(klines[i].h - klines[i].l,
      Math.abs(klines[i].h - klines[i - 1].c),
      Math.abs(klines[i].l - klines[i - 1].c))
    trs.push(tr)
  }
  if (trs.length < period) return trs[trs.length - 1] || 0
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period
  return atr
}

function calcMACD(klines: Kline[]): { macd: number; signal: number; hist: number } {
  const closes = klines.map(k => k.c)
  const ema12 = calcEMA(closes, 12), ema26 = calcEMA(closes, 26)
  const macd = ema12 - ema26
  // Approximate signal with 9-period EMA of macd
  const hist = macd * 0.9 // simplified
  return { macd, signal: macd * 0.9, hist: macd * 0.1 }
}

// ── Canvas Chart ─────────────────────────────────────────
function CandleChart({ klines, symbol }: { klines: Kline[]; symbol: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas || klines.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { t: 10, r: 60, b: 28, l: 10 }
    const cw = (W - pad.l - pad.r) / klines.length
    const max = Math.max(...klines.map(k => k.h)), min = Math.min(...klines.map(k => k.l))
    const range = max - min || 1, ch = H - pad.t - pad.b, cw2 = cw * 0.7

    ctx.clearRect(0, 0, W, H)
    // Grid
    ctx.strokeStyle = '#1a1b25'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch * i) / 4
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke()
      const price = max - (range * i) / 4
      ctx.fillStyle = '#55556a'; ctx.font = '9px JetBrains Mono,monospace'; ctx.textAlign = 'left'
      ctx.fillText('$' + price.toFixed(0), W - pad.r + 4, y + 3)
    }
    // Candles
    klines.forEach((k, i) => {
      const x = pad.l + i * cw + cw / 2
      const bull = k.c >= k.o
      const col = bull ? '#00e676' : '#ff1744'
      const bodyTop = pad.t + ch * (1 - (Math.max(k.o, k.c) - min) / range)
      const bodyBot = pad.t + ch * (1 - (Math.min(k.o, k.c) - min) / range)
      ctx.strokeStyle = col + '88'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, pad.t + ch * (1 - (k.h - min) / range))
      ctx.lineTo(x, pad.t + ch * (1 - (k.l - min) / range)); ctx.stroke()
      ctx.fillStyle = col
      ctx.fillRect(x - cw2 / 2, bodyTop, cw2, Math.max(1, bodyBot - bodyTop))
    })
    // Price line
    if (klines.length > 0) {
      const last = klines[klines.length - 1]
      const ly = pad.t + ch * (1 - (last.c - min) / range)
      ctx.strokeStyle = '#00e67644'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(W - pad.r, ly); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#00e676'; ctx.font = 'bold 10px JetBrains Mono,monospace'
      ctx.textAlign = 'left'; ctx.fillText('$' + last.c.toFixed(2), W - pad.r + 4, ly + 3)
    }
    // Timestamp labels
    ctx.fillStyle = '#444455'; ctx.font = '8px JetBrains Mono,monospace'
    ctx.textAlign = 'center'
    for (let i = 0; i < klines.length; i += Math.ceil(klines.length / 5)) {
      const x = pad.l + i * cw + cw / 2
      const d = new Date(klines[i].t)
      ctx.fillText(d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'), x, H - 8)
    }
  }, [klines])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const obs = new ResizeObserver(draw)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [draw])

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }} />
}

// ── Main ────────────────────────────────────────────────
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'AVAXUSDT']
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [tf, setTf] = useState('15m')
  const [klines, setKlines] = useState<Kline[]>([])
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState('--')
  const [form, setForm] = useState<OrderForm>({ side: 'LONG', qty: '0.01', entry: '', sl: '', tp: '' })
  const [orderPlaced, setOrderPlaced] = useState(false)

  const fetchKlines = useCallback(async (sym: string, timeframe: string) => {
    setLoading(true)
    try {
      const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${timeframe}&limit=200`)
      if (!r.ok) throw new Error()
      const raw: any[][] = await r.json()
      const data: Kline[] = raw.map(k => ({ t: k[0], o: parseFloat(k[1]), h: parseFloat(k[2]), l: parseFloat(k[3]), c: parseFloat(k[4]), v: parseFloat(k[5]) }))
      setKlines(data)
      if (data.length > 0) setPrice('$' + data[data.length - 1].c.toFixed(2))
    } catch {
      setKlines([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchKlines(symbol, tf) }, [symbol, tf, fetchKlines])

  // Indicators
  const rsi = calcRSI(klines)
  const closes = klines.map(k => k.c)
  const ema20 = calcEMA(closes, 20)
  const ema50 = calcEMA(closes, 50)
  const ema200 = calcEMA(closes, 200)
  const atr = calcATR(klines)
  const macd = calcMACD(klines)

  // Order calc
  const entry = parseFloat(form.entry) || 0
  const sl = parseFloat(form.sl) || 0
  const tp = parseFloat(form.tp) || 0
  const qty = parseFloat(form.qty) || 0
  const risk = sl > 0 && entry > 0 ? Math.abs(entry - sl) * qty : 0
  const reward = tp > 0 && entry > 0 ? Math.abs(tp - entry) * qty : 0
  const rr = risk > 0 && reward > 0 ? reward / risk : 0
  const estPnl = entry > 0 && tp > 0 && qty > 0
    ? form.side === 'LONG' ? (tp - entry) * qty : (entry - tp) * qty
    : 0

  const placeOrder = () => {
    if (!form.qty || !form.entry) return
    setOrderPlaced(true)
    setTimeout(() => setOrderPlaced(false), 3000)
    setForm(f => ({ ...f, qty: '0.01', entry: '', sl: '', tp: '' }))
  }

  const setEntryFromLast = () => {
    if (klines.length > 0) setForm(f => ({ ...f, entry: klines[klines.length - 1].c.toFixed(2) }))
  }

  // Recent mock trades
  const recents = [
    { sym: 'BTC', side: 'LONG', entry: 62450, exit: 63100, pnl: 32.50, t: '14:32' },
    { sym: 'ETH', side: 'SHORT', entry: 3520, exit: 3480, pnl: 20.00, t: '13:15' },
    { sym: 'BTC', side: 'LONG', entry: 61800, exit: 62200, pnl: 40.00, t: '11:44' },
    { sym: 'SOL', side: 'LONG', entry: 145.00, exit: 143.50, pnl: -7.50, t: '10:22' },
    { sym: 'BTC', side: 'LONG', entry: 61000, exit: 61500, pnl: 40.00, t: '09:05' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ width: '140px', fontWeight: 700 }}>
          {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--text-bright)' }}>{price}</span>
        <div style={{ flex: 1 }} />
        {TIMEFRAMES.map(f => (
          <button key={f} onClick={() => setTf(f)} className="btn btn-ghost" style={{
            fontSize: '11px', padding: '4px 10px',
            background: tf === f ? 'rgba(41,121,255,.15)' : 'transparent',
            border: `1px solid ${tf === f ? 'var(--accent-blue)' : 'var(--border-default)'}`,
            color: tf === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}>{f}</button>
        ))}
        <button onClick={() => fetchKlines(symbol, tf)} className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 10px' }}>
          {loading ? '⏳' : '↺'}
        </button>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', gap: '8px', flex: 1, minHeight: 0 }}>
        {/* Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div className="panel" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel-header">
              {loading ? '⏳ Loading...' : `${symbol} · ${tf.toUpperCase()} · ${klines.length} candles`}
            </div>
            <div style={{ flex: 1, minHeight: '200px', position: 'relative' }}>
              {klines.length > 0 ? <CandleChart klines={klines} symbol={symbol} /> : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  Loading chart data from Binance...
                </div>
              )}
            </div>
          </div>

          {/* Indicators */}
          <div className="panel">
            <div className="panel-header">📐 Indicators</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', background: 'var(--border-dim)' }}>
              {[
                { label: 'RSI(14)', value: rsi.toFixed(1), color: rsi > 70 ? 'var(--accent-red)' : rsi < 30 ? 'var(--accent-green)' : 'var(--text-bright)' },
                { label: 'MACD', value: macd.macd.toFixed(2), color: macd.macd > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Signal', value: macd.signal.toFixed(2), color: 'var(--text-secondary)' },
                { label: 'EMA20', value: ema20.toFixed(2), color: closes[closes.length-1] > ema20 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'EMA50', value: ema50.toFixed(2), color: closes[closes.length-1] > ema50 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'ATR(14)', value: atr.toFixed(2), color: 'var(--accent-blue)' },
              ].map(ind => (
                <div key={ind.label} style={{ background: 'var(--bg-elevated)', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '2px' }}>{ind.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: ind.color }}>{ind.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="panel">
            <div className="panel-header">📜 Recent Trades</div>
            <div style={{ padding: '4px 0' }}>
              {recents.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', fontSize: '11px', borderBottom: '1px solid var(--border-dim)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', fontSize: '9px',
                    background: t.side === 'LONG' ? 'rgba(0,230,118,.15)' : 'rgba(255,23,68,.15)',
                    color: t.side === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}>{t.side}</span>
                  <span style={{ fontWeight: 600 }}>{t.sym}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{t.entry} → {t.exit}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{t.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Entry Sidebar */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="panel">
            <div className="panel-header">📝 Order Entry</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Side */}
              <div>
                <label>Direction</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['LONG', 'SHORT'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, side: s }))} style={{
                      flex: 1, padding: '8px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                      background: form.side === s ? (s === 'LONG' ? 'rgba(0,230,118,.2)' : 'rgba(255,23,68,.2)') : 'var(--bg-elevated)',
                      border: `2px solid ${form.side === s ? (s === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--border-default)'}`,
                      color: form.side === s ? (s === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-dim)',
                      transition: 'all .15s',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label>Quantity</label>
                <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0.01" step="0.001" />
              </div>

              {/* Entry Price */}
              <div>
                <label>Entry Price</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="number" value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))} placeholder={klines.length > 0 ? klines[klines.length-1].c.toFixed(2) : '0'} />
                  <button onClick={setEntryFromLast} style={{ padding: '0 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-dim)', fontSize: '11px', cursor: 'pointer' }}>L</button>
                </div>
              </div>

              {/* SL */}
              <div>
                <label>Stop Loss</label>
                <input type="number" value={form.sl} onChange={e => setForm(f => ({ ...f, sl: e.target.value }))} placeholder="0.00" />
              </div>

              {/* TP */}
              <div>
                <label>Take Profit</label>
                <input type="number" value={form.tp} onChange={e => setForm(f => ({ ...f, tp: e.target.value }))} placeholder="0.00" />
              </div>

              {/* Risk/Reward */}
              {(risk > 0 || reward > 0) && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--accent-red)' }}>${risk.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reward</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--accent-green)' }}>${reward.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center', gridColumn: '1/3' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>R:R Ratio</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: rr >= 2 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                      1:{rr.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Est PnL */}
              {estPnl !== 0 && (
                <div style={{ textAlign: 'center', padding: '6px', borderRadius: '6px', background: estPnl > 0 ? 'rgba(0,230,118,.1)' : 'rgba(255,23,68,.1)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Est. PnL: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: estPnl > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {estPnl >= 0 ? '+' : ''}${estPnl.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Order placed toast */}
              {orderPlaced && (
                <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,230,118,.15)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                  ✅ Order placed (DRY-RUN)
                </div>
              )}

              {/* Submit */}
              <button onClick={placeOrder} className="btn btn-green" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
                {form.side === 'LONG' ? '▲ LONG' : '▼ SHORT'} {form.qty || '—'} {symbol.replace('USDT', '')}
              </button>
            </div>
          </div>

          {/* Market Info */}
          <div className="panel">
            <div className="panel-header">📊 Market Info</div>
            <div style={{ padding: '8px' }}>
              {[
                { label: '24h High', value: klines.length ? Math.max(...klines.map(k => k.h)).toFixed(2) : '--', color: 'var(--accent-green)' },
                { label: '24h Low', value: klines.length ? Math.min(...klines.map(k => k.l)).toFixed(2) : '--', color: 'var(--accent-red)' },
                { label: '24h Volume', value: klines.length ? (klines[klines.length - 1].v / 1000).toFixed(1) + 'K' : '--', color: 'var(--text-secondary)' },
                { label: 'EMA200', value: ema200.toFixed(2), color: closes[closes.length-1] > ema200 ? 'var(--accent-green)' : 'var(--accent-red)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', borderBottom: '1px solid var(--border-dim)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.color }}>${row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}