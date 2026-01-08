import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

export class ScoringAgent extends BaseAgent {
  constructor() {
    super('SCORING')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { instagramAccountId } = input
    
    if (!instagramAccountId) {
      throw new Error('instagramAccountId is required')
    }

    const settings = await prisma.settings.findUnique({
      where: { instagramAccountId },
    })

    const scoreThreshold = settings?.viralScoreThreshold || 70

    const pendingReels = await prisma.reel.findMany({
      where: {
        status: ReelStatus.DISCOVERED,
        instagramAccountId,
      },
      include: {
        resort: true,
      },
    })

    if (pendingReels.length === 0) {
      return { 
        success: true, 
        data: { scored: 0, approved: 0, rejected: 0, message: 'No pending reels to score' } 
      }
    }

    let scoredCount = 0
    let approvedCount = 0
    let rejectedCount = 0

    for (const reel of pendingReels) {
      try {
        const viralScore = await this.calculateViralScore(reel)
        const isApproved = viralScore >= scoreThreshold

        const scoreDetails = {
          viewToFollowRatio: this.calculateViewToFollowRatio(reel),
          engagementRate: this.calculateEngagementRate(reel),
          recencyScore: this.calculateRecencyScore(reel),
          visualQualityScore: this.calculateVisualQualityScore(reel),
          audioTrendScore: this.calculateAudioTrendScore(reel),
        }

        await prisma.reel.update({
          where: { id: reel.id },
          data: {
            viralScore,
            viewToFollowRatio: scoreDetails.viewToFollowRatio,
            engagementRate: scoreDetails.engagementRate,
            status: isApproved ? ReelStatus.APPROVED : ReelStatus.REJECTED,
            scoreDetails,
          },
        })

        scoredCount++
        if (isApproved) approvedCount++
        else rejectedCount++

      } catch (error) {
        console.error(`Error scoring reel ${reel.id}:`, error)
      }
    }

    return {
      success: true,
      data: {
        scored: scoredCount,
        approved: approvedCount,
        rejected: rejectedCount,
        message: `Scored ${scoredCount} reels: ${approvedCount} approved, ${rejectedCount} rejected`,
      },
    }
  }

  private async calculateViralScore(reel: any): Promise<number> {
    const scores = {
      viewToFollowRatio: this.calculateViewToFollowRatio(reel),
      engagementRate: this.calculateEngagementRate(reel),
      recency: this.calculateRecencyScore(reel),
      visualQuality: this.calculateVisualQualityScore(reel),
      audioTrend: this.calculateAudioTrendScore(reel),
    }

    const weights = {
      viewToFollowRatio: 0.30,
      engagementRate: 0.30,
      recency: 0.15,
      visualQuality: 0.15,
      audioTrend: 0.10,
    }

    const totalScore = 
      scores.viewToFollowRatio * weights.viewToFollowRatio +
      scores.engagementRate * weights.engagementRate +
      scores.recency * weights.recency +
      scores.visualQuality * weights.visualQuality +
      scores.audioTrend * weights.audioTrend

    return Math.min(Math.round(totalScore), 100)
  }

  private calculateViewToFollowRatio(reel: any): number {
    if (reel.followerCount === 0) return 0

    const ratio = reel.views / reel.followerCount
    
    if (ratio >= 3.0) return 100
    if (ratio >= 2.0) return 90
    if (ratio >= 1.5) return 80
    if (ratio >= 1.0) return 70
    if (ratio >= 0.5) return 50
    if (ratio >= 0.3) return 30
    
    return 20
  }

  private calculateEngagementRate(reel: any): number {
    if (reel.views === 0) return 0

    const engagement = reel.likes + reel.comments + (reel.shares || 0)
    const rate = engagement / reel.views

    if (rate >= 0.15) return 100
    if (rate >= 0.10) return 90
    if (rate >= 0.08) return 80
    if (rate >= 0.05) return 70
    if (rate >= 0.03) return 50
    
    return 30
  }

  private calculateRecencyScore(reel: any): number {
    const hoursSincePost = (Date.now() - new Date(reel.postedAt).getTime()) / (1000 * 60 * 60)

    if (hoursSincePost <= 24) return 100
    if (hoursSincePost <= 48) return 90
    if (hoursSincePost <= 72) return 80
    if (hoursSincePost <= 96) return 70
    if (hoursSincePost <= 120) return 50
    
    return 30
  }

  private calculateVisualQualityScore(reel: any): number {
    let score = 70

    if (!reel.hasWatermark) score += 20
    if (reel.isFromOfficial) score += 10
    if (reel.creatorCredited) score += 5

    return Math.min(score, 100)
  }

  private calculateAudioTrendScore(reel: any): number {
    return 80
  }
}
