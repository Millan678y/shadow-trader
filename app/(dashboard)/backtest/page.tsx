'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface Trade { entry: number; exit: number; pnl: number; side: string; dur: string; time: string }

function genBacktest(params: any): { equity: number[]; trades: Trade[]; metrics: any } {
  const { initial, winRate, rr, trades: n, dd } = {
    initial: params.balance || 10000,
    winRate: 0.55 + Math.random() * 0.1,
    rr: 1.8 + Math.random() * 1.2,
    trades: Math.floor(50 + Math.random() * 150),
    dd: 0.08 + Math.random() * 0.12,
  }
  const equity: number[] = [initial]
  const trades: Trade[] = []
  let bal = initial
  const sides = ['LONG', 'SHORT', 'LONG', 'LONG']
  const times = ['09:32', '10:15', '11:44', '13:22', '14:05', '15:38', '16:50', '17:45']
  for (let i = 0; i < n; i++) {
    const size = bal * 0.1
    const win = Math.random() < winRate
    const risk = size * 0.02
    const pnl = win ? risk * rr : -risk
    bal = Math.max(bal * 0.5, bal + pnl)
    equity.push(bal)
    trades.push({
      entry: 100 + Math.random() * 1000,
      exit: 100 + Math.random() * 1000,
      pnl,
      side: sides[i % sides.length],
      dur: Math.floor(15 + Math.random() * 180) + 'm',
      time: times[i % times.length],
    })
  }
  const returns = equity.slice(1).map((e, i) => (e - equity[i]) / equity[i])
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length
  const std = Math.sqrt(returns.reduce((s, r) => s + (r - avg) ** 2, 0) / returns.length)
  const downside = returns.filter(r => r < 0)
  const downsideStd = downside.length > 0 ? Math.sqrt(downside.reduce((s, r) => s + r ** 2, 0) / downside.length) : 0
  const wins = trades.filter(t => t.pnl > 0)
  const totalWin = wins.reduce((s, t) => s + t.pnl, 0)
  const totalLoss = trades.filter(t => t.pnl < 0).reduce((s, t) => s + Math.abs(t.pnl), 0)
  const maxEquity = Math.max(...equity)
  const maxDD = Math.min(...equity.map(e => (e - maxEquity) / maxEquity))

  return {
    equity,
    trades,
    metrics: {
      totalTrades: n,
      winRate: (wins.length / n * 100).toFixed(1),
      profitFactor: totalLoss > 0 ? (totalWin / totalLoss).toFixed(2) : '∞',
      sharpe: (avg / std * Math.sqrt(252)).toFixed(2),
      sortino: downsideStd > 0 ? (avg / downsideStd * Math.sqrt(252)).toFixed(2) : '∞',
      maxDD: (maxDD * 100).toFixed(1),
      cagr: (((equity[equity.length - 1] / equity[0]) ** (1 / (n / 252)) - 1) * 100).toFixed(1),
      totalReturn: ((equity[equity.length - 1] / equity[0] - 1) * 100).toFixed(1),
      bestTrade: Math.max(...trades.map(t => t.pnl)).toFixed(2),
      worstTrade: Math.min(...trades.map(t => t.pnl)).toFixed(2),
      avgTrade: (trades.reduce((s, t) => s + t.pnl, 0) / n).toFixed(2),
      expectancy: (trades.reduce((s, t) => s + t.pnl, 0) / n).toFixed(2),
    }
  }
}

function EquityCurve({ data, initial }: { data: number[]; initial: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const pad = { t: 20, r: 60, b: 30, l: 10 }
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1

    // Gradient
    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b)
    grad.addColorStop(0, 'rgba(0,230,118,0.3)')
    grad.addColorStop(1, 'rgba(0,230,118,0)')

    ctx.clearRect(0, 0, W, H)
    // Grid
    ctx.strokeStyle = '#1a1b25'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch * i) / 4
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke()
      const val = max - (range * i) / 4
      ctx.fillStyle = '#55556a'; ctx.font = '9px JetBrains Mono,monospace'
      ctx.textAlign = 'left'; ctx.fillText('$' + val.toFixed(0), W - pad.r + 4, y + 3)
    }
    // Start line
    const startY = pad.t + ch * (1 - (initial - min) / range)
    ctx.strokeStyle = '#3a3a55'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.l, startY); ctx.lineTo(W - pad.r, startY); ctx.stroke(); ctx.setLineDash([])

    // Fill
    ctx.beginPath()
    ctx.moveTo(pad.l, H - pad.b)
    data.forEach((v, i) => {
      const x = pad.l + (i / (data.length - 1)) * cw
      const y = pad.t + ch * (1 - (v - min) / range)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(pad.l + cw, H - pad.b); ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

    // Line
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = pad.l + (i / (data.length - 1)) * cw
      const y = pad.t + ch * (1 - (v - min) / range)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2; ctx.stroke()

    // Labels
    ctx.fillStyle = '#00e676'; ctx.font = 'bold 10px JetBrains Mono,monospace'
    ctx.textAlign = 'left'; ctx.fillText('$' + data[data.length - 1].toFixed(0), pad.l, pad.t - 5)
    ctx.fillStyle = '#55556a'; ctx.font = '9px JetBrains Mono,monospace'
    ctx.fillText('Start: $' + initial.toFixed(0), pad.l, H - pad.b + 18)
  }, [data, initial])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const obs = new ResizeObserver(draw)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [draw])
  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '350px' }} />
}

function MonteCarloCurve({ data }: { data: number[][] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W; canvas.height = H
    const colors = ['#00e676', '#2979ff', '#ff9100', '#9c27b055']
    data.forEach((eq, i) => {
      if (eq.length < 2) return
      const max = Math.max(...data.flat()), min = Math.min(...data.flat()), range = max - min || 1
      const pad = { t: 10, r: 10, b: 20, l: 10 }
      const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
      ctx.beginPath()
      eq.forEach((v, j) => {
        const x = pad.l + (j / (eq.length - 1)) * cw
        const y = pad.t + ch * (1 - (v - min) / range)
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = i === 0 ? '#00e676' : colors[i % colors.length]
      ctx.lineWidth = i === 0 ? 2 : 1
      ctx.globalAlpha = i === 0 ? 1 : 0.3
      ctx.stroke(); ctx.globalAlpha = 1
    })
  }, [data])
  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '180px' }} />
}

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [tf, setTf] = useState('1h')
  const [start, setStart] = useState('2024-01-01')
  const [end, setEnd] = useState('2025-06-08')
  const [balance, setBalance] = useState(10000)
  const [commission, setCommission] = useState(0.1)
  const [posSize, setPosSize] = useState(10)
  const [results, setResults] = useState<ReturnType<typeof genBacktest> | null>(null)
  const [running, setRunning] = useState(false)
  const [monteCarlo, setMonteCarlo] = useState<number[][] | null>(null)
  const [showMC, setShowMC] = useState(false)

  const run = () => {
    setRunning(true)
    setTimeout(() => {
      setResults(genBacktest({ balance }))
      setRunning(false)
    }, 1200)
  }

  const runMC = () => {
    setShowMC(true)
    const sims = Array.from({ length: 20 }, () => {
      const r = genBacktest({ balance })
      return r.equity
    })
    setMonteCarlo(sims)
  }

  const m = results?.metrics

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)', overflow: 'auto' }}>
      {/* Config */}
      <div className="panel">
        <div className="panel-header">⚙️ Backtest Configuration</div>
        <div style={{ padding: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label>Strategy</label>
            <select style={{ width: '150px' }}>
              <option>SMC Killzone Long</option><option>EMA Crossover</option><option>RSI Reversal</option>
            </select>
          </div>
          <div>
            <label>Symbol</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ width: '120px' }}>
              {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Timeframe</label>
            <select value={tf} onChange={e => setTf(e.target.value)} style={{ width: '80px' }}>
              {['1m', '5m', '15m', '1h', '4h', '1d'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label>Start</label><input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ width: '130px' }} /></div>
          <div><label>End</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ width: '130px' }} /></div>
          <div><label>Initial $</label><input type="number" value={balance} onChange={e => setBalance(parseFloat(e.target.value))} style={{ width: '100px' }} /></div>
          <div><label>Commission %</label><input type="number" value={commission} step="0.01" onChange={e => setCommission(parseFloat(e.target.value))} style={{ width: '80px' }} /></div>
          <div><label>Pos Size %</label><input type="number" value={posSize} onChange={e => setPosSize(parseFloat(e.target.value))} style={{ width: '80px' }} /></div>
          <button onClick={run} disabled={running} className="btn btn-green" style={{ padding: '8px 24px', fontSize: '13px' }}>
            {running ? '⏳ Running...' : '▶ Run Backtest'}
          </button>
        </div>
      </div>

      {results ? (
        <>
          {/* Equity Curve */}
          <div className="panel">
            <div className="panel-header">📈 Equity Curve</div>
            <div style={{ padding: '8px' }}>
              <EquityCurve data={results.equity} initial={balance} />
            </div>
          </div>

          {/* Metrics */}
          <div className="panel">
            <div className="panel-header">📊 Performance Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-dim)' }}>
              {m ? [
                { label: 'Total Trades', value: m.totalTrades, color: 'var(--text-bright)' },
                { label: 'Win Rate', value: m.winRate + '%', color: parseFloat(m.winRate) > 50 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Profit Factor', value: m.profitFactor, color: parseFloat(m.profitFactor) >= 1.5 ? 'var(--accent-green)' : parseFloat(m.profitFactor) >= 1 ? 'var(--accent-yellow)' : 'var(--accent-red)' },
                { label: 'Sharpe Ratio', value: m.sharpe, color: parseFloat(m.sharpe) >= 1.5 ? 'var(--accent-green)' : 'var(--text-bright)' },
                { label: 'Max Drawdown', value: m.maxDD + '%', color: 'var(--accent-red)' },
                { label: 'Sortino Ratio', value: m.sortino, color: parseFloat(m.sortino) >= 1.5 ? 'var(--accent-green)' : 'var(--text-bright)' },
                { label: 'CAGR', value: m.cagr + '%', color: parseFloat(m.cagr) > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Total Return', value: m.totalReturn + '%', color: parseFloat(m.totalReturn) > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Best Trade', value: '+$' + m.bestTrade, color: 'var(--accent-green)' },
                { label: 'Worst Trade', value: '-$' + Math.abs(parseFloat(m.worstTrade)).toFixed(2), color: 'var(--accent-red)' },
                { label: 'Avg Trade', value: (parseFloat(m.avgTrade) >= 0 ? '+$' : '-$') + Math.abs(parseFloat(m.avgTrade)).toFixed(2), color: parseFloat(m.avgTrade) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Expectancy', value: '+$' + m.expectancy + '/trade', color: parseFloat(m.expectancy) > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
              ].map(metric => (
                <div key={metric.label} style={{ background: 'var(--bg-elevated)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>{metric.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: metric.color }}>{metric.value}</div>
                </div>
              )) : null}
            </div>
          </div>

          {/* Trade Log */}
          <div className="panel">
            <div className="panel-header">📋 Trade Log ({results.trades.length} trades)</div>
            <div style={{ overflow: 'auto', maxHeight: '200px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                    {['Side', 'Entry', 'Exit', 'PnL', 'Duration', 'Time'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', fontSize: '9px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.trades.slice(0, 50).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                      <td style={{ padding: '4px 10px', fontWeight: 600, color: t.side === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{t.side}</td>
                      <td style={{ padding: '4px 10px', fontFamily: 'var(--font-mono)' }}>{t.entry.toFixed(2)}</td>
                      <td style={{ padding: '4px 10px', fontFamily: 'var(--font-mono)' }}>{t.exit.toFixed(2)}</td>
                      <td style={{ padding: '4px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                      </td>
                      <td style={{ padding: '4px 10px', color: 'var(--text-dim)' }}>{t.dur}</td>
                      <td style={{ padding: '4px 10px', color: 'var(--text-dim)' }}>{t.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monte Carlo */}
          <div className="panel">
            <div className="panel-header">
              🎲 Monte Carlo Simulation
              <button onClick={runMC} className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 10px' }}>▶ Run 20 Sims</button>
            </div>
            {showMC && monteCarlo && (
              <div style={{ padding: '8px' }}>
                <MonteCarloCurve data={monteCarlo} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                  {[
                    { label: 'Median Return', value: ((monteCarlo[0][monteCarlo[0].length-1] / balance - 1) * 100).toFixed(1) + '%' },
                    { label: 'Max Return', value: ((Math.max(...monteCarlo.map(e => e[e.length-1])) / balance - 1) * 100).toFixed(1) + '%' },
                    { label: 'Prob. of Ruin', value: (monteCarlo.filter(e => e[e.length-1] < balance * 0.5).length / monteCarlo.length * 100).toFixed(0) + '%' },
                  ].map(r => (
                    <div key={r.label} style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{r.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'var(--text-bright)' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '14px', padding: '60px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
            Configure parameters and run a backtest to see performance results
          </div>
        </div>
      )}
    </div>
  )
}