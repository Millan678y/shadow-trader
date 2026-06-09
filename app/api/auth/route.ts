import { NextRequest, NextResponse } from 'next/server';
import { verifySession, createSession } from '@/lib/auth';
import { generateNonce } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { signedMessage, walletPublicKey } = await req.json();
  const { valid, userId } = await verifySession(signedMessage, walletPublicKey);

  if (!valid || !userId) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const token = await createSession(userId);
  const resp = NextResponse.json({ success: true, userId });
  resp.cookies.set('session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
  return resp;
}