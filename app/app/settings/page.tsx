'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [keys, setKeys] = useState({ supabaseUrl: '', supabaseKey: '', vercelToken: '' });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">API Keys</h2>
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Supabase URL</label>
            <input type="password" value={keys.supabaseUrl} onChange={e => setKeys({ ...keys, supabaseUrl: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm" placeholder="https://xxxx.supabase.co" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Supabase Anon Key</label>
            <input type="password" value={keys.supabaseKey} onChange={e => setKeys({ ...keys, supabaseKey: e.target.value })} className="w-full bg-[#111118] border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm" placeholder="eyJ..." />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">Risk Rules</h2>
        <div className="max-w-lg space-y-3">
          <div className="flex items-center justify-between bg-[#111118] border border-gray-800 rounded px-4 py-3">
            <span className="text-sm">Max Risk per Trade</span>
            <span className="font-mono text-blue-400">2.0%</span>
          </div>
          <div className="flex items-center justify-between bg-[#111118] border border-gray-800 rounded px-4 py-3">
            <span className="text-sm">Daily Drawdown Cap</span>
            <span className="font-mono text-blue-400">10.0%</span>
          </div>
          <div className="flex items-center justify-between bg-[#111118] border border-gray-800 rounded px-4 py-3">
            <span className="text-sm">Max Trades / 24h</span>
            <span className="font-mono text-blue-400">5</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Risk rules are enforced server-side. LLM cannot override position sizing.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">Subscription</h2>
        <div className="bg-[#111118] border border-gray-800 rounded p-4 max-w-sm">
          <p className="text-gray-400 text-sm mb-1">Current Plan</p>
          <p className="text-xl font-bold text-yellow-400">Free Trial</p>
          <p className="text-xs text-gray-500 mt-1">3 signals remaining</p>
        </div>
      </section>
    </div>
  );
}