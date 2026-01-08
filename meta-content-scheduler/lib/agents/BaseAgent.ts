import { prisma } from '../prisma'
import { AgentStatus } from '@prisma/client'

export interface AgentInput {
  instagramAccountId?: string
  [key: string]: any
}

export interface AgentOutput {
  success: boolean
  data?: any
  error?: string
}

export abstract class BaseAgent {
  protected agentType: string
  protected maxRetries: number = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
  
  constructor(agentType: string) {
    this.agentType = agentType
  }

  protected async logStart(input: AgentInput) {
    return prisma.agentRunLog.create({
      data: {
        agentType: this.agentType,
        status: AgentStatus.RUNNING,
        instagramAccountId: input.instagramAccountId,
        input,
        startedAt: new Date(),
      },
    })
  }

  protected async logSuccess(
    logId: string, 
    output: AgentOutput, 
    startedAt: Date
  ) {
    const durationMs = Date.now() - startedAt.getTime()
    
    return prisma.agentRunLog.update({
      where: { id: logId },
      data: {
        status: AgentStatus.COMPLETED,
        output: output.data,
        completedAt: new Date(),
        durationMs,
      },
    })
  }

  protected async logFailure(
    logId: string, 
    error: string, 
    retryCount: number,
    startedAt: Date
  ) {
    const durationMs = Date.now() - startedAt.getTime()
    
    return prisma.agentRunLog.update({
      where: { id: logId },
      data: {
        status: AgentStatus.FAILED,
        error,
        retryCount,
        completedAt: new Date(),
        durationMs,
      },
    })
  }

  protected async shouldRetry(
    logId: string, 
    error: string, 
    retryCount: number
  ): Promise<boolean> {
    if (retryCount >= this.maxRetries) {
      await this.logFailure(logId, error, retryCount, new Date())
      return false
    }

    await prisma.agentRunLog.update({
      where: { id: logId },
      data: {
        status: AgentStatus.RETRYING,
        retryCount,
        error,
      },
    })

    return true
  }

  abstract execute(input: AgentInput): Promise<AgentOutput>

  async run(input: AgentInput): Promise<AgentOutput> {
    const log = await this.logStart(input)
    const startedAt = log.startedAt
    let retryCount = 0

    while (true) {
      try {
        const output = await this.execute(input)
        await this.logSuccess(log.id, output, startedAt)
        return output
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        const shouldContinue = await this.shouldRetry(
          log.id, 
          errorMessage, 
          retryCount
        )

        if (!shouldContinue) {
          return { success: false, error: errorMessage }
        }

        const backoffMs = parseInt(process.env.RETRY_BACKOFF_MS || '5000') * (retryCount + 1)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        retryCount++
      }
    }
  }
}
