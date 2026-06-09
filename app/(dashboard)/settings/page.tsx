'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({ name: 'Millan', email: 'millan@trader.io', timezone: 'America/New_York', language: 'en' })
  const [risk, setRisk] = useState({ dailyLoss: '10', tradeRisk: '2', maxDD: '15', maxPos: '5', varConf: '95' })
  const [notifications, setNotifications] = useState({ email: true, telegram: true, sms: false, trades: true, risk: true, news: false, strategy: true })
  const [appearance, setAppearance] = useState({ theme: 'dark', fontSize: '13', compactMode: false, chartStyle: 'candles' })

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'risk', label: '⚖️ Risk Rules' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'api', label: '🔑 API Keys' },
    { id: 'data', label: '📡 Data Feeds' },
    { id: 'billing', label: '💳 Subscription' },
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Tabs */}
      <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            textAlign: 'left', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? 'rgba(41,121,255,.15)' : 'transparent',
            border: `1px solid ${tab === t.id ? 'var(--accent-blue)' : 'transparent'}`,
            color: tab === t.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {saved && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,230,118,.12)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
            ✅ Settings saved successfully
          </div>
        )}

        {tab === 'profile' && (
          <div className="panel">
            <div className="panel-header">Profile Settings</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{profile.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{profile.email}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-green)', marginTop: '2px' }}>● PRO TRADING PLAN</div>
                </div>
              </div>
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Timezone', key: 'timezone', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label>{f.label}</label>
                  <input type={f.type} value={(profile as any)[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={save} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Profile</button>
            </div>
          </div>
        )}

        {tab === 'risk' && (
          <div className="panel">
            <div className="panel-header">Risk Management Rules</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,23,68,.08)', border: '1px solid var(--accent-red)33', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ⚠️ Risk rules apply across all connected accounts. Changes require confirmation.
              </div>
              {[
                { label: 'Daily Loss Limit (%)', key: 'dailyLoss', note: 'Trading halted when reached' },
                { label: 'Risk Per Trade (%)', key: 'tradeRisk', note: 'Max risk per single position' },
                { label: 'Max Drawdown (%)', key: 'maxDD', note: 'Account-level stop' },
                { label: 'Max Open Positions', key: 'maxPos', note: 'Simultaneous positions limit' },
                { label: 'VaR Confidence (%)', key: 'varConf', note: 'For risk metric calculations' },
              ].map(f => (
                <div key={f.key}>
                  <label>{f.label} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>— {f.note}</span></label>
                  <input type="number" value={(risk as any)[f.key]} onChange={e => setRisk(r => ({ ...r, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={save} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Rules</button>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="panel">
            <div className="panel-header">Notification Preferences</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries({
                email: '📧 Email Alerts',
                telegram: '✈️ Telegram Messages',
                sms: '📱 SMS (Premium)',
                trades: '📊 Trade Notifications',
                risk: '⚠️ Risk Warnings',
                news: '📰 News Alerts',
                strategy: '📋 Strategy Signals',
              }).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid var(--border-dim)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-bright)' }}>{label}</span>
                  <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} style={{
                    width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative',
                    background: (notifications as any)[key] ? 'var(--accent-green)' : 'var(--bg-elevated)',
                    border: `1px solid ${(notifications as any)[key] ? 'var(--accent-green)' : 'var(--border-default)'}`,
                    transition: 'all .2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: '2px', left: (notifications as any)[key] ? '22px' : '2px',
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="panel">
            <div className="panel-header">Appearance</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Theme', options: ['dark', 'midnight', 'light'], key: 'theme' },
                { label: 'Font Size', options: ['11', '12', '13', '14', '15'], key: 'fontSize' },
                { label: 'Chart Style', options: ['candles', 'bars', 'line'], key: 'chartStyle' },
              ].map(f => (
                <div key={f.key}>
                  <label>{f.label}</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {(f.options as string[]).map(opt => (
                      <button key={opt} onClick={() => setAppearance(a => ({ ...a, [f.key]: opt }))} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                        background: (appearance as any)[f.key] === opt ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                        border: `1px solid ${(appearance as any)[f.key] === opt ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                        color: (appearance as any)[f.key] === opt ? '#fff' : 'var(--text-secondary)',
                      }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-bright)' }}>Compact Mode</span>
                <button onClick={() => setAppearance(a => ({ ...a, compactMode: !a.compactMode }))} style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative',
                  background: appearance.compactMode ? 'var(--accent-green)' : 'var(--bg-elevated)',
                  border: `1px solid ${appearance.compactMode ? 'var(--accent-green)' : 'var(--border-default)'}`,
                }}>
                  <div style={{ position: 'absolute', top: '2px', left: appearance.compactMode ? '22px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
              </div>
              <button onClick={save} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Appearance</button>
            </div>
          </div>
        )}

        {tab === 'api' && (
          <div className="panel">
            <div className="panel-header">API Key Management</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Binance', key: 'binance', perms: 'Market Data + Trading' },
                { name: 'CoinGecko', key: 'coingecko', perms: 'Market Data (Read-only)' },
                { name: 'OpenAI', key: 'openai', perms: 'AI Research Assistant' },
              ].map(api => (
                <div key={api.key} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{api.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{api.perms}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '10px', padding: '4px 10px' }}>Edit</button>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', margin: 'auto 0' }} />
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '8px' }}>+ Add API Key</button>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="panel">
            <div className="panel-header">Data Feed Configuration</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Binance', freq: 'Real-time', asset: 'Crypto', status: 'active' },
                { name: 'Yahoo Finance', freq: '15min delay', asset: 'Stocks/Forex', status: 'active' },
                { name: 'ForexFactory', freq: 'Real-time', asset: 'Forex', status: 'active' },
                { name: 'CoinGecko', freq: '1min', asset: 'Crypto Prices', status: 'active' },
              ].map(feed => (
                <div key={feed.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>{feed.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{feed.asset} · {feed.freq}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>{feed.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div className="panel">
            <div className="panel-header">Subscription</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(0,230,118,.12), rgba(41,121,255,.08))', border: '1px solid var(--accent-green)44' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-bright)' }}>PRO PLAN</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Unlimited strategies, backtests, AI research</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '20px', color: 'var(--text-bright)' }}>$0</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent-green)' }}>Free Tier</div>
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }}>Upgrade to Pro ($9.99/mo)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}