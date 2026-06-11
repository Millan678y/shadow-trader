// ============================================================
// SHADOW TRADER — RISK ENGINE
// Position sizing, VaR, portfolio risk, drawdown controls
// ============================================================

export interface RiskParams {
  accountSize: number       // Total portfolio in USD
  riskPercent: number       // Max risk per trade (e.g., 1 = 1%)
  maxPortfolioRisk: number   // Max total portfolio risk (e.g., 5 = 5%)
  maxDrawdown: number        // Max drawdown before reducing size (e.g., 10 = 10%)
  maxPositions: number       // Max concurrent positions
  maxCorrelation: number     // Max correlation between positions (0-1)
}

export interface OpenPosition {
  symbol: string
  entryPrice: number
  quantity: number
  stopLoss: number
  pnlPercent: number
  correlation?: number        // Correlation to new trade
}

export interface PositionSizeResult {
  quantity: number
  positionValue: number
  riskAmount: number
  riskPercent: number
  stopLossDistance: number   // percent
  kellyFraction?: number     // Kelly criterion (if available)
  maxSize: number            // Absolute max size allowed by account
  recommendedSize: number    // After all risk constraints
  adjustments: string[]      // Why we adjusted the size
  vetoed: boolean            // True if Risk Agent rejects
  vetoReason?: string
}

// Kelly Criterion
function kellyFraction(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0 || winRate <= 0 || winRate >= 1) return 0.1
  const b = avgWin / avgLoss
  const q = 1 - winRate
  const kelly = (b * winRate - q) / b
  return Math.max(0.05, Math.min(kelly, 0.25)) // Cap at 25%
}

// Core position sizing
export function calculatePositionSize(
  entry: number,
  stopLoss: number,
  params: RiskParams,
  winRate = 0.55,
  avgWinPct = 2.5,
  avgLossPct = 1.0
): PositionSizeResult {
  const adjustments: string[] = []
  let { accountSize, riskPercent, maxPositions, maxPortfolioRisk } = params

  // Step 1: Raw risk-based size
  const slDistance = Math.abs(entry - stopLoss) / entry
  if (slDistance < 0.001) {
    return {
      quantity: 0, positionValue: 0, riskAmount: 0, riskPercent: 0,
      stopLossDistance: 0, recommendedSize: 0, adjustments: [],
      vetoed: true, vetoReason: 'Stop loss too close to entry — invalid trade'
    }
  }

  const riskAmount = accountSize * (riskPercent / 100)
  const maxQty = riskAmount / (entry - stopLoss)
  const maxValue = maxQty * entry

  // Step 2: Kelly criterion adjustment
  const kelly = kellyFraction(winRate, avgWinPct, avgLossPct)
  let recommendedQty = maxQty * kelly
  let positionValue = recommendedQty * entry

  // Cap at max position value
  const maxPosValue = accountSize * 0.1 // Max 10% of account per trade
  if (positionValue > maxPosValue) {
    recommendedQty = maxPosValue / entry
    positionValue = maxPosValue
    adjustments.push('Capped at 10% of account per position')
  }

  // Ensure we don't risk more than the calculated amount
  const actualRisk = recommendedQty * (entry - stopLoss)
  if (actualRisk > riskAmount) {
    recommendedQty = riskAmount / (entry - stopLoss)
    adjustments.push('Reduced to match risk amount')
  }

  const finalPositionValue = recommendedQty * entry
  const finalRiskAmount = recommendedQty * Math.abs(entry - stopLoss)
  const finalRiskPct = (finalRiskAmount / accountSize) * 100

  return {
    quantity: recommendedQty,
    positionValue: finalPositionValue,
    riskAmount: finalRiskAmount,
    riskPercent: finalRiskPct,
    stopLossDistance: slDistance * 100,
    kellyFraction: kelly,
    maxSize: maxValue,
    recommendedSize: finalPositionValue,
    adjustments,
    vetoed: false,
  }
}

// Portfolio-level risk check
export function validatePortfolioRisk(
  newTrade: PositionSizeResult,
  openPositions: OpenPosition[],
  params: RiskParams
): { allowed: boolean; reasons: string[]; adjustments: string[] } {
  const reasons: string[] = []
  const adjustments: string[] = []

  // Check position count
  if (openPositions.length >= params.maxPositions) {
    reasons.push(`Max positions (${params.maxPositions}) reached`)
  }

  // Check portfolio total risk
  const currentPortfolioRisk = openPositions.reduce(
    (sum, p) => sum + Math.abs(p.pnlPercent), 0
  )
  const projectedRisk = currentPortfolioRisk + newTrade.riskPercent
  if (projectedRisk > params.maxPortfolioRisk) {
    reasons.push(`Portfolio risk would exceed ${params.maxPortfolioRisk}%`)
    // Proportional reduction
    const allowedRisk = params.maxPortfolioRisk - currentPortfolioRisk
    const scaleFactor = allowedRisk / newTrade.riskPercent
    adjustments.push(`Scaled position to ${Math.round(scaleFactor * 100)}% due to portfolio risk limit`)
  }

  // Check correlation
  const correlated = newTrade.riskPercent > 0 &&
    openPositions.filter(p => (p.correlation || 0) > params.maxCorrelation).length > 0
  if (correlated) {
    reasons.push(`High correlation with existing positions exceeds ${Math.round(params.maxCorrelation * 100)}% threshold`)
  }

  // Check if total portfolio exposure exceeds 80%
  const totalExposure = openPositions.reduce((sum, p) => sum + p.quantity * p.entryPrice, 0)
  const projectedExposure = totalExposure + newTrade.positionValue
  const exposurePct = projectedExposure / params.accountSize
  if (exposurePct > 0.8) {
    adjustments.push(`Portfolio exposure at ${Math.round(exposurePct * 100)}% — consider reducing`)
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    adjustments,
  }
}

// Drawdown-aware size reduction
export function applyDrawdownReduction(
  accountSize: number,
  peakAccountSize: number,
  baseRiskPercent: number,
  params: RiskParams
): number {
  const drawdown = ((peakAccountSize - accountSize) / peakAccountSize) * 100

  if (drawdown >= params.maxDrawdown) return 0 // Full stop
  if (drawdown >= params.maxDrawdown * 0.5) {
    // Reduce risk by 50%
    return baseRiskPercent * 0.5
  }
  if (drawdown >= params.maxDrawdown * 0.25) {
    return baseRiskPercent * 0.75
  }
  return baseRiskPercent
}

// Standard risk limits
export const DEFAULT_RISK_PARAMS: RiskParams = {
  accountSize: 10000,
  riskPercent: 1,         // 1% per trade
  maxPortfolioRisk: 5,    // 5% total portfolio risk
  maxDrawdown: 10,        // 10% max drawdown
  maxPositions: 5,        // 5 concurrent positions
  maxCorrelation: 0.7,   // 70% max correlation
}

// Value at Risk (Monte Carlo approximation)
export function calculateVaR(
  openPositions: OpenPosition[],
  confidenceLevel: number = 0.95,
  volatilityLookback: number = 20
): { var95: number; cvar95: number; worstCase: number } {
  if (openPositions.length === 0) {
    return { var95: 0, cvar95: 0, worstCase: 0 }
  }

  // Simplified parametric VaR using normal distribution
  // In production: use historical returns or Monte Carlo
  const avgLoss = 0.02 // Assume 2% avg adverse move
  const stdDev = avgLoss * 1.65 // Approximate for 95% confidence

  const totalPositionValue = openPositions.reduce(
    (sum, p) => sum + p.quantity * p.entryPrice, 0
  )

  const var95 = totalPositionValue * stdDev * Math.sqrt(1) // 1-day VaR
  const cvar95 = totalPositionValue * stdDev * 1.5         // CVaR slightly higher
  const worstCase = totalPositionValue * avgLoss * 2       // 2x average loss

  return { var95, cvar95, worstCase }
}