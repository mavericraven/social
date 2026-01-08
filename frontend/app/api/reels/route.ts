import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const minScore = searchParams.get('minScore')
    const limit = parseInt(searchParams.get('limit') || '20')

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        instagramAccounts: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const instagramAccountId = user.instagramAccounts[0]?.id

    if (!instagramAccountId) {
      return NextResponse.json([])
    }

    const where: any = { instagramAccountId }
    if (status) {
      where.status = status
    }
    if (minScore) {
      where.viralScore = { gte: parseInt(minScore) }
    }

    const reels = await prisma.reel.findMany({
      where,
      include: {
        resort: true
      },
      orderBy: { discoveredAt: 'desc' },
      take: limit
    })

    return NextResponse.json(reels)
  } catch (error) {
    console.error('Reels list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
