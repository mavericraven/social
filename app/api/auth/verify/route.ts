import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 })
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      return NextResponse.json({ valid: true, user: decoded })
    } catch (error) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
