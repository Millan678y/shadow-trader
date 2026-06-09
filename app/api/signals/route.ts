import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { computePositionSizing, validateSignalRisk } from '@/lib/risk';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const { valid, userId } = token ? await verifySession(token) : { valid: false, userId: undefined };

  if (!valid || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('signals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ signals: data });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const { valid, userId } = token ? await verifySession(token) : { valid: false, userId: undefined };

  if (!valid || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { symbol, direction, entry, atr14, nav, riskBudgetPct, atrStopMult, targetRMult, rationale, modelName } = body;

  const sizing = computePositionSizing({
    entryPrice: entry,
    direction,
    atr14: atr14 || entry * 0.02,
    nav: nav || 10000,
    riskBudgetPct: riskBudgetPct || 1.0,
    atrStopMult: atrStopMult || 2.0,
    targetRMult: targetRMult || 3.0,
  });

  const riskCheck = validateSignalRisk(sizing);
  if (!riskCheck.valid) {
    return NextResponse.json({ error: riskCheck.reason }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('signals')
    .insert({
      user_id: userId,
      symbol,
      interval: '1h',
      direction,
      entry,
      stop_loss: sizing.stopLoss,
      take_profit: sizing.takeProfit,
      r_multiple: sizing.rMultiple,
      position_size_usd: sizing.sizeUsd,
      risk_budget_pct: sizing.riskPercent,
      atr_stop_mult: atrStopMult,
      rationale,
      model_name: modelName,
      status: 'open',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signal: data, sizing }, { status: 201 });
}