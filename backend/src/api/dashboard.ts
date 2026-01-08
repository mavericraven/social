import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { ReelStatus, PublishStatus } from '@prisma/client'

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/overview', async (request) => {
    const { userId } = request.user as any

    const [
      totalReels,
      totalPublished,
      totalViews,
      averageViralScore,
      todaySchedules,
    ] = await Promise.all([
      prisma.reel.count({
        where: {
          instagramAccount: { userId },
        },
      }),
      prisma.reel.count({
        where: {
          instagramAccount: { userId },
          status: ReelStatus.PUBLISHED,
        },
      }),
      prisma.reel.aggregate({
        where: {
          instagramAccount: { userId },
          status: ReelStatus.PUBLISHED,
        },
        _sum: { views: true },
      }),
      prisma.reel.aggregate({
        where: {
          instagramAccount: { userId },
          status: ReelStatus.PUBLISHED,
        },
        _avg: { viralScore: true },
      }),
      prisma.schedule.findMany({
        where: {
          instagramAccount: { userId },
          scheduledFor: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          reel: {
            include: {
              resort: true,
            },
          },
        },
        orderBy: { scheduledFor: 'asc' },
      }),
    ])

    return {
      totalReels,
      totalPublished,
      totalViews: totalViews._sum.views || 0,
      averageViralScore: Math.round(averageViralScore._avg.viralScore || 0),
      todaySchedules,
    }
  })

  fastify.get('/stats', async (request) => {
    const { userId } = request.user as any
    const { period = '7' } = request.query as any

    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await prisma.reel.groupBy({
      by: ['status'],
      where: {
        instagramAccount: { userId },
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    const publishStats = await prisma.publishAttempt.groupBy({
      by: ['status'],
      where: {
        instagramAccount: { userId },
        attemptedAt: { gte: startDate },
      },
      _count: true,
    })

    return {
      byStatus: stats,
      byPublishStatus: publishStats,
      period: `${days} days`,
    }
  })

  fastify.get('/performance', async (request) => {
    const { userId } = request.user as any

    const performance = await prisma.reel.findMany({
      where: {
        instagramAccount: { userId },
        status: ReelStatus.PUBLISHED,
      },
      select: {
        publishedAt: true,
        views: true,
        likes: true,
        comments: true,
        shares: true,
        viralScore: true,
        resort: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    })

    return performance
  })

  fastify.get('/top-reels', async (request) => {
    const { userId } = request.user as any
    const { limit = 10 } = request.query as any

    const topReels = await prisma.reel.findMany({
      where: {
        instagramAccount: { userId },
        status: ReelStatus.PUBLISHED,
      },
      include: {
        resort: true,
      },
      orderBy: { views: 'desc' },
      take: parseInt(limit),
    })

    return topReels
  })

  fastify.get('/alerts', async (request) => {
    const { userId } = request.user as any

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const [
      failedPublishes,
      failedAgents,
      rateLimited,
    ] = await Promise.all([
      prisma.publishAttempt.count({
        where: {
          instagramAccount: { userId },
          status: PublishStatus.FAILED,
          attemptedAt: { gte: oneHourAgo },
        },
      }),
      prisma.agentRunLog.count({
        where: {
          instagramAccount: { userId },
          status: 'FAILED',
          startedAt: { gte: oneHourAgo },
        },
      }),
      prisma.rateLimit.count({
        where: {
          instagramAccount: { userId },
          isLimited: true,
        },
      }),
    ])

    const alerts = []

    if (failedPublishes > 0) {
      alerts.push({
        type: 'error',
        message: `${failedPublishes} publish failures in the last hour`,
        count: failedPublishes,
      })
    }

    if (failedAgents > 0) {
      alerts.push({
        type: 'warning',
        message: `${failedAgents} agent failures in the last hour`,
        count: failedAgents,
      })
    }

    if (rateLimited > 0) {
      alerts.push({
        type: 'warning',
        message: 'Rate limiting is active',
        count: rateLimited,
      })
    }

    return { alerts, total: alerts.length }
  })
}
