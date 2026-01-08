import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function accountRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/', async (request) => {
    const { userId } = request.user as any

    const accounts = await prisma.instagramAccount.findMany({
      where: { userId },
      include: {
        reels: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        schedules: {
          take: 5,
          orderBy: { scheduledFor: 'desc' },
        },
      },
    })

    return accounts
  })

  fastify.post('/', async (request, reply) => {
    const { userId } = request.user as any
    const { metaAccountId, metaUsername, accessToken, tokenExpiresAt } = request.body as any

    try {
      const account = await prisma.instagramAccount.create({
        data: {
          userId,
          metaAccountId,
          metaUsername,
          accessToken,
          tokenExpiresAt: new Date(tokenExpiresAt),
        },
      })

      await prisma.settings.create({
        data: {
          instagramAccountId: account.id,
          postingSchedule: ['12:00', '15:00', '18:00', '20:00', '22:00'],
          dailyReelCount: 5,
          minReelGapMinutes: 90,
          viralScoreThreshold: 70,
        },
      })

      return account
    } catch (error) {
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create account' 
      })
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any
    const { userId } = request.user as any

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id,
        userId,
      },
      include: {
        schedules: {
          include: {
            reel: {
              include: {
                resort: true,
              },
            },
          },
          orderBy: { scheduledFor: 'desc' },
        },
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    return account
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as any
    const { userId } = request.user as any

    const account = await prisma.instagramAccount.findFirst({
      where: { id, userId },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    await prisma.instagramAccount.delete({
      where: { id },
    })

    return { message: 'Account deleted successfully' }
  })

  fastify.post('/:id/sync', async (request, reply) => {
    const { id } = request.params as any
    const { userId } = request.user as any

    const account = await prisma.instagramAccount.findFirst({
      where: { id, userId },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    await prisma.instagramAccount.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    })

    return { message: 'Account synced successfully' }
  })
}
