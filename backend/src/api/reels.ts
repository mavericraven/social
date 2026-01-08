import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

export async function reelsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/', async (request) => {
    const { userId } = request.user as any
    const { status, resortId, minViralScore, page = 1, limit = 20 } = request.query as any

    const where: any = {
      instagramAccount: {
        userId,
      },
    }

    if (status) {
      where.status = status
    }

    if (resortId) {
      where.resortId = resortId
    }

    if (minViralScore) {
      where.viralScore = { gte: parseInt(minViralScore) }
    }

    const [reels, total] = await Promise.all([
      prisma.reel.findMany({
        where,
        include: {
          resort: true,
          instagramAccount: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reel.count({ where }),
    ])

    return {
      reels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }
  })

  fastify.get('/library', async (request) => {
    const { userId } = request.user as any
    const { minViralScore = 70 } = request.query as any

    const reels = await prisma.reel.findMany({
      where: {
        instagramAccount: {
          userId,
        },
        status: ReelStatus.APPROVED,
        viralScore: { gte: parseInt(minViralScore) },
      },
      include: {
        resort: true,
      },
      orderBy: [
        { viralScore: 'desc' },
        { discoveredAt: 'desc' },
      ],
      take: 50,
    })

    return reels
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any

    const reel = await prisma.reel.findUnique({
      where: { id },
      include: {
        resort: true,
        instagramAccount: true,
        schedules: {
          include: {
            publishAttempts: true,
          },
        },
      },
    })

    if (!reel) {
      return reply.status(404).send({ error: 'Reel not found' })
    }

    return reel
  })

  fastify.post('/:id/approve', async (request, reply) => {
    const { id } = request.params as any

    const reel = await prisma.reel.update({
      where: { id },
      data: { status: ReelStatus.APPROVED },
    })

    return reel
  })

  fastify.post('/:id/reject', async (request, reply) => {
    const { id } = request.params as any

    const reel = await prisma.reel.update({
      where: { id },
      data: { status: ReelStatus.REJECTED },
    })

    return reel
  })
}
