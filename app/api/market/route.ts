import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'SOL';
  const interval = req.nextUrl.searchParams.get('interval') || '1h';

  const cacheKey = `market:${symbol}:${interval}`;

  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Simulated market data — real impl uses Binance/pump.fun APIs
  const entry = 180 + Math.random() * 5;
  const atr = entry * 0.025;
  const atrStopMult = 2.0;
  const targetRMult = 3.0;
  const stopLoss = entry - atr * atrStopMult;
  const takeProfit = entry + atr * atrStopMult * targetRMult;

  // Scoring components
  const trendScore = 60 + Math.floor(Math.random() * 30);
  const momentumScore = 55 + Math.floor(Math.random() * 35);
  const riskScore = 65 + Math.floor(Math.random() * 25);
  const newsScore = 50 + Math.floor(Math.random() * 30);
  const structureScore = 60 + Math.floor(Math.random() * 30);
  const orderFlowScore = 55 + Math.floor(Math.random() * 35);
  const totalScore = Math.round((trendScore + momentumScore + riskScore + newsScore + structureScore + orderFlowScore) / 6);

  const direction = totalScore > 65 ? 'BUY' : totalScore < 45 ? 'SELL' : 'NEUTRAL';
  const marketRegime = totalScore > 70 ? 'TRENDING' : totalScore < 40 ? 'RANGE_BOUND' : 'TRANSITIONAL';

  const signal = {
    symbol,
    interval,
    direction,
    entry,
    stopLoss,
    takeProfit,
    atr,
    rMultiple: targetRMult,
    scores: { trendScore, momentumScore, riskScore, newsScore, structureScore, orderFlowScore },
    totalScore,
    marketRegime,
    timestamp: new Date().toISOString(),
  };

  await setCached(cacheKey, signal, 60);
  return NextResponse.json({ signal });
}