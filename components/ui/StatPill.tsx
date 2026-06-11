'use client'

interface StatPillProps {
  label: string
  value: string | number
  change?: number
  prefix?: string
  suffix?: string
  color?: 'green' | 'red' | 'blue' | 'yellow'
}

export function StatPill({ label, value, change, prefix = '', suffix = '', color = 'green' }: StatPillProps) {
  const colorMap = {
    green: '#22C55E',
    red: '#EF4444',
    blue: '#3B82F6',
    yellow: '#F59E0B',
  }

  const displayValue = typeof value === 'number' 
    ? `${prefix}${value.toLocaleString()}${suffix}`
    : `${prefix}${value}${suffix}`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        minWidth: 120,
      }}
    >
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>
        {displayValue}
      </span>
      {change !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 600, color: change >= 0 ? '#22C55E' : '#EF4444' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  )
}
