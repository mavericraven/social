import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

export async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/', async (request) => {
    const { userId } = request.user as any
    const { instagramAccountId, startDate, endDate } = request.query as any

    const where: any = {
      instagramAccount: {
        userId,
      },
    }

    if (instagramAccountId) {
      where.instagramAccountId = instagramAccountId
    }

    if (startDate || endDate) {
      where.scheduledFor = {}
      if (startDate) {
        where.scheduledFor.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledFor.lte = new Date(endDate)
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        reel: {
          include: {
            resort: true,
          },
        },
        instagramAccount: true,
        publishAttempts: {
          orderBy: { attemptedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return schedules
  })

  fastify.get('/today', async (request) => {
    const { userId } = request.user as any

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const schedules = await prisma.schedule.findMany({
      where: {
        instagramAccount: {
          userId,
        },
        scheduledFor: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        reel: {
          include: {
            resort: true,
          },
        },
        instagramAccount: true,
        publishAttempts: {
          orderBy: { attemptedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return schedules
  })

  fastify.get('/calendar', async (request) => {
    const { userId } = request.user as any
    const { month, year } = request.query as any

    const targetMonth = parseInt(month) || new Date().getMonth()
    const targetYear = parseInt(year) || new Date().getFullYear()

    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0)

    const schedules = await prisma.schedule.findMany({
      where: {
        instagramAccount: {
          userId,
        },
        scheduledFor: {
          gte: startDate,
          lte: endDate,
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
    })

    const calendar = schedules.map(schedule => ({
      id: schedule.id,
      date: schedule.scheduledFor.toISOString().split('T')[0],
      time: schedule.scheduledFor.toTimeString().slice(0, 5),
      reel: {
        id: schedule.reel.id,
        thumbnailUrl: schedule.reel.thumbnailUrl,
        viralScore: schedule.reel.viralScore,
        resort: schedule.reel.resort,
      },
      status: schedule.status,
    }))

    return calendar
  })

  fastify.post('/', async (request, reply) => {
    const { userId } = request.user as any
    const { reelId, scheduledFor, instagramAccountId } = request.body as any

    try {
      const schedule = await prisma.schedule.create({
        data: {
          reelId,
          instagramAccountId,
          scheduledFor: new Date(scheduledFor),
          status: ReelStatus.SCHEDULED,
        },
      })

      await prisma.reel.update({
        where: { id: reelId },
        data: { status: ReelStatus.SCHEDULED },
      })

      return schedule
    } catch (error) {
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create schedule' 
      })
    }
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as any
    const { scheduledFor } = request.body as any

    try {
      const schedule = await prisma.schedule.update({
        where: { id },
        data: {
          scheduledFor: new Date(scheduledFor),
        },
      })

      return schedule
    } catch (error) {
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to update schedule' 
      })
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as any

    const schedule = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!schedule) {
      return reply.status(404).send({ error: 'Schedule not found' })
    }

    await prisma.schedule.delete({
      where: { id },
    })

    await prisma.reel.update({
      where: { id: schedule.reelId },
      data: { status: ReelStatus.APPROVED },
    })

    return { message: 'Schedule deleted successfully' }
  })
}
