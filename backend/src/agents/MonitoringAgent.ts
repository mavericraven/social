import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus, PublishStatus, AgentStatus } from '@prisma/client'

export class MonitoringAgent extends BaseAgent {
  constructor() {
    super('MONITORING')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { instagramAccountId } = input
    
    if (!instagramAccountId) {
      throw new Error('instagramAccountId is required')
    }

    const results = {
      retriedPublishes: 0,
      failedSchedulesReplaced: 0,
      alertsSent: 0,
      agentHealthChecked: 0,
    }

    await this.retryFailedPublishes(instagramAccountId, results)
    await this.replaceFailedSchedules(instagramAccountId, results)
    await this.checkAgentHealth(results)
    await this.sendAlerts(instagramAccountId, results)

    return {
      success: true,
      data: {
        ...results,
        message: 'Monitoring complete',
      },
    }
  }

  private async retryFailedPublishes(instagramAccountId: string, results: any) {
    const retryAttempts = await prisma.publishAttempt.findMany({
      where: {
        instagramAccountId,
        status: PublishStatus.RETRYING,
        nextRetryAt: {
          lte: new Date(),
        },
      },
      include: {
        schedule: true,
      },
    })

    for (const attempt of retryAttempts) {
      try {
        const publishingAgent = new PublishingAgent()
        await publishingAgent.run({ scheduleId: attempt.scheduleId })
        results.retriedPublishes++
      } catch (error) {
        console.error(`Failed to retry publish attempt ${attempt.id}:`, error)
      }
    }
  }

  private async replaceFailedSchedules(instagramAccountId: string, results: any) {
    const failedSchedules = await prisma.schedule.findMany({
      where: {
        instagramAccountId,
        status: ReelStatus.FAILED,
        scheduledFor: {
          gte: new Date(),
        },
      },
      include: {
        reel: true,
      },
    })

    for (const schedule of failedSchedules) {
      try {
        const schedulingAgent = new SchedulingAgent()
        await schedulingAgent.run({
          instagramAccountId,
          targetDate: schedule.scheduledFor,
        })

        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            status: ReelStatus.DELETED,
          },
        })

        results.failedSchedulesReplaced++
      } catch (error) {
        console.error(`Failed to replace schedule ${schedule.id}:`, error)
      }
    }
  }

  private async checkAgentHealth(results: any) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const failedAgentRuns = await prisma.agentRunLog.findMany({
      where: {
        status: AgentStatus.FAILED,
        startedAt: { gte: oneHourAgo },
      },
      take: 10,
    })

    results.agentHealthChecked = failedAgentRuns.length

    for (const run of failedAgentRuns) {
      console.warn(`Agent ${run.agentType} failed at ${run.startedAt}: ${run.error}`)
    }
  }

  private async sendAlerts(instagramAccountId: string, results: any) {
    const account = await prisma.instagramAccount.findUnique({
      where: { id: instagramAccountId },
    })

    if (!account) return

    const criticalIssues = await this.getCriticalIssues(instagramAccountId)

    if (criticalIssues.length > 0) {
      await this.logCriticalAlerts(account, criticalIssues)
      results.alertsSent = criticalIssues.length
    }
  }

  private async getCriticalIssues(instagramAccountId: string): Promise<string[]> {
    const issues: string[] = []

    const rateLimitActive = await prisma.rateLimit.findFirst({
      where: {
        instagramAccountId,
        isLimited: true,
      },
    })

    if (rateLimitActive) {
      issues.push(`Rate limit active. Reset at ${rateLimitActive.resetAt}`)
    }

    const recentFailures = await prisma.publishAttempt.count({
      where: {
        instagramAccountId,
        status: PublishStatus.FAILED,
        attemptedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    })

    if (recentFailures >= 5) {
      issues.push(`${recentFailures} publish failures in the last hour`)
    }

    const failedAgentRuns = await prisma.agentRunLog.count({
      where: {
        instagramAccountId,
        status: AgentStatus.FAILED,
        startedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    })

    if (failedAgentRuns >= 3) {
      issues.push(`${failedAgentRuns} agent failures in the last hour`)
    }

    return issues
  }

  private async logCriticalAlerts(account: any, issues: string[]) {
    console.error(`CRITICAL ALERT for ${account.metaUsername}:`)
    issues.forEach(issue => console.error(`- ${issue}`))
  }
}
