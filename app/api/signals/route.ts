import { NextRequest, NextResponse } from 'next/server'
import { generateSignal, classifySignal } from '@/lib/signals'
import { calculatePositionSize, validatePortfolioRisk, DEFAULT_RISK_PARAMS } from '@/lib/risk'
import { getSessionFromRequest } from '@/lib/auth'
import { getCached, setCached } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'SOL'
  const cacheKey = `signal:${symbol}:4h`

  // Try cache first (5 minute TTL)
  const cached = await getCached<ReturnType<typeof generateSignal>>(cacheKey)
  if (cached) {
    const cls = classifySignal(cached)
    return NextResponse.json({ ...cached, classification: cls.classification, classificationColor: cls.color })
  }

  // Generate signal using market data
  // In production: fetch real OHLCV from Binance/pump.fun
  const mockData = {
    symbol,
    price: 182.45 + Math.random() * 5,
    priceChange24h: 4.2,
    volume24h: 3.2e9,
    high24h: 186.50,
    low24h: 175.20,
    openInterest: 8.5e8,
    fundingRate: 0.0001,
    bidDepth: 1.2e6,
    askDepth: 0.9e6,
    cvd: 5e5,
    liquidations24h: 2.1e6,
    whaleTransactions: 12,
    dexVolume: 2.1e8,
    tvl: 4.2e9,
    candles1h: Array.from({ length: 50 }, (_, i) => [
      180 + Math.random() * 5,
      183 + Math.random() * 5,
      179 + Math.random() * 5,
      181 + Math.random() * 5,
      1e6 + Math.random() * 5e6,
    ] as [number, number, number, number, number]),
    candles4h: Array.from({ length: 50 }, (_, i) => [
      178 + Math.random() * 8,
      185 + Math.random() * 8,
      176 + Math.random() * 8,
      181 + Math.random() * 8,
      5e6 + Math.random() * 20e6,
    ] as [number, number, number, number, number]),
    newsSentiment: 35,
    btcDominance: 52.3,
    solanaActiveAddresses: 85000,
  }

  const signal = generateSignal(mockData)
  const cls = classifySignal(signal)

  // Cache for 5 minutes
  await setCached(cacheKey, signal, { ex: 300 })

  return NextResponse.json({
    ...signal,
    classification: cls.classification,
    classificationColor: cls.color,
    action: cls.action,
  })
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { symbol, direction, entry, stopLoss, takeProfit, riskPercent = 1 } = body

  if (!symbol || !direction || !entry || !stopLoss) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Calculate position size
  const position = calculatePositionSize(entry, stopLoss, {
    ...DEFAULT_RISK_PARAMS,
    riskPercent,
  })

  if (position.vetoed) {
    return NextResponse.json({ signal: position, approved: false }, { status: 200 })
  }

  return NextResponse.json({
    signal: position,
    approved: true,
    direction,
    symbol,
    entry,
    stopLoss,
    takeProfit,
  })
}