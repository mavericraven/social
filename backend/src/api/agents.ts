import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { 
  DiscoveryAgent, 
  ScoringAgent, 
  ComplianceAgent, 
  SchedulingAgent, 
  PublishingAgent, 
  MonitoringAgent 
} from '../agents/orchestrator'

export async function agentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/status', async (request) => {
    const { userId } = request.user as any
    const { agentType, limit = 10 } = request.query as any

    const where: any = {
      instagramAccount: {
        userId,
      },
    }

    if (agentType) {
      where.agentType = agentType.toUpperCase()
    }

    const logs = await prisma.agentRunLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit),
    })

    return logs
  })

  fastify.post('/discovery/run', async (request, reply) => {
    const { userId } = request.user as any
    const { instagramAccountId } = request.body as any

    if (!instagramAccountId) {
      return reply.status(400).send({ error: 'instagramAccountId is required' })
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id: instagramAccountId,
        userId,
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    const agent = new DiscoveryAgent()
    const result = await agent.run({ instagramAccountId })

    return result
  })

  fastify.post('/scoring/run', async (request, reply) => {
    const { userId } = request.user as any
    const { instagramAccountId } = request.body as any

    if (!instagramAccountId) {
      return reply.status(400).send({ error: 'instagramAccountId is required' })
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id: instagramAccountId,
        userId,
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    const agent = new ScoringAgent()
    const result = await agent.run({ instagramAccountId })

    return result
  })

  fastify.post('/compliance/run', async (request, reply) => {
    const { userId } = request.user as any
    const { instagramAccountId } = request.body as any

    if (!instagramAccountId) {
      return reply.status(400).send({ error: 'instagramAccountId is required' })
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id: instagramAccountId,
        userId,
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    const agent = new ComplianceAgent()
    const result = await agent.run({ instagramAccountId })

    return result
  })

  fastify.post('/scheduling/run', async (request, reply) => {
    const { userId } = request.user as any
    const { instagramAccountId, targetDate } = request.body as any

    if (!instagramAccountId) {
      return reply.status(400).send({ error: 'instagramAccountId is required' })
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id: instagramAccountId,
        userId,
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    const agent = new SchedulingAgent()
    const result = await agent.run({ instagramAccountId, targetDate })

    return result
  })

  fastify.post('/publishing/run', async (request, reply) => {
    const { userId } = request.user as any
    const { scheduleId } = request.body as any

    if (!scheduleId) {
      return reply.status(400).send({ error: 'scheduleId is required' })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        instagramAccount: true,
      },
    })

    if (!schedule) {
      return reply.status(404).send({ error: 'Schedule not found' })
    }

    if (schedule.instagramAccount.userId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' })
    }

    const agent = new PublishingAgent()
    const result = await agent.run({ scheduleId })

    return result
  })

  fastify.post('/monitoring/run', async (request, reply) => {
    const { userId } = request.user as any
    const { instagramAccountId } = request.body as any

    if (!instagramAccountId) {
      return reply.status(400).send({ error: 'instagramAccountId is required' })
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { 
        id: instagramAccountId,
        userId,
      },
    })

    if (!account) {
      return reply.status(404).send({ error: 'Account not found' })
    }

    const agent = new MonitoringAgent()
    const result = await agent.run({ instagramAccountId })

    return result
  })
}
