import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus, PublishStatus } from '@prisma/client'

export class PublishingAgent extends BaseAgent {
  constructor() {
    super('PUBLISHING')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { scheduleId } = input
    
    if (!scheduleId) {
      throw new Error('scheduleId is required')
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        reel: {
          include: {
            resort: true,
          },
        },
        instagramAccount: true,
      },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    if (schedule.status !== ReelStatus.SCHEDULED) {
      return {
        success: true,
        data: { message: 'Reel already processed', schedule },
      }
    }

    const publishAttempt = await prisma.publishAttempt.create({
      data: {
        scheduleId,
        instagramAccountId: schedule.instagramAccountId,
        status: PublishStatus.QUEUED,
      },
    })

    try {
      await this.checkRateLimit(schedule.instagramAccountId)
      await this.checkReelAvailability(schedule.reel)

      const publishResult = await this.publishToInstagram(schedule)

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: ReelStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      })

      await prisma.reel.update({
        where: { id: schedule.reelId },
        data: {
          status: ReelStatus.PUBLISHED,
        },
      })

      await prisma.publishAttempt.update({
        where: { id: publishAttempt.id },
        data: {
          status: PublishStatus.SUCCESS,
          completedAt: new Date(),
          mediaUploaded: true,
          mediaId: publishResult.mediaId,
          containerId: publishResult.containerId,
        },
      })

      return {
        success: true,
        data: {
          message: 'Reel published successfully',
          schedule,
          mediaId: publishResult.mediaId,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await prisma.publishAttempt.update({
        where: { id: publishAttempt.id },
        data: {
          status: PublishStatus.FAILED,
          error: errorMessage,
          completedAt: new Date(),
        },
      })

      await this.scheduleRetry(publishAttempt, errorMessage, schedule)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  private async checkRateLimit(instagramAccountId: string) {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const recentAttempts = await prisma.publishAttempt.count({
      where: {
        instagramAccountId,
        attemptedAt: { gte: oneHourAgo },
      },
    })

    const hourlyLimit = parseInt(process.env.RATE_LIMIT_PER_HOUR || '200')

    if (recentAttempts >= hourlyLimit) {
      await prisma.rateLimit.upsert({
        where: {
          endpoint_instagramAccountId: {
            endpoint: 'PUBLISH',
            instagramAccountId,
          },
        },
        create: {
          endpoint: 'PUBLISH',
          instagramAccountId,
          requestCount: recentAttempts,
          windowStart: oneHourAgo,
          windowEnd: now,
          isLimited: true,
          resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000),
        },
        update: {
          requestCount: recentAttempts,
          windowEnd: now,
          isLimited: true,
        },
      })

      throw new Error('Rate limit exceeded. Please wait before retrying.')
    }

    await prisma.rateLimit.upsert({
      where: {
        endpoint_instagramAccountId: {
          endpoint: 'PUBLISH',
          instagramAccountId,
        },
      },
      create: {
        endpoint: 'PUBLISH',
        instagramAccountId,
        requestCount: recentAttempts,
        windowStart: oneHourAgo,
        windowEnd: now,
        isLimited: false,
      },
      update: {
        requestCount: recentAttempts,
        windowEnd: now,
        isLimited: false,
      },
    })
  }

  private async checkReelAvailability(reel: any) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v19.0/${reel.metaId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.META_APP_SECRET}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Source reel no longer available')
      }

      const data = await response.json()

      if (data.error || !data.id) {
        throw new Error('Source reel deleted or unavailable')
      }
    } catch (error) {
      throw new Error('Failed to verify reel availability')
    }
  }

  private async publishToInstagram(schedule: any): Promise<{ mediaId: string; containerId: string }> {
    const { reel, instagramAccount } = schedule

    const caption = this.generateCaption(reel)

    const jitter = Math.floor(Math.random() * 5000) + 1000
    await new Promise(resolve => setTimeout(resolve, jitter))

    const containerResponse = await fetch(
      `https://graph.instagram.com/v19.0/${instagramAccount.metaAccountId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: reel.mediaUrl,
          caption,
          access_token: instagramAccount.accessToken,
          media_type: 'REELS',
        }),
      }
    )

    if (!containerResponse.ok) {
      const error = await containerResponse.json()
      throw new Error(`Failed to create container: ${JSON.stringify(error)}`)
    }

    const containerData = await containerResponse.json()

    await new Promise(resolve => setTimeout(resolve, 2000))

    const publishResponse = await fetch(
      `https://graph.instagram.com/v19.0/${instagramAccount.metaAccountId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: instagramAccount.accessToken,
        }),
      }
    )

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new Error(`Failed to publish: ${JSON.stringify(error)}`)
    }

    const publishData = await publishResponse.json()

    return {
      containerId: containerData.id,
      mediaId: publishData.id,
    }
  }

  private generateCaption(reel: any): string {
    const resortName = reel.resort?.name || 'Luxury Maldives Resort'
    const credit = reel.resort?.instagramHandle || `@${reel.resort?.instagramHandle?.replace('@', '')}`

    let caption = `${reel.caption || ''}\n\n`

    caption += `✨ Discover paradise at ${resortName} in the Maldives! 🌴\n\n`
    caption += `Credit: ${credit}\n`
    caption += `#Maldives #LuxuryTravel #Paradise #TravelDreams #${resortName.replace(/\s+/g, '')}`

    return caption
  }

  private async scheduleRetry(
    publishAttempt: any,
    errorMessage: string,
    schedule: any
  ) {
    const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')

    if (publishAttempt.retryCount >= maxRetries) {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          status: ReelStatus.FAILED,
        },
      })

      await prisma.reel.update({
        where: { id: schedule.reelId },
        data: {
          status: ReelStatus.FAILED,
        },
      })

      return
    }

    const retryDelay = this.calculateBackoff(publishAttempt.retryCount)
    const nextRetryAt = new Date(Date.now() + retryDelay)

    await prisma.publishAttempt.update({
      where: { id: publishAttempt.id },
      data: {
        retryCount: publishAttempt.retryCount + 1,
        nextRetryAt,
        status: PublishStatus.RETRYING,
      },
    })
  }

  private calculateBackoff(retryCount: number): number {
    const baseDelay = parseInt(process.env.RETRY_BACKOFF_MS || '5000')
    return baseDelay * Math.pow(2, retryCount)
  }
}
