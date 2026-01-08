import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = fastify.jwt.sign({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    })

    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    }
  })

  fastify.post('/verify', async (request, reply) => {
    try {
      await request.jwtVerify()
      return { valid: true, user: request.user }
    } catch (err) {
      return reply.status(401).send({ valid: false, error: 'Invalid token' })
    }
  })

  fastify.get('/meta/authorize', async (request, reply) => {
    const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_read_engagement`
    
    return { authUrl: metaAuthUrl }
  })

  fastify.post('/meta/callback', async (request, reply) => {
    const { code } = request.body as any

    if (!code) {
      return reply.status(400).send({ error: 'Authorization code is required' })
    }

    try {
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.META_REDIRECT_URI}&code=${code}`
      )

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(tokenData.error?.message || 'Failed to exchange code')
      }

      const longLivedTokenResponse = await fetch(
        `https://graph.instagram.com/v19.0/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_APP_SECRET}&access_token=${tokenData.access_token}`
      )

      const longLivedTokenData = await longLivedTokenResponse.json()

      if (!longLivedTokenResponse.ok || longLivedTokenData.error) {
        throw new Error('Failed to get long-lived token')
      }

      const profileResponse = await fetch(
        `https://graph.instagram.com/v19.0/me?fields=id,username&access_token=${longLivedTokenData.access_token}`
      )

      const profileData = await profileResponse.json()

      return {
        accessToken: longLivedTokenData.access_token,
        expiresIn: longLivedTokenData.expires_in,
        user: profileData,
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      })
    }
  })
}
