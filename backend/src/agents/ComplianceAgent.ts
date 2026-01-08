import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super('COMPLIANCE')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { instagramAccountId } = input
    
    if (!instagramAccountId) {
      throw new Error('instagramAccountId is required')
    }

    const approvedReels = await prisma.reel.findMany({
      where: {
        status: ReelStatus.APPROVED,
        instagramAccountId,
      },
      include: {
        resort: true,
      },
    })

    if (approvedReels.length === 0) {
      return { 
        success: true, 
        data: { 
          verified: 0, 
          rejected: 0, 
          message: 'No approved reels to verify' 
        } 
      }
    }

    let verifiedCount = 0
    let rejectedCount = 0

    for (const reel of approvedReels) {
      try {
        const complianceCheck = await this.verifyCompliance(reel)

        if (complianceCheck.isCompliant) {
          await prisma.reel.update({
            where: { id: reel.id },
            data: {
              status: ReelStatus.APPROVED,
            },
          })
          verifiedCount++
        } else {
          await prisma.reel.update({
            where: { id: reel.id },
            data: {
              status: ReelStatus.REJECTED,
            },
          })
          rejectedCount++
        }
      } catch (error) {
        console.error(`Error verifying compliance for reel ${reel.id}:`, error)
        await prisma.reel.update({
          where: { id: reel.id },
          data: {
            status: ReelStatus.REJECTED,
          },
        })
        rejectedCount++
      }
    }

    return {
      success: true,
      data: {
        verified: verifiedCount,
        rejected: rejectedCount,
        message: `Compliance check complete: ${verifiedCount} verified, ${rejectedCount} rejected`,
      },
    }
  }

  private async verifyCompliance(reel: any): Promise<{ isCompliant: boolean; violations: string[] }> {
    const violations: string[] = []

    if (!reel.isFromOfficial) {
      violations.push('Not from official resort handle')
    }

    if (reel.hasWatermark) {
      violations.push('Contains watermark')
    }

    if (!reel.creatorCredited) {
      violations.push('Creator not credited')
    }

    const hasCaptionCredit = this.checkCaptionCredit(reel.caption)
    if (!hasCaptionCredit) {
      violations.push('Missing creator credit in caption')
    }

    return {
      isCompliant: violations.length === 0,
      violations,
    }
  }

  private checkCaptionCredit(caption: string | null): boolean {
    if (!caption) return false

    const creditPatterns = [
      /credit:/i,
      /📷/i,
      /video by/i,
      /@[\w.]+/i,
    ]

    return creditPatterns.some(pattern => pattern.test(caption))
  }
}
