// ============================================================
// SHADOW TRADER — 7-FACTOR SIGNAL SCORING ENGINE
// Deterministic, server-side, institutional-grade
// ============================================================

export interface MarketData {
  symbol: string
  price: number
  priceChange24h: number
  volume24h: number
  high24h: number
  low24h: number
  openInterest?: number
  fundingRate?: number
  bidDepth?: number
  askDepth?: number
  cvd?: number           // Cumulative Volume Delta
  liquidations24h?: number
  whaleTransactions?: number
  dexVolume?: number
  tvl?: number
  // OHLCV array [open, high, low, close, volume] per candle
  candles1h?: [number, number, number, number, number][]
  candles4h?: [number, number, number, number, number][]
  // News sentiment score (-100 to +100)
  newsSentiment?: number
  // Macro context
  btcDominance?: number
  btcPrice?: number
  // Solana-specific
  solanaActiveAddresses?: number
  solanaTps?: number
}

export interface SignalFactors {
  marketRegime: number      // 0-100
  trend: number             // 0-100
  momentum: number           // 0-100
  risk: number              // 0-100
  news: number              // 0-100
  structure: number         // 0-100
  orderflow: number         // 0-100
}

export interface GeneratedSignal {
  symbol: string
  direction: 'long' | 'short' | 'neutral'
  totalScore: number        // 0-100
  confidence: number        // 0-100
  factors: SignalFactors
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile'
  sentiment: 'bullish' | 'bearish' | 'neutral'

  entry: number
  stopLoss: number
  takeProfit: number
  riskPercent: number

  timeframe: string
  reasoning: string[]
  warnings: string[]
  timestamp: number
  expiresAt: number
}

// ============================================================
// FACTOR 1: MARKET REGIME DETECTION
// ============================================================
function scoreMarketRegime(data: MarketData): number {
  const { priceChange24h, high24h, low24h, price, fundingRate, openInterest } = data
  if (!high24h || !low24h) return 50

  // ATR-based volatility
  const atr = (high24h - low24h) / price
  const volatility = atr * 100

  // 24h range position (where is price in the range?)
  const rangePos = (price - low24h) / (high24h - low24h || 1)

  // Funding rate signal
  let fundingBias = 50
  if (fundingRate !== undefined) {
    // Extreme funding (>0.05% per 8h = 0.15% daily = danger)
    fundingBias = fundingRate > 0.001 ? 20 : fundingRate < -0.001 ? 80 : 50
  }

  // Open interest analysis
  let oiBias = 50
  if (openInterest !== undefined && priceChange24h !== undefined) {
    if (priceChange24h > 0 && openInterest > 1e8) oiBias = 75 // rising price + high OI = strong
    if (priceChange24h < 0 && openInterest > 1e8) oiBias = 25 // falling price + high OI = danger
  }

  // Volatility scoring
  let regime = 50
  if (volatility > 8) regime = 20      // too volatile
  else if (volatility > 5) regime = 40 // high volatility
  else if (volatility < 2) regime = 70 // low volatility = stable

  // Range position
  if (rangePos > 0.8) regime = Math.max(regime, 85) // near highs = bullish regime
  if (rangePos < 0.2) regime = Math.min(regime, 15)  // near lows = bearish regime

  return Math.round((regime * 0.4 + fundingBias * 0.3 + oiBias * 0.3))
}

// ============================================================
// FACTOR 2: TREND (Multi-Timeframe EMA/SMA)
// ============================================================
function scoreTrend(data: MarketData): number {
  const { candles1h, candles4h, price } = data

  function emaCrossScore(candles: [number,number,number,number,number][] | undefined): number {
    if (!candles || candles.length < 50) return 50
    const closes = candles.map(c => c[3])

    const ema9 = calculateEMA(closes.slice(-9))
    const ema21 = calculateEMA(closes.slice(-21))
    const ema50 = calculateEMA(closes.slice(-50))

    // EMA alignment scoring
    let score = 50
    if (ema9 > ema21 && ema21 > ema50) score = Math.min(95, 60 + (ema9/ema50 - 1) * 200)
    if (ema9 < ema21 && ema21 < ema50) score = Math.max(5, 40 - (ema50/ema9 - 1) * 200)

    // Price vs EMAs
    if (price > ema9 && price > ema21) score = Math.min(100, score + 10)
    if (price < ema9 && price < ema21) score = Math.max(0, score - 10)

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  const score1h = emaCrossScore(candles1h)
  const score4h = emaCrossScore(candles4h)

  // 4H has more weight for swing trades
  return Math.round(score1h * 0.35 + score4h * 0.65)
}

function calculateEMA(closes: number[], period: number = 9): number {
  if (closes.length < period) return closes[closes.length - 1] || 0
  const k = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
  }
  return ema
}

// ============================================================
// FACTOR 3: MOMENTUM (RSI, MACD)
// ============================================================
function scoreMomentum(data: MarketData): number {
  const { candles1h, candles4h, priceChange24h } = data

  function rsi(candles: [number,number,number,number,number][]): number {
    if (candles.length < 14) return 50
    const closes = candles.map(c => c[3])
    const changes = closes.slice(1).map((c, i) => c - closes[i])
    const gains = changes.map(c => Math.max(0, c))
    const losses = changes.map(c => Math.abs(Math.min(0, c)))
    const avgGain = gains.slice(-14).reduce((a,b) => a+b, 0) / 14
    const avgLoss = losses.slice(-14).reduce((a,b) => a+b, 0) / 14
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return Math.round(100 - (100 / (1 + rs)))
  }

  function macdSignal(candles: [number,number,number,number,number][]): number {
    if (candles.length < 26) return 50
    const closes = candles.map(c => c[3])
    const ema12 = calculateEMA(closes.slice(-12), 12)
    const ema26 = calculateEMA(closes.slice(-26), 26)
    const macd = ema12 - ema26
    const signal = calculateEMA([macd], 9)
    // Normalize to 0-100
    const val = macd > signal ? Math.min((macd / signal) * 60 + 50, 100) : Math.max(50 - (signal / macd) * 50, 0)
    return Math.round(val)
  }

  let score = 50
  if (candles4h && candles4h.length >= 26) {
    const rsiVal = rsi(candles4h)
    const macdVal = macdSignal(candles4h)
    score = Math.round(rsiVal * 0.5 + macdVal * 0.5)
  }
  if (candles1h && candles1h.length >= 14) {
    const rsiH = rsi(candles1h)
    score = Math.round(score * 0.6 + rsiH * 0.4)
  }

  // 24h momentum bias
  if (priceChange24h !== undefined) {
    if (priceChange24h > 10) score = Math.min(100, score + 8)
    if (priceChange24h > 5) score = Math.min(100, score + 4)
    if (priceChange24h < -10) score = Math.max(0, score - 8)
    if (priceChange24h < -5) score = Math.max(0, score - 4)
  }

  return Math.min(100, Math.max(0, score))
}

// ============================================================
// FACTOR 4: RISK SCORE (VaR, Correlation, Portfolio Impact)
// ============================================================
function scoreRisk(data: MarketData): number {
  const { price, high24h, low24h, liquidations24h, bidDepth, askDepth } = data

  let score = 70 // Baseline acceptable risk

  // ATR-based drawdown estimate
  if (high24h && low24h && price) {
    const dailyRange = (high24h - low24h) / price
    if (dailyRange > 0.08) score -= 25  // >8% daily range = high risk
    else if (dailyRange > 0.05) score -= 15
    else if (dailyRange < 0.02) score += 10  // calm = lower risk
  }

  // Liquidation cascade risk
  if (liquidations24h !== undefined) {
    if (liquidations24h > price * 1e6 * 0.02) score -= 20 // >2% of market cap liquidated
    if (liquidations24h > price * 1e6 * 0.05) score -= 25
  }

  // Order book imbalance
  if (bidDepth !== undefined && askDepth !== undefined) {
    const imbalance = (bidDepth - askDepth) / (bidDepth + askDepth + 1)
    if (imbalance < -0.3) score -= 15  // Heavy sell wall
    if (imbalance > 0.3) score += 5   // Bullish order book
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ============================================================
// FACTOR 5: NEWS SENTIMENT
// ============================================================
function scoreNews(data: MarketData): number {
  const sentiment = data.newsSentiment ?? 0  // -100 to +100

  // Convert -100..+100 to 0..100
  return Math.round((sentiment + 100) / 2)
}

// ============================================================
// FACTOR 6: STRUCTURE (OB, FVG, Liquidity Zones)
// ============================================================
function scoreStructure(data: MarketData): number {
  const { candles4h, price, high24h, low24h } = data
  if (!candles4h || candles4h.length < 20 || !price) return 50

  const closes = candles4h.map(c => c[3])
  const highs = candles4h.map(c => c[1])
  const lows = candles4h.map(c => c[2])

  let score = 50

  // Fair Value Gap detection (last 5 candles)
  for (let i = closes.length - 5; i < closes.length - 1; i++) {
    if (candles4h[i+1]) {
      const gap = candles4h[i+1][2] > candles4h[i][1] ? 'up'  // Bullish FVG
                : candles4h[i+1][1] < candles4h[i][2] ? 'down'  // Bearish FVG
                : null
      if (gap === 'up' && price < candles4h[i+1][2]) score += 8  // Price could fill bullish FVG
      if (gap === 'down' && price > candles4h[i+1][1]) score -= 8
    }
  }

  // 24h High/Low structure
  if (high24h && low24h) {
    const distToHigh = (high24h - price) / price
    const distToLow = (price - low24h) / price
    if (distToHigh < 0.02) score -= 15 // Near 24h high = breakout or reversal
    if (distToLow < 0.02) score += 10  // Near 24h low = potential bounce
  }

  // Swing high/low detection
  const recentHighs = highs.slice(-20)
  const recentLows = lows.slice(-20)
  const localHigh = Math.max(...recentHighs.slice(-10))
  const localLow = Math.min(...recentLows.slice(-10))
  const rangeSize = localHigh - localLow

  if (rangeSize > 0) {
    const priceInRange = (price - localLow) / rangeSize
    if (priceInRange > 0.85) score += 10  // Near top of range = bullish
    if (priceInRange < 0.15) score -= 10  // Near bottom = bullish reversal potential
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ============================================================
// FACTOR 7: ORDER FLOW (Whale Accumulation, CEX/DEX flows)
// ============================================================
function scoreOrderFlow(data: MarketData): number {
  const { cvd, dexVolume, solanaActiveAddresses, whaleTransactions, bidDepth, askDepth } = data

  let score = 50

  // CVD (Cumulative Volume Delta)
  if (cvd !== undefined) {
    if (cvd > 1e6) score += 20
    else if (cvd < -1e6) score -= 20
    else score += Math.round(cvd / 1e5) // Scale
  }

  // DEX volume
  if (dexVolume !== undefined) {
    if (dexVolume > 1e8) score += 15  // High DEX activity
    if (dexVolume < 1e7) score -= 10  // Low DEX activity
  }

  // Active addresses growth
  if (solanaActiveAddresses !== undefined) {
    if (solanaActiveAddresses > 50000) score += 10
    if (solanaActiveAddresses > 100000) score += 10
  }

  // Whale transaction volume
  if (whaleTransactions !== undefined) {
    if (whaleTransactions > 10) score += 10
    if (whaleTransactions > 20) score += 10
  }

  // Bid/Ask depth strength
  if (bidDepth !== undefined && askDepth !== undefined) {
    const depthRatio = bidDepth / (askDepth + 1)
    if (depthRatio > 1.5) score += 10
    if (depthRatio < 0.67) score -= 10
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ============================================================
// MAIN SIGNAL GENERATOR
// ============================================================
export function generateSignal(data: MarketData): GeneratedSignal {
  const factors: SignalFactors = {
    marketRegime: scoreMarketRegime(data),
    trend: scoreTrend(data),
    momentum: scoreMomentum(data),
    risk: scoreRisk(data),
    news: scoreNews(data),
    structure: scoreStructure(data),
    orderflow: scoreOrderFlow(data),
  }

  // Weighted total score
  const weights = {
    marketRegime: 0.20,
    trend: 0.18,
    momentum: 0.15,
    risk: 0.17,
    news: 0.10,
    structure: 0.10,
    orderflow: 0.10,
  }

  const totalScore = Math.round(
    factors.marketRegime * weights.marketRegime +
    factors.trend * weights.trend +
    factors.momentum * weights.momentum +
    factors.risk * weights.risk +
    factors.news * weights.news +
    factors.structure * weights.structure +
    factors.orderflow * weights.orderflow
  )

  // Regime detection
  const regime: GeneratedSignal['regime'] =
    factors.marketRegime >= 70 ? 'trending_up' :
    factors.marketRegime <= 30 ? 'trending_down' :
    factors.marketRegime > 45 ? 'ranging' : 'volatile'

  // Direction: combine sentiment + momentum + trend
  let dirScore = 0
  dirScore += factors.trend > 55 ? 1 : factors.trend < 45 ? -1 : 0
  dirScore += factors.momentum > 55 ? 1 : factors.momentum < 45 ? -1 : 0
  dirScore += factors.orderflow > 55 ? 1 : factors.orderflow < 45 ? -1 : 0
  dirScore += factors.structure > 55 ? 1 : factors.structure < 45 ? -1 : 0

  const direction: GeneratedSignal['direction'] =
    dirScore >= 2 ? 'long' : dirScore <= -2 ? 'short' : 'neutral'

  const sentiment: GeneratedSignal['sentiment'] =
    direction === 'long' ? 'bullish' : direction === 'short' ? 'bearish' : 'neutral'

  // Entry, Stop Loss, Take Profit
  const price = data.price
  const atrPct = ((data.high24h || price) - (data.low24h || price)) / price * 100

  // Dynamic SL/TP based on ATR
  const slDist = Math.max(atrPct * 1.2, 2) // minimum 2% stop
  const tpDist = slDist * 2.5              // 2.5:1 R:R

  let entry = price
  let stopLoss = direction === 'long' ? price * (1 - slDist/100)
              : direction === 'short' ? price * (1 + slDist/100)
              : price
  let takeProfit = direction === 'long' ? price * (1 + tpDist/100)
                 : direction === 'short' ? price * (1 - tpDist/100)
                 : price

  // Risk 1% per trade
  const riskPercent = 1

  // Confidence = how strongly all factors agree
  const confidence = Math.min(100, Math.round(
    (Math.abs(dirScore) / 4) * 40 +
    (totalScore / 100) * 40 +
    (factors.risk > 50 ? 20 : factors.risk / 100 * 20)
  ))

  // Build reasoning
  const reasoning: string[] = []
  if (factors.trend > 70) reasoning.push(`Strong uptrend: EMA 9/21/50 alignedbullishly (score ${factors.trend})`)
  if (factors.trend < 30) reasoning.push(`Bearish trend: price below key moving averages (score ${factors.trend})`)
  if (factors.momentum > 70) reasoning.push(`Momentum is strong: RSI ${factors.momentum > 80 ? 'overbought but bullish' : 'favorable'}, MACD bullish`)
  if (factors.orderflow > 70) reasoning.push(`Whale accumulation detected: CVD positive, high DEX volume (score ${factors.orderflow})`)
  if (factors.risk < 40) reasoning.push(`⚠️ Risk elevated: wide daily range or high liquidations (score ${factors.risk})`)
  if (factors.news > 70) reasoning.push(`Bullish news sentiment driving market (score ${factors.news})`)
  if (factors.structure > 70) reasoning.push(`Bullish structure: breaking above local resistance, FVG unfilled`)
  if (factors.marketRegime > 70) reasoning.push(`Market regime favorable: strong trend environment (score ${factors.marketRegime})`)

  const warnings: string[] = []
  if (factors.risk < 30) warnings.push('HIGH RISK: Elevated liquidation cascade risk')
  if (factors.marketRegime < 25) warnings.push('MARKET REGIME: Sideways/volatile — signals less reliable')
  if (factors.confidence < 60 && totalScore > 75) warnings.push('Score is high but confidence low — factors disagree')

  const now = Date.now()

  return {
    symbol: data.symbol,
    direction,
    totalScore,
    confidence,
    factors,
    regime,
    sentiment,
    entry,
    stopLoss,
    takeProfit,
    riskPercent,
    timeframe: '4H',
    reasoning,
    warnings,
    timestamp: now,
    expiresAt: now + 4 * 60 * 60 * 1000, // 4 hours
  }
}

// ============================================================
// SIGNAL CLASSIFICATION
// ============================================================
export function classifySignal(signal: GeneratedSignal): {
  classification: string
  color: string
  action: string
} {
  if (signal.totalScore >= 90) return { classification: 'STRONG CONVICTION', color: '#00c853', action: 'Full size allocation' }
  if (signal.totalScore >= 75) return { classification: 'HIGH CONVICTION', color: '#00e676', action: 'Normal size' }
  if (signal.totalScore >= 60) return { classification: 'MODERATE', color: '#f59e0b', action: 'Half size, tight SL' }
  return { classification: 'REJECT', color: '#ef4444', action: 'Do not enter' }
}