import cron from 'node-cron'
import { DiscoveryAgent } from './DiscoveryAgent'
import { ScoringAgent } from './ScoringAgent'
import { ComplianceAgent } from './ComplianceAgent'
import { SchedulingAgent } from './SchedulingAgent'
import { PublishingAgent } from './PublishingAgent'
import { MonitoringAgent } from './MonitoringAgent'
import { prisma } from '../lib/prisma'

export async function startAgents() {
  console.log('Starting Agent Orchestrator...')

  const monitoringAgent = new MonitoringAgent()

  cron.schedule('*/30 * * * *', async () => {
    console.log('Running Monitoring Agent...')
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'ACTIVE' },
    })

    for (const account of accounts) {
      try {
        await monitoringAgent.run({ instagramAccountId: account.id })
      } catch (error) {
        console.error(`Monitoring agent failed for ${account.id}:`, error)
      }
    }
  })

  cron.schedule('0 * * * *', async () => {
    console.log('Running Discovery Agent...')
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'ACTIVE' },
    })

    const discoveryAgent = new DiscoveryAgent()

    for (const account of accounts) {
      try {
        await discoveryAgent.run({ instagramAccountId: account.id })
      } catch (error) {
        console.error(`Discovery agent failed for ${account.id}:`, error)
      }
    }
  })

  cron.schedule('15 * * * *', async () => {
    console.log('Running Scoring Agent...')
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'ACTIVE' },
    })

    const scoringAgent = new ScoringAgent()

    for (const account of accounts) {
      try {
        await scoringAgent.run({ instagramAccountId: account.id })
      } catch (error) {
        console.error(`Scoring agent failed for ${account.id}:`, error)
      }
    }
  })

  cron.schedule('30 * * * *', async () => {
    console.log('Running Compliance Agent...')
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'ACTIVE' },
    })

    const complianceAgent = new ComplianceAgent()

    for (const account of accounts) {
      try {
        await complianceAgent.run({ instagramAccountId: account.id })
      } catch (error) {
        console.error(`Compliance agent failed for ${account.id}:`, error)
      }
    }
  })

  cron.schedule('45 * * * *', async () => {
    console.log('Running Scheduling Agent...')
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'ACTIVE' },
    })

    const schedulingAgent = new SchedulingAgent()

    for (const account of accounts) {
      try {
        await schedulingAgent.run({ instagramAccountId: account.id })
      } catch (error) {
        console.error(`Scheduling agent failed for ${account.id}:`, error)
      }
    }
  })

  console.log('Agent Orchestrator started successfully')
}

export {
  DiscoveryAgent,
  ScoringAgent,
  ComplianceAgent,
  SchedulingAgent,
  PublishingAgent,
  MonitoringAgent,
}
