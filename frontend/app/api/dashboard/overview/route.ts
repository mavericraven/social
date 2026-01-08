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
      return NextResponse.json({
        totalReels: 0,
        totalPublished: 0,
        totalViews: 0,
        averageViralScore: 0,
        todaySchedules: []
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalReels, totalPublished, totalViews, reelsWithScores, todaySchedules] = await Promise.all([
      prisma.reel.count({
        where: { instagramAccountId }
      }),
      prisma.reel.count({
        where: { instagramAccountId, status: 'PUBLISHED' }
      }),
      prisma.reel.aggregate({
        where: { instagramAccountId },
        _sum: { views: true }
      }),
      prisma.reel.findMany({
        where: { instagramAccountId, viralScore: { gt: 0 } },
        select: { viralScore: true }
      }),
      prisma.schedule.findMany({
        where: {
          instagramAccountId,
          scheduledFor: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          reel: {
            include: {
              resort: true
            }
          }
        },
        orderBy: { scheduledFor: 'asc' }
      })
    ])

    const averageViralScore = reelsWithScores.length > 0
      ? Math.round(reelsWithScores.reduce((sum, r) => sum + r.viralScore, 0) / reelsWithScores.length)
      : 0

    return NextResponse.json({
      totalReels,
      totalPublished,
      totalViews: totalViews._sum.views || 0,
      averageViralScore,
      todaySchedules
    })
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
