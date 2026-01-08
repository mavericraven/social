import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import pino from 'pino'
import pretty from 'pino-pretty'

import { redis } from './lib/redis'
import { prisma } from './lib/prisma'
import { registerRoutes } from './api/routes'
import { startAgents } from './agents/orchestrator'
import { setupQueueProcessor } from './lib/queue'

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

async function buildServer() {
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000'],
    credentials: true,
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  })

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Meta Content Scheduler API',
        description: 'Instagram Reels Automation for Maldives Resorts',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })

  registerRoutes(fastify)

  fastify.addHook('onClose', async () => {
    await redis.quit()
    await prisma.$disconnect()
  })

  return fastify
}

  async function start() {
  try {
    const server = await buildServer()

    await server.listen({
      port: parseInt(process.env.PORT || '3001'),
      host: '0.0.0.0'
    })

    server.log.info('Server listening on port 3001')

    await setupQueueProcessor()
    await startAgents()

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
