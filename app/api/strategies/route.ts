import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ strategies: [], active: false })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    return NextResponse.json({ success: true, strategy: { id: Date.now().toString(), ...body, active: false } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid strategy data' }, { status: 400 })
  }
}