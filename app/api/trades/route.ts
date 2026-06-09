import { NextResponse } from 'next/server'

// In-memory demo trades store
const trades = [
  { id: '1', symbol: 'BTCUSDT', side: 'LONG', entry_price: 62100, exit_price: 62800, qty: 0.01, pnl: 7.00, commission: 0.62, timestamp: new Date(Date.now() - 3600000).toISOString(), strategy: 'SMC Killzone', tf: '15m', status: 'closed' },
  { id: '2', symbol: 'ETHUSDT', side: 'SHORT', entry_price: 3520, exit_price: 3480, qty: 0.5, pnl: 20.00, commission: 1.76, timestamp: new Date(Date.now() - 7200000).toISOString(), strategy: 'EMA Crossover', tf: '1h', status: 'closed' },
  { id: '3', symbol: 'BTCUSDT', side: 'LONG', entry_price: 61800, exit_price: 62200, qty: 0.02, pnl: 8.00, commission: 1.24, timestamp: new Date(Date.now() - 10800000).toISOString(), strategy: 'RSI Reversal', tf: '4h', status: 'closed' },
  { id: '4', symbol: 'SOLUSDT', side: 'LONG', entry_price: 145.00, exit_price: 143.50, qty: 10, pnl: -7.50, commission: 1.45, timestamp: new Date(Date.now() - 14400000).toISOString(), strategy: 'SMC Killzone', tf: '15m', status: 'closed' },
  { id: '5', symbol: 'BTCUSDT', side: 'LONG', entry_price: 61000, exit_price: null, qty: 0.015, pnl: null, commission: 0.00, timestamp: new Date(Date.now() - 18000000).toISOString(), strategy: 'SMC Killzone', tf: '1h', status: 'open' },
]

export async function GET() {
  return NextResponse.json({ trades, total: trades.length })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const trade = {
      id: Date.now().toString(),
      ...body,
      commission: 0,
      timestamp: new Date().toISOString(),
      status: 'open',
    }
    trades.unshift(trade)
    return NextResponse.json({ success: true, trade }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid trade data' }, { status: 400 })
  }
}