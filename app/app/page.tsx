'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AppDashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/signals')
      .then(r => r.json())
      .then(d => { setSignals(d.signals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const open = signals.filter(s => s.status === 'open').length;
  const closed = signals.filter(s => s.status === 'closed').length;
  const winRate = closed > 0
    ? Math.round((signals.filter(s => s.realized_pnl_pct > 0).length / closed) * 100)
    : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111118] border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Open Positions</p>
          <p className="text-3xl font-bold text-blue-400">{open}</p>
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Closed Trades</p>
          <p className="text-3xl font-bold text-gray-200">{closed}</p>
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-3xl font-bold text-green-400">{winRate}%</p>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <Link href="/app/signals" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition text-sm">
          + New Signal
        </Link>
        <Link href="/app/terminal" className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition text-sm">
          Open Terminal
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : signals.length === 0 ? (
        <p className="text-gray-500">No signals yet. Create your first signal to get started.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2">Symbol</th>
              <th className="text-left py-2">Direction</th>
              <th className="text-left py-2">Entry</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">R-Mult</th>
            </tr>
          </thead>
          <tbody>
            {signals.slice(0, 10).map(s => (
              <tr key={s.id} className="border-b border-gray-900 hover:bg-gray-900/50">
                <td className="py-2 font-mono">{s.symbol}</td>
                <td className={`py-2 ${s.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{s.direction}</td>
                <td className="py-2 font-mono">{s.entry?.toFixed(4)}</td>
                <td className="py-2 text-gray-400">{s.status}</td>
                <td className={`py-2 ${(s.r_multiple || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {s.r_multiple ? `${s.r_multiple.toFixed(1)}R` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}