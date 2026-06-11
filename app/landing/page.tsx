// Landing page — dynamically imports client component to avoid page.tsx SWC parser issue
import dynamic from 'next/dynamic'

const LandingContent = dynamic(() => import('@/components/LandingContent'), {
  ssr: false,
  loading: () => (
    <div style={{ background: '#08080d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#00c853', fontSize: 16 }}>Loading Shadow...</div>
    </div>
  ),
})

export default function LandingPage() {
  return <LandingContent />
}