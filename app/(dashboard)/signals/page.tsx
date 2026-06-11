import dynamic from 'next/dynamic'

const SignalsClient = dynamic(() => import('@/components/SignalsClient'), {
  ssr: true,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#08080d', color: '#00c853', fontSize: 14 }}>
      Loading Signals...
    </div>
  ),
})

export default function SignalsPage() {
  return <SignalsClient />
}