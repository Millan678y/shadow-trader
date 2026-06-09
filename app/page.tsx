'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '4px',
          color: 'var(--accent-green)',
          marginBottom: '8px',
        }}>
          SHADOW TRADER
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '2px',
          color: 'var(--text-dim)',
        }}>
          INSTITUTIONAL GRADE · CLOUD NATIVE
        </div>
      </div>

      {/* Tagline */}
      <h1 style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(20px, 5vw, 36px)',
        fontWeight: 700,
        color: 'var(--text-bright)',
        marginBottom: '12px',
        lineHeight: 1.2,
      }}>
        Professional Trading<br />in the Cloud
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '14px',
        maxWidth: '440px',
        marginBottom: '32px',
        lineHeight: 1.6,
      }}>
        Real-time market analysis, cloud backtesting, portfolio management,
        and AI-powered research — all from any device, anywhere.
      </p>

      {/* CTA Button */}
      <a
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          background: 'var(--accent-green)',
          color: '#000',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '8px',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all .15s',
        }}
      >
        Enter Platform
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      {/* Feature Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        marginTop: '40px',
        maxWidth: '480px',
      }}>
        {['Real-time Charts', 'Cloud Backtesting', 'Risk Management', 'AI Research', 'Portfolio Analytics', 'Trade Journal'].map(f => (
          <div key={f} style={{
            padding: '4px 12px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-dim)',
            borderRadius: '999px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}>
            {f}
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        fontSize: '10px',
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
      }}>
        v1.0.0 — June 2026
      </div>
    </div>
  )
}