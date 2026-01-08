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
        successRate: 0,
        avgPostTime: 0,
        topPerformingResorts: [],
        recentActivity: []
      })
    }

    const [successRate, avgPostTime, topResorts, recentActivity] = await Promise.all([
      prisma.publishAttempt.aggregate({
        where: { instagramAccountId, status: 'SUCCESS' },
        _count: { id: true },
      }).then(async (success) => {
        const total = await prisma.publishAttempt.count({ where: { instagramAccountId } })
        return total > 0 ? (success._count.id / total) * 100 : 0
      }),
      prisma.schedule.count({
        where: {
          instagramAccountId,
          status: 'PUBLISHED',
          publishedAt: { not: null }
        }
      }).then(count => count),
      prisma.reel.groupBy({
        by: ['resortId'],
        where: {
          instagramAccountId,
          resortId: { not: null }
        },
        _sum: { views: true },
        orderBy: { _sum: { views: 'desc' } },
        take: 5
      }),
      prisma.agentRunLog.findMany({
        where: { instagramAccountId },
        orderBy: { startedAt: 'desc' },
        take: 10
      })
    ])

    const topPerformingResorts = await Promise.all(
      topResorts.map(async (group) => {
        const resort = await prisma.resort.findUnique({
          where: { id: group.resortId! }
        })
        return {
          name: resort?.name || 'Unknown',
          instagramHandle: resort?.instagramHandle || '',
          totalViews: group._sum.views || 0
        }
      })
    )

    return NextResponse.json({
      successRate,
      avgPostTime,
      topPerformingResorts,
      recentActivity: recentActivity.map(log => ({
        agentType: log.agentType,
        status: log.status,
        startedAt: log.startedAt,
        durationMs: log.durationMs
      }))
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
