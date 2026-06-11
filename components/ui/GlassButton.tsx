'use client'

import { ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function GlassButton({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  style,
}: GlassButtonProps) {
  const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: 12 },
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '14px 36px', fontSize: 16 },
  }

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #00c853, #00e676)',
      color: '#000',
      border: 'none',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#e2e8f0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #f87171)',
      color: '#fff',
      border: 'none',
    },
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  const Component = href ? 'a' : 'button'

  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </Component>
  )
}
