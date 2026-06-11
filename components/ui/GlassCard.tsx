'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  glow?: boolean
}

export function GlassCard({ children, className = '', style, hover = true, glow = false }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        boxShadow: glow ? '0 0 20px rgba(34, 197, 94, 0.1)' : '0 4px 24px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        ...(hover && {
          cursor: 'pointer',
        }),
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
        e.currentTarget.style.transform = 'scale(1.02)'
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        e.currentSpot.style.transform = 'scale(1)'
      } : undefined}
    >
      {children}
    </div>
  )
}
