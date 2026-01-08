import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

const DEFAULT_TIME_SLOTS = ['12:00', '15:00', '18:00', '20:00', '22:00']

export class SchedulingAgent extends BaseAgent {
  constructor() {
    super('SCHEDULING')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { instagramAccountId, targetDate } = input
    
    if (!instagramAccountId) {
      throw new Error('instagramAccountId is required')
    }

    const settings = await prisma.settings.findUnique({
      where: { instagramAccountId },
    })

    const timeSlots = (settings?.postingSchedule as string[]) || DEFAULT_TIME_SLOTS
    const dailyReelCount = settings?.dailyReelCount || 5
    const minReelGapMinutes = settings?.minReelGapMinutes || 90

    const targetDateObj = targetDate
      ? new Date(targetDate)
      : this.getNextBusinessDay()

    const scheduledForDay = await this.getAvailableSlots(
      instagramAccountId,
      targetDateObj,
      timeSlots,
      dailyReelCount
    )

    if (scheduledForDay.length === 0) {
      return { 
        success: true, 
        data: { scheduled: 0, message: 'No available slots for this date' } 
      }
    }

    const availableReels = await this.getAvailableReels(
      instagramAccountId,
      scheduledForDay.length
    )

    if (availableReels.length === 0) {
      return { 
        success: true, 
        data: { scheduled: 0, message: 'No available reels to schedule' } 
      }
    }

    const scheduledReels = await this.scheduleReels(
      availableReels,
      scheduledForDay,
      instagramAccountId
    )

    return {
      success: true,
      data: {
        scheduled: scheduledReels.length,
        date: targetDateObj.toISOString(),
        reels: scheduledReels,
        message: `Successfully scheduled ${scheduledReels.length} reels for ${targetDateObj.toDateString()}`,
      },
    }
  }

  private getNextBusinessDay(): Date {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date
  }

  private async getAvailableSlots(
    instagramAccountId: string,
    targetDate: Date,
    timeSlots: string[],
    dailyReelCount: number
  ): Promise<Date[]> {
    const existingSchedules = await prisma.schedule.findMany({
      where: {
        instagramAccountId,
        scheduledFor: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
        status: {
          notIn: [ReelStatus.FAILED, ReelStatus.DELETED],
        },
      },
      select: { scheduledFor: true },
    })

    const occupiedTimes = existingSchedules.map(s => 
      s.scheduledFor.getHours() * 60 + s.scheduledFor.getMinutes()
    )

    const availableSlots: Date[] = []

    for (const timeSlot of timeSlots) {
      const [hours, minutes] = timeSlot.split(':').map(Number)
      const slotMinutes = hours * 60 + minutes

      if (!occupiedTimes.includes(slotMinutes)) {
        const slotDate = new Date(targetDate)
        slotDate.setHours(hours, minutes, 0, 0)
        availableSlots.push(slotDate)

        if (availableSlots.length >= dailyReelCount) {
          break
        }
      }
    }

    return availableSlots
  }

  private async getAvailableReels(
    instagramAccountId: string,
    count: number
  ): Promise<any[]> {
    const scheduledReelIds = await prisma.schedule.findMany({
      where: {
        instagramAccountId,
        status: {
          in: [ReelStatus.SCHEDULED, ReelStatus.PUBLISHED],
        },
      },
      select: { reelId: true },
    })

    const scheduledIds = scheduledReelIds.map(s => s.reelId)

    const availableReels = await prisma.reel.findMany({
      where: {
        instagramAccountId,
        status: ReelStatus.APPROVED,
        id: {
          notIn: scheduledIds.length > 0 ? scheduledIds : undefined,
        },
      },
      orderBy: [
        { viralScore: 'desc' },
        { discoveredAt: 'desc' },
      ],
      take: count,
    })

    return availableReels
  }

  private async scheduleReels(
    reels: any[],
    timeSlots: Date[],
    instagramAccountId: string
  ): Promise<any[]> {
    const scheduledReels: any[] = []

    for (let i = 0; i < Math.min(reels.length, timeSlots.length); i++) {
      const reel = reels[i]
      const slot = timeSlots[i]

      const schedule = await prisma.schedule.create({
        data: {
          reelId: reel.id,
          instagramAccountId,
          scheduledFor: slot,
          status: ReelStatus.SCHEDULED,
        },
      })

      await prisma.reel.update({
        where: { id: reel.id },
        data: {
          status: ReelStatus.SCHEDULED,
        },
      })

      scheduledReels.push(schedule)
    }

    return scheduledReels
  }
}
