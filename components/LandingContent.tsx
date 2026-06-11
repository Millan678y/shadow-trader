'use client'
import { useState, useEffect } from 'react'


const FACTORS = [
  { key: 'marketRegime', label: 'Market Regime', desc: 'Trend cycle & volatility analysis' },
  { key: 'trend', label: 'Trend', desc: 'Multi-timeframe EMA/SMA cross' },
  { key: 'momentum', label: 'Momentum', desc: 'RSI, MACD, volume indicators' },
  { key: 'orderflow', label: 'Order Flow', desc: 'CVD, whale tracking, DEX flows' },
  { key: 'risk', label: 'Risk', desc: 'VaR, drawdown, correlation' },
  { key: 'news', label: 'News', desc: 'Sentiment from 50+ sources' },
  { key: 'structure', label: 'Structure', desc: 'OB, FVG, liquidity zones' },
]

const PIPELINE = [
  { step: '01', agent: 'Research Agent', color: '#3b82f6', desc: 'Scans market structure, on-chain data, funding rates, whale wallets.' },
  { step: '02', agent: 'News Agent', color: '#8b5cf6', desc: 'Analyzes 50+ sources for sentiment and narrative shifts.' },
  { step: '03', agent: 'Order Flow Agent', color: '#f59e0b', desc: 'Tracks CEX/DEX flows, liquidations, institutional patterns.' },
  { step: '04', agent: 'Risk Agent', color: '#ef4444', desc: 'Calculates position size, VaR, correlation. VETO authority.' },
  { step: '05', agent: 'Signal Engine', color: '#00c853', desc: 'Combines 7 factors. Only 75+ triggers an alert.' },
]

export default function LandingContent() {
  const [factorScores, setFactorScores] = useState<number[]>([])

  useEffect(() => {
    // Generate scores client-side only to avoid hydration mismatch
    setFactorScores(FACTORS.map(() => Math.floor(Math.random() * 20) + 75))
  }, [])
    <div style={{ background: '#08080d', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, background: 'rgba(8,8,13,0.95)', backdropFilter: 'blur(12px)', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00c853,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>S</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>SHADOW</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {['Signals', 'Terminal', 'Backtest', 'Journal', 'Risk'].map(item => (
            <a key={item} href={`/${item.toLowerCase()}`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>{item}</a>
          ))}
        </div>
          <a href="/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#000', textDecoration: 'none', cursor: 'pointer' }}>
            Launch App
          </a>
      </nav>

      {/* Hero */}
      <section style={{ padding: '100px 40px 80px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#00c853', marginBottom: 32 }}>
          <span style={{ fontSize: 8 }}>*</span> Solana Perpetuals · Live Signals
        </div>
        <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24, background: 'linear-gradient(180deg,#fff 0%,#94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          The AI Signal Co-Pilot<br />for Solana Traders
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.6 }}>
          Institutional-grade signals powered by a 7-factor engine. Multi-agent pipeline with Risk Agent veto authority. Built for perpetual futures traders who demand discipline.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <a href="/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 700, color: '#000', textDecoration: 'none', cursor: 'pointer' }}>
            Start Free Trial
          </a>
          <a href="/dashboard/terminal" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 600, color: '#e2e8f0', textDecoration: 'none', cursor: 'pointer' }}>
            View Live Terminal
          </a>
        </div>
      </section>

      {/* Live Signal Preview */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#00c853,#00e676)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>S</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>SOL/USDT</div>
                <div style={{ fontSize: 13, color: '#00c853' }}>Signal #4821 · 4H</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#00c853' }}>87</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Total Score</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>Direction</div><div style={{ fontSize: 16, fontWeight: 700, color: '#00c853' }}>LONG</div></div>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>Entry</div><div style={{ fontSize: 16, fontWeight: 600 }}>$182.45</div></div>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>Stop</div><div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>$175.20</div></div>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>Take Profit</div><div style={{ fontSize: 16, fontWeight: 600, color: '#00c853' }}>$198.30</div></div>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>Risk</div><div style={{ fontSize: 16, fontWeight: 600 }}>1.5%</div></div>
            <div><div style={{ fontSize: 11, color: '#64748b' }}>R:R</div><div style={{ fontSize: 16, fontWeight: 600 }}>2.3:1</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {FACTORS.map((f, idx) => (
              <div key={f.key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#00e676' }}>{factorScores[idx] ?? '...'}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 4 }}>
                  <div style={{ width: `${factorScores[idx] ?? 80}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#00c853,#00e676)', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 16, fontSize: 13, color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 24 }}>
            "Solana breaking above $180 resistance with 40% increase in DEX volume. Order flow shows institutional accumulation over past 48H. Funding rates neutral, preventing liquidations cascade. On-chain TVL up 22% WoW."
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/dashboard/signals" style={{ flex: 1, display: 'block', background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, color: '#000', textDecoration: 'none', textAlign: 'center' }}>Execute Signal</a>
            <a href="/dashboard/signals" style={{ flex: 1, display: 'block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, color: '#e2e8f0', textDecoration: 'none', textAlign: 'center' }}>View Full Analysis</a>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section style={{ padding: '80px 40px', background: 'rgba(0,200,83,0.02)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 56, letterSpacing: '-1px' }}>The Multi-Agent Pipeline</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {PIPELINE.map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${item.color}20`, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: item.color, flexShrink: 0 }}>{item.step}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.agent}</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 20 }}>Ready to Trade with an Edge?</h2>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>Join traders who stopped guessing and started executing with institutional discipline.</p>
        <a href="/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#00c853,#00e676)', border: 'none', borderRadius: 12, padding: '16px 48px', fontSize: 18, fontWeight: 700, color: '#000', textDecoration: 'none' }}>Get Started Free</a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 40px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
          {['Terms', 'Privacy', 'Risk Disclosure'].map(item => (
            <a key={item} href={`/${item.toLowerCase().replace(' ', '-')}`} style={{ color: '#475569', textDecoration: 'none' }}>{item}</a>
          ))}
        </div>
        <p>Shadow Trader · For educational purposes only · Not financial advice</p>
      </footer>
    </div>
  )
}