import { kv, set, get, incr } from '../kv'

export interface Job {
  id: string
  type: string
  data: any
  createdAt: Date
}

export async function enqueueJob(jobType: string, data: any): Promise<string> {
  const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
  const job: Job = {
    id: jobId,
    type: jobType,
    data,
    createdAt: new Date(),
  }

  await kv.lpush(`queue:${jobType}`, JSON.stringify(job))
  await incr(`queue:${jobType}:count`)
  
  return jobId
}

export async function dequeueJob(jobType: string): Promise<Job | null> {
  const jobData = await kv.rpop(`queue:${jobType}`)
  if (!jobData) return null

  await kv.decr(`queue:${jobType}:count`)
  return JSON.parse(jobData)
}

export async function getQueueSize(jobType: string): Promise<number> {
  const count = await kv.get(`queue:${jobType}:count`)
  return parseInt(count || '0')
}

export async function peekQueue(jobType: string, count: number = 10): Promise<Job[]> {
  const jobs = await kv.lrange(`queue:${jobType}`, 0, count - 1)
  return jobs.map(job => JSON.parse(job))
}

export async function clearQueue(jobType: string): Promise<void> {
  const queueKey = `queue:${jobType}`
  await kv.del(queueKey)
  await kv.del(`${queueKey}:count`)
}

export async function enqueueScheduledJob(
  jobType: string,
  data: any,
  scheduledFor: Date
): Promise<string> {
  const jobId = `scheduled:${jobType}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
  const job: Job = {
    id: jobId,
    type: jobType,
    data,
    createdAt: new Date(),
  }

  const score = Math.floor(scheduledFor.getTime() / 1000)
  await kv.zadd(`scheduled:${jobType}`, score, JSON.stringify(job))
  
  return jobId
}

export async function getDueJobs(jobType: string): Promise<Job[]> {
  const now = Math.floor(Date.now() / 1000)
  const jobs = await kv.zrangebyscore(`scheduled:${jobType}`, 0, now)
  
  const parsedJobs: Job[] = []
  for (const job of jobs) {
    parsedJobs.push(JSON.parse(job))
  }
  
  return parsedJobs
}

export async function removeScheduledJob(jobType: string, jobId: string): Promise<void> {
  const job = await zrange(`scheduled:${jobType}`, 0, -1)
  for (const jobData of job) {
    const parsed = JSON.parse(jobData)
    if (parsed.id === jobId) {
      await kv.zrem(`scheduled:${jobType}`, jobData)
      break
    }
  }
}

export async function getJobStats(jobType: string): Promise<{
  queued: number
  scheduled: number
}> {
  const queued = await getQueueSize(jobType)
  const scheduled = await kv.zcard(`scheduled:${jobType}`)
  
  return {
    queued,
    scheduled,
  }
}

export async function retryJob(job: Job): Promise<string> {
  await enqueueJob(job.type, job.data)
  return job.id
}

export async function moveJobToFailed(job: Job, error: string): Promise<void> {
  await kv.lpush(`failed:${job.type}`, JSON.stringify({
    ...job,
    error,
    failedAt: new Date(),
  }))
  await incr(`failed:${job.type}:count`)
}

export async function getFailedJobs(jobType: string, count: number = 10): Promise<any[]> {
  const jobs = await kv.lrange(`failed:${jobType}`, 0, count - 1)
  return jobs.map(job => JSON.parse(job))
}

export async function clearFailedJobs(jobType: string): Promise<void> {
  await kv.del(`failed:${jobType}`)
  await kv.del(`failed:${jobType}:count`)
}
