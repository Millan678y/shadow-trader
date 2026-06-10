import { NextRequest, NextResponse } from 'next/server'
import { getNonce, deleteNonce, createSessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, signature, message, domain } = body

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stored = getNonce(address.toLowerCase())
    if (!stored || stored.expires < Date.now()) {
      return NextResponse.json({ error: 'Nonce expired or invalid' }, { status: 401 })
    }
    if (!message.includes(stored.nonce)) {
      return NextResponse.json({ error: 'Nonce mismatch' }, { status: 401 })
    }

    // Production: verify signature with ethers.js (EVM) or @solana/web3.js (Solana)
    // const recoveredAddress = verifyMessage(message, signature)
    // if (recoveredAddress.toLowerCase() !== address.toLowerCase()) { ... }

    deleteNonce(address.toLowerCase())

    const token = createSessionToken(address)

    const response = NextResponse.json({
      user: { address: address.toLowerCase() },
      token,
    })

    response.cookies.set('shadow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}