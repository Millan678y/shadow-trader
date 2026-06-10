import { NextRequest, NextResponse } from 'next/server'
import { setNonce } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  }

  const nonce = crypto.randomUUID()
  const domain = 'shadow.trade'

  setNonce(address, nonce)

  return NextResponse.json({ nonce, domain })
}