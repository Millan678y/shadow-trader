interface RiskInputs {
  entryPrice: number;
  direction: 'BUY' | 'SELL';
  atr14: number;
  nav: number;
  riskBudgetPct: number;
  atrStopMult: number;
  targetRMult: number;
}

interface SizingResult {
  stopDistance: number;
  riskUsd: number;
  sizeUsd: number;
  stopLoss: number;
  takeProfit: number;
  rMultiple: number;
  riskPercent: number;
  units: number;
}

/**
 * Server-side deterministic position sizing.
 * THE LLM IS RESPONSIBLE ONLY FOR: direction, entry zone, rationale.
 * ALL MONEY MATH IS COMPUTED HERE — deterministic, auditable, explainable.
 */
export function computePositionSizing(inputs: RiskInputs): SizingResult {
  const { entryPrice, direction, atr14, nav, riskBudgetPct, atrStopMult, targetRMult } = inputs;

  const stopDistance = atr14 * atrStopMult;
  const riskUsd = nav * (riskBudgetPct / 100);
  const sizeUsd = riskUsd / stopDistance * entryPrice;

  const stopLoss = direction === 'BUY'
    ? entryPrice - stopDistance
    : entryPrice + stopDistance;

  const takeProfit = direction === 'BUY'
    ? entryPrice + stopDistance * targetRMult
    : entryPrice - stopDistance * targetRMult;

  const rMultiple = targetRMult;
  const riskPercent = riskBudgetPct;
  const units = sizeUsd / entryPrice;

  return {
    stopDistance,
    riskUsd,
    sizeUsd,
    stopLoss,
    takeProfit,
    rMultiple,
    riskPercent,
    units,
  };
}

/**
 * Validate that a signal meets minimum risk criteria before persisting.
 * Returns { valid: boolean, reason?: string }
 */
export function validateSignalRisk(sizing: SizingResult): { valid: boolean; reason?: string } {
  if (sizing.riskPercent < 0.25) return { valid: false, reason: 'Risk below minimum 0.25%' };
  if (sizing.riskPercent > 5.0) return { valid: false, reason: 'Risk above maximum 5.0%' };
  if (sizing.rMultiple < 0.5) return { valid: false, reason: 'R-multiple below minimum 0.5' };
  if (sizing.stopDistance <= 0) return { valid: false, reason: 'Stop distance must be > 0' };
  if (sizing.sizeUsd <= 0) return { valid: false, reason: 'Position size must be > 0' };
  return { valid: true };
}
