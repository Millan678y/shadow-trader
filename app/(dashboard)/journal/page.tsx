'use client'
import { useState } from 'react'

const MOODS = ['disciplined', 'neutral', 'revenge', 'fear', 'greedy', 'fomo']
const TAGS = ['scalp', 'swing', 'killzone', 'setup', 'mistake', 'lesson', 'pattern', 'RSI', 'EMA', 'macro']

const DEMO_ENTRIES = [
  { id: '1', title: 'Good London killzone scalp', content: 'Entered long on BTC at 62100 during London killzone. Order flow showed positive delta. Exited at 62800 for +$35. Sticking to the plan next time.', tags: ['scalp', 'killzone', 'london'], mood: 'disciplined', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', title: 'Revenge trade after SOL loss', content: 'Took a large SOL long immediately after a loss to "make it back". Ended up losing more. Need to enforce the 30-minute cooling-off rule.', tags: ['mistake', 'revenge'], mood: 'revenge', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', title: 'Pattern: RSI < 30 + EMA50 support = high win rate', content: 'Reviewed last 20 trades using RSI < 30 at EMA50 support. 75% win rate on this setup. Need to add this to primary strategies.', tags: ['lesson', 'pattern', 'RSI'], mood: 'disciplined', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', title: 'Ignored stop loss — revenge trading', content: 'Moved stop loss 3 times after being stopped out. The position eventually came back but this is a dangerous pattern. Set hard rules: no moving SL after initial placement.', tags: ['mistake'], mood: 'fear', created_at: new Date(Date.now() - 172800000).toISOString() },
]

const PATTERN_DETECTION = {
  winRate: '62%',
  avgWin: '$48',
  avgLoss: '-$28',
  bestSetup: 'RSI < 30 + Killzone',
  worstMistake: 'Overtrading in low-VIX',
  streak: { current: 3, type: 'win' },
}

function MoodBadge({ mood }: { mood: string }) {
  const colors: Record<string, string> = { disciplined: 'var(--accent-green)', neutral: 'var(--text-dim)', revenge: 'var(--accent-red)', fear: 'var(--accent-orange)', greedy: 'var(--accent-yellow)', fomo: 'var(--accent-purple)' }
  return <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: colors[mood] + '22', color: colors[mood], textTransform: 'uppercase' }}>{mood}</span>
}

export default function JournalPage() {
  const [entries, setEntries] = useState(DEMO_ENTRIES)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ title: '', content: '', tags: [] as string[], mood: 'neutral' })
  const [search, setSearch] = useState('')

  const addEntry = () => {
    if (!form.title || !form.content) return
    const e = { id: Date.now().toString(), ...form, created_at: new Date().toISOString() }
    setEntries([e, ...entries])
    setForm({ title: '', content: '', tags: [], mood: 'neutral' })
    setShowForm(false)
  }

  const toggleTag = (tag: string) => setForm(f => ({
    ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
  }))

  const filtered = entries.filter(e => {
    if (filter !== 'All' && e.mood !== filter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.content.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ display: 'flex', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Left: entries list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input placeholder="Search journal..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: '130px' }}>
            <option>All</option>
            {MOODS.map(m => <option key={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="btn btn-green" style={{ whiteSpace: 'nowrap' }}>+ New Entry</button>
        </div>

        {/* Entry form */}
        {showForm && (
          <div className="panel">
            <div className="panel-header">New Journal Entry</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What happened?" /></div>
              <div><label>Content</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Describe the trade, your reasoning, emotions, and lessons..." /></div>
              <div>
                <label>Mood</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, mood: m }))} style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                      background: form.mood === m ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.mood === m ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                      color: form.mood === m ? '#fff' : 'var(--text-secondary)',
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label>Tags</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(t)} style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer',
                      background: form.tags.includes(t) ? 'rgba(41,121,255,.2)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.tags.includes(t) ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                      color: form.tags.includes(t) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={addEntry} className="btn btn-green">💾 Save Entry</button>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Entries */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(e => (
            <div key={e.id} className="panel" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '13px' }}>{e.title}</div>
                <MoodBadge mood={e.mood} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{e.content}</p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {e.tags.map(t => (
                  <span key={t} style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '9px', background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}>#{t}</span>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                {new Date(e.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '13px' }}>
              No entries match your search
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {/* Stats */}
        <div className="panel">
          <div className="panel-header">📊 Journal Stats</div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Total Entries', value: '47' },
              { label: 'Win Rate from Journal', value: PATTERN_DETECTION.winRate },
              { label: 'Avg Win', value: PATTERN_DETECTION.avgWin },
              { label: 'Avg Loss', value: PATTERN_DETECTION.avgLoss },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-dim)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-bright)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Detection */}
        <div className="panel">
          <div className="panel-header">🔍 AI Pattern Detection</div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Best Setup</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>{PATTERN_DETECTION.bestSetup}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>75% win rate historically</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Worst Mistake</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-red)' }}>{PATTERN_DETECTION.worstMistake}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>Loses 68% of the time</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Streak</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-green)' }}>{PATTERN_DETECTION.streak.current}x</div>
              <div style={{ fontSize: '9px', color: 'var(--accent-green)' }}>{PATTERN_DETECTION.streak.type.toUpperCase()} STREAK</div>
            </div>
          </div>
        </div>

        {/* Mood distribution */}
        <div className="panel">
          <div className="panel-header">🧠 Mood Distribution</div>
          <div style={{ padding: '8px' }}>
            {MOODS.map(m => {
              const count = entries.filter(e => e.mood === m).length
              const pct = entries.length > 0 ? (count / entries.length * 100) : 0
              return (
                <div key={m} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--text-dim)', textTransform: 'capitalize' }}>{m}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-blue)', borderRadius: '2px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}