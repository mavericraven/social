import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth'
import { accountRoutes } from './accounts'
import { reelsRoutes } from './reels'
import { scheduleRoutes } from './schedule'
import { settingsRoutes } from './settings'
import { dashboardRoutes } from './dashboard'
import { agentsRoutes } from './agents'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(accountRoutes, { prefix: '/api/accounts' })
  fastify.register(reelsRoutes, { prefix: '/api/reels' })
  fastify.register(scheduleRoutes, { prefix: '/api/schedule' })
  fastify.register(settingsRoutes, { prefix: '/api/settings' })
  fastify.register(dashboardRoutes, { prefix: '/api/dashboard' })
  fastify.register(agentsRoutes, { prefix: '/api/agents' })
}
