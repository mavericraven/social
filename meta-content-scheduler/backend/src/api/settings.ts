import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.get('/:accountId', async (request, reply) => {
    const { accountId } = request.params as any

    const settings = await prisma.settings.findUnique({
      where: { instagramAccountId: accountId },
    })

    if (!settings) {
      return reply.status(404).send({ error: 'Settings not found' })
    }

    return settings
  })

  fastify.put('/:accountId', async (request, reply) => {
    const { accountId } = request.params as any
    const { 
      postingSchedule, 
      captionTemplate, 
      dailyReelCount, 
      minReelGapMinutes, 
      viralScoreThreshold 
    } = request.body as any

    try {
      const settings = await prisma.settings.update({
        where: { instagramAccountId: accountId },
        data: {
          postingSchedule: postingSchedule || undefined,
          captionTemplate: captionTemplate !== undefined ? captionTemplate : undefined,
          dailyReelCount: dailyReelCount !== undefined ? dailyReelCount : undefined,
          minReelGapMinutes: minReelGapMinutes !== undefined ? minReelGapMinutes : undefined,
          viralScoreThreshold: viralScoreThreshold !== undefined ? viralScoreThreshold : undefined,
        },
      })

      return settings
    } catch (error) {
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to update settings' 
      })
    }
  })
}
