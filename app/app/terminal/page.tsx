'use client';
import { useState } from 'react';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('SOL');
  const [timeframe, setTimeframe] = useState('1h');
  const [marketRegime, setMarketRegime] = useState('');
  const [signalScore, setSignalScore] = useState(0);
  const [generatedSignal, setGeneratedSignal] = useState<any>(null);

  const generateSignal = async () => {
    const res = await fetch(`/api/market?symbol=${symbol}&interval=${timeframe}`);
    const data = await res.json();
    if (data.signal) {
      setGeneratedSignal(data.signal);
      setSignalScore(data.signal.totalScore || 0);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trading Terminal</h1>

      <div className="flex gap-3 mb-6">
        <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="SOL" className="bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono w-24" />
        <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white">
          {['1m','5m','15m','1h','4h','1d'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={generateSignal} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition">
          Analyze
        </button>
      </div>

      {generatedSignal && (
        <div className="bg-[#111118] border border-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-mono">{symbol}/USDC</span>
            <div className="text-right">
              <div className={`text-3xl font-bold ${generatedSignal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {generatedSignal.direction}
              </div>
              <div className="text-gray-400 text-sm">Score: {signalScore}/100</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm font-mono">
            <div><span className="text-gray-400">Entry</span><br/>{generatedSignal.entry?.toFixed(4)}</div>
            <div><span className="text-gray-400">Stop Loss</span><br/>{generatedSignal.stopLoss?.toFixed(4)}</div>
            <div><span className="text-gray-400">Take Profit</span><br/>{generatedSignal.takeProfit?.toFixed(4)}</div>
            <div><span className="text-gray-400">R-Mult</span><br/>{generatedSignal.rMultiple || '—'}</div>
          </div>

          {generatedSignal.scores && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-400 mb-2">Signal Breakdown</p>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {Object.entries(generatedSignal.scores).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-[#1a1a24] rounded p-2 text-center">
                    <div className="text-gray-400 uppercase">{key}</div>
                    <div className="text-lg font-bold">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}