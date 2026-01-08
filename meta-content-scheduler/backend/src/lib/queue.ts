import Bull from 'bull'
import { redis } from './redis'
import { PublishingAgent } from '../agents/PublishingAgent'

export const publishQueue = new Bull('publish-reels', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

export async function setupQueueProcessor() {
  publishQueue.process(async (job) => {
    const { scheduleId } = job.data

    const agent = new PublishingAgent()
    const result = await agent.run({ scheduleId })

    if (!result.success) {
      throw new Error(result.error || 'Publish failed')
    }

    return result
  })

  publishQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result)
  })

  publishQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err)
  })

  console.log('Queue processor started')
}

export async function schedulePublishJob(scheduleId: string, scheduledFor: Date) {
  const delay = scheduledFor.getTime() - Date.now()

  const job = await publishQueue.add(
    { scheduleId },
    {
      delay: delay > 0 ? delay : 0,
      jobId: `publish-${scheduleId}`,
    }
  )

  console.log(`Scheduled publish job ${job.id} for ${scheduledFor}`)

  return job
}
