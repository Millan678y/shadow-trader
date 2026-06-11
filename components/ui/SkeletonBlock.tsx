'use client'

interface SkeletonBlockProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
  className?: string
  style?: React.CSSProperties
}

export function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  style,
}: SkeletonBlockProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
        ...style,
      }}
    />
  )
}
