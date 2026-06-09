'use client';
import { useState } from 'react';

export default function SignalsPage() {
  const [form, setForm] = useState({
    symbol: 'SOL/USDC',
    direction: 'BUY',
    entry: '',
    atr14: '',
    nav: '10000',
    riskBudgetPct: '1.0',
    atrStopMult: '2.0',
    targetRMult: '3.0',
    rationale: '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        entry: parseFloat(form.entry),
        atr14: parseFloat(form.atr14) || undefined,
        nav: parseFloat(form.nav),
        riskBudgetPct: parseFloat(form.riskBudgetPct),
        atrStopMult: parseFloat(form.atrStopMult),
        targetRMult: parseFloat(form.targetRMult),
      }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Signal</h1>

      <form onSubmit={submit} className="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Symbol</label>
            <input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Direction</label>
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Entry Price</label>
            <input type="number" step="any" value={form.entry} onChange={e => setForm({ ...form, entry: e.target.value })} required className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ATR (14)</label>
            <input type="number" step="any" placeholder="auto" value={form.atr14} onChange={e => setForm({ ...form, atr14: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">NAV (USD)</label>
            <input type="number" step="any" value={form.nav} onChange={e => setForm({ ...form, nav: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Risk Budget (%)</label>
            <input type="number" step="0.1" value={form.riskBudgetPct} onChange={e => setForm({ ...form, riskBudgetPct: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ATR Stop Mult</label>
            <input type="number" step="0.1" value={form.atrStopMult} onChange={e => setForm({ ...form, atrStopMult: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target R-Mult</label>
            <input type="number" step="0.1" value={form.targetRMult} onChange={e => setForm({ ...form, targetRMult: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">AI Rationale</label>
          <textarea value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })} rows={3} placeholder="Market structure, order flow, news sentiment..." className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white" />
        </div>

        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 transition">
          {loading ? 'Computing...' : 'Generate Signal'}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-[#111118] border border-gray-800 rounded-lg p-4">
          {result.error ? (
            <p className="text-red-400">Error: {result.error}</p>
          ) : (
            <>
              <h3 className="font-semibold mb-2">Signal Created</h3>
              <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                <div><span className="text-gray-400">Stop Loss:</span> {result.sizing?.stopLoss?.toFixed(4)}</div>
                <div><span className="text-gray-400">Take Profit:</span> {result.sizing?.takeProfit?.toFixed(4)}</div>
                <div><span className="text-gray-400">Position Size:</span> ${result.sizing?.sizeUsd?.toFixed(2)}</div>
                <div><span className="text-gray-400">Risk:</span> {result.sizing?.riskPercent}%</div>
                <div><span className="text-gray-400">R-Multiple:</span> {result.sizing?.rMultiple}R</div>
                <div><span className="text-gray-400">Risk USD:</span> ${result.sizing?.riskUsd?.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}