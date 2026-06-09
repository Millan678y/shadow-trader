'use client'
import { useState } from 'react'

interface Rule { id: string; logic: 'AND' | 'OR'; indicator: string; compare: string; value: string }
interface Strategy { id: string; name: string; description: string; rules: Rule[]; action: string; params: any; active: boolean }

const INDICATORS = ['RSI', 'MACD', 'EMA20', 'EMA50', 'EMA200', 'Bollinger Bands', 'ATR', 'Volume', 'VWAP', 'Stochastic', 'CCI', 'ADX', 'Price', 'VIX', 'DXY']
const TEMPLATES: Strategy[] = [
  { id: 'tmpl-1', name: 'SMC Killzone Long', description: 'Entry during London/NY killzone with order flow confirmation', rules: [
      { id: 'r1', logic: 'IF', indicator: 'Killzone', compare: '=', value: 'LONDON' },
      { id: 'r2', logic: 'AND', indicator: 'Order Flow', compare: '=', value: 'Delta Positive' },
      { id: 'r3', logic: 'AND', indicator: 'Structure', compare: '=', value: 'Bullish BOS' },
    ], action: 'BUY', params: { positionSize: 10, maxPositions: 2, slType: 'ATR', slValue: 1.5, tpType: 'Fixed R', tpValue: 2 }, active: false },
  { id: 'tmpl-2', name: 'EMA Crossover', description: 'Golden cross entry on EMA20/50 crossover with RSI confirmation', rules: [
      { id: 'r1', logic: 'IF', indicator: 'EMA20', compare: '>', value: 'EMA50' },
      { id: 'r2', logic: 'AND', indicator: 'RSI', compare: '>', value: '50' },
    ], action: 'BUY', params: { positionSize: 15, maxPositions: 3, slType: 'Fixed %', slValue: 2, tpType: 'Trailing', tpValue: 3 }, active: false },
  { id: 'tmpl-3', name: 'RSI Reversal', description: 'Oversold RSI with EMA50 support confluence', rules: [
      { id: 'r1', logic: 'IF', indicator: 'RSI', compare: '<', value: '30' },
      { id: 'r2', logic: 'AND', indicator: 'EMA50', compare: '>', value: 'EMA200' },
    ], action: 'BUY', params: { positionSize: 10, maxPositions: 2, slType: 'ATR', slValue: 2, tpType: 'Fixed R', tpValue: 3 }, active: false },
]

function RuleRow({ rule, onChange, onRemove }: { rule: Rule; onChange: (r: Rule) => void; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
      <select value={rule.logic} onChange={e => onChange({ ...rule, logic: e.target.value })} style={{ width: '60px', fontSize: '11px' }}>
        {rule.id === 'r1' ? null : <option>AND</option>}
        <option>OR</option>
      </select>
      <select value={rule.indicator} onChange={e => onChange({ ...rule, indicator: e.target.value })} style={{ width: '120px', fontSize: '11px' }}>
        {INDICATORS.map(i => <option key={i} value={i}>{i}</option>)}
      </select>
      <select value={rule.compare} onChange={e => onChange({ ...rule, compare: e.target.value })} style={{ width: '60px', fontSize: '11px' }}>
        {['>', '<', '==', '>=', '<='].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} style={{ width: '80px', fontSize: '11px' }} />
      <button onClick={onRemove} style={{ padding: '2px 6px', background: 'rgba(255,23,68,.1)', border: '1px solid var(--accent-red)', borderRadius: '4px', color: 'var(--accent-red)', fontSize: '10px', cursor: 'pointer' }}>✕</button>
    </div>
  )
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>(TEMPLATES.map(t => ({ ...t, id: 's-' + t.id })))
  const [selected, setSelected] = useState<string | null>(strategies[0]?.id || null)
  const [edit, setEdit] = useState<Strategy>(strategies[0])

  const addRule = () => setEdit(e => ({
    ...e, rules: [...e.rules, { id: 'r' + Date.now(), logic: 'AND', indicator: 'RSI', compare: '<', value: '30' }]
  }))

  const updateRule = (r: Rule) => setEdit(e => ({ ...e, rules: e.rules.map(rule => rule.id === r.id ? r : rule) }))
  const removeRule = (id: string) => setEdit(e => ({ ...e, rules: e.rules.filter(r => r.id !== id) }))

  const selectStrategy = (s: Strategy) => { setSelected(s.id); setEdit({ ...s }) }
  const save = () => {
    setStrategies(st => st.map(s => s.id === edit.id ? edit : s))
    if (!strategies.find(s => s.id === edit.id)) setStrategies(st => [...st, edit])
    setSelected(edit.id)
  }
  const toggleActive = () => {
    const updated = { ...edit, active: !edit.active }
    setEdit(updated)
    setStrategies(st => st.map(s => s.id === updated.id ? updated : { ...s, active: false }))
  }
  const clone = () => { setEdit(e => ({ ...e, id: 's-' + Date.now(), name: e.name + ' (Copy)', active: false })) }
  const remove = () => { setStrategies(st => st.filter(s => s.id !== selected)); setSelected(null); setEdit(null as any) }
  const newStrategy = () => {
    const s: Strategy = { id: 's-' + Date.now(), name: 'New Strategy', description: '', rules: [{ id: 'r1', logic: 'IF', indicator: 'RSI', compare: '<', value: '30' }], action: 'BUY', params: { positionSize: 10, maxPositions: 2, slType: 'Fixed %', slValue: 2, tpType: 'Fixed R', tpValue: 2 }, active: false }
    setStrategies(st => [...st, s]); setSelected(s.id); setEdit(s)
  }
  const loadTemplate = (t: Strategy) => {
    const s: Strategy = { ...t, id: 's-' + Date.now(), name: t.name + ' (From Template)', active: false }
    setStrategies(st => [...st, s]); setSelected(s.id); setEdit(s)
  }

  const json = edit ? JSON.stringify({ name: edit.name, rules: edit.rules, action: edit.action, params: edit.params }, null, 2) : ''

  return (
    <div style={{ display: 'flex', gap: '8px', height: 'calc(100vh - var(--topbar-height) - 24px)' }}>
      {/* Left sidebar */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="panel" style={{ flex: 1, overflow: 'auto' }}>
          <div className="panel-header">
            Strategy Library
            <button onClick={newStrategy} style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', background: 'rgba(0,230,118,.1)', border: '1px solid var(--accent-green)', borderRadius: '4px', color: 'var(--accent-green)', cursor: 'pointer' }}>+ New</button>
          </div>
          <div style={{ padding: '4px' }}>
            {strategies.map(s => (
              <div key={s.id} onClick={() => selectStrategy(s)} style={{
                padding: '8px 10px', margin: '2px 0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                background: selected === s.id ? 'rgba(41,121,255,.12)' : 'transparent',
                border: `1px solid ${selected === s.id ? 'var(--accent-blue)' : 'transparent'}`,
                color: s.active ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{s.name}</div>
                {s.active && <span style={{ fontSize: '9px', color: 'var(--accent-green)' }}>● ACTIVE</span>}
                {!s.active && <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{s.rules.length} rules</span>}
              </div>
            ))}
          </div>
        </div>
        {/* Templates */}
        <div className="panel">
          <div className="panel-header">📋 Templates</div>
          <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => loadTemplate(t)} style={{
                textAlign: 'left', padding: '6px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)',
              }}>+ {t.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      {edit ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
          {/* Name + Description */}
          <div className="panel">
            <div className="panel-header">Strategy Details</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>Strategy Name</label>
                <input value={edit.name} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <label>Description</label>
                <textarea value={edit.description} onChange={e => setEdit(s => ({ ...s, description: e.target.value }))} rows={2} />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="panel">
            <div className="panel-header">Condition Rules</div>
            <div style={{ padding: '12px' }}>
              {edit.rules.map(r => (
                <RuleRow key={r.id} rule={r} onChange={updateRule} onRemove={() => removeRule(r.id)} />
              ))}
              <button onClick={addRule} className="btn btn-ghost" style={{ marginTop: '8px', fontSize: '11px' }}>+ Add Rule</button>
            </div>

            {/* Action */}
            <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-dim)', paddingTop: '12px' }}>
              <label>THEN</label>
              <select value={edit.action} onChange={e => setEdit(s => ({ ...s, action: e.target.value }))} style={{ width: '120px' }}>
                <option>BUY</option><option>SELL</option><option>ALERT</option>
              </select>
            </div>
          </div>

          {/* Parameters */}
          <div className="panel">
            <div className="panel-header">Position Parameters</div>
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Position Size (%)', key: 'positionSize', type: 'number' },
                { label: 'Max Positions', key: 'maxPositions', type: 'number' },
                { label: 'Stop Loss Type', key: 'slType', type: 'select', opts: ['Fixed %', 'ATR Multiple'] },
                { label: 'SL Value', key: 'slValue', type: 'number' },
                { label: 'Take Profit Type', key: 'tpType', type: 'select', opts: ['Fixed R', 'Trailing'] },
                { label: 'TP Value', key: 'tpValue', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'select'
                    ? <select value={edit.params[field.key]} onChange={e => setEdit(s => ({ ...s, params: { ...s.params, [field.key]: e.target.value } }))}>
                        {field.opts?.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <input type="number" value={edit.params[field.key]} onChange={e => setEdit(s => ({ ...s, params: { ...s.params, [field.key]: parseFloat(e.target.value) } }))} />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} className="btn btn-primary">💾 Save</button>
            <button onClick={toggleActive} className={edit.active ? 'btn btn-red' : 'btn btn-green'}>
              {edit.active ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <button onClick={clone} className="btn btn-ghost">📋 Clone</button>
            <button onClick={remove} className="btn btn-ghost" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>🗑 Delete</button>
          </div>

          {/* JSON Preview */}
          <div className="panel">
            <div className="panel-header">JSON Preview</div>
            <pre style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)', overflow: 'auto', maxHeight: '200px', margin: 0 }}>
              {json}
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
          Select or create a strategy to begin editing
        </div>
      )}
    </div>
  )
}