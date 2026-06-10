// Shared auth utilities for SIWS (Sign-In With Solana)
// In production: use @solana/web3.js for signature verification
// and jose/jsonwebtoken for JWT handling

export interface NonceEntry {
  nonce: string
  expires: number
  address: string
}

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, NonceEntry>()

export function getNonce(address: string): NonceEntry | undefined {
  return nonceStore.get(address.toLowerCase())
}

export function setNonce(address: string, nonce: string): void {
  nonceStore.set(address.toLowerCase(), {
    nonce,
    expires: Date.now() + 10 * 60 * 1000,
    address: address.toLowerCase(),
  })
}

export function deleteNonce(address: string): void {
  nonceStore.delete(address.toLowerCase())
}

export function createSessionToken(address: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    address,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })).toString('base64url')
  const sig = Buffer.from(`sig_${address}`).toString('base64url')
  return `${header}.${payload}.${sig}`
}

export function verifySessionToken(token: string): { address: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return { address: payload.address }
  } catch {
    return null
  }
}

export function getSessionFromRequest(request: Request): { address: string } | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/shadow_session=([^;]+)/)
  if (!match) return null
  return verifySessionToken(match[1])
}

export { nonceStore }