// Dashboard — server component that dynamically loads client dashboard
import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('@/components/DashboardClient'), {
  ssr: true,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#08080d', color: '#00c853', fontSize: 14 }}>
      Loading Shadow Terminal...
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardClient />
}