import { BaseAgent, AgentInput, AgentOutput } from './BaseAgent'
import { prisma } from '../lib/prisma'
import { ReelStatus } from '@prisma/client'

export class DiscoveryAgent extends BaseAgent {
  constructor() {
    super('DISCOVERY')
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { instagramAccountId } = input
    
    if (!instagramAccountId) {
      throw new Error('instagramAccountId is required')
    }

    const account = await prisma.instagramAccount.findUnique({
      where: { id: instagramAccountId },
      include: {
        user: true,
      },
    })

    if (!account) {
      throw new Error('Instagram account not found')
    }

    const resorts = await prisma.resort.findMany({
      where: { isActive: true },
    })

    if (resorts.length === 0) {
      return { success: true, data: { discovered: 0, message: 'No active resorts found' } }
    }

    let discoveredCount = 0
    const discoveredReels: any[] = []

    for (const resort of resorts) {
      try {
        const reels = await this.fetchResortReels(resort, account)
        
        for (const reelData of reels) {
          const existing = await prisma.reel.findUnique({
            where: { metaId: reelData.metaId },
          })

          if (existing) {
            continue
          }

          const reel = await prisma.reel.create({
            data: {
              metaId: reelData.metaId,
              instagramAccountId: account.id,
              resortId: resort.id,
              mediaUrl: reelData.mediaUrl,
              thumbnailUrl: reelData.thumbnailUrl,
              caption: reelData.caption,
              views: reelData.views,
              likes: reelData.likes,
              comments: reelData.comments,
              shares: reelData.shares,
              followerCount: reelData.followerCount,
              isFromOfficial: true,
              hasWatermark: false,
              creatorCredited: true,
              postedAt: reelData.postedAt,
              status: ReelStatus.DISCOVERED,
            },
          })

          discoveredReels.push(reel)
          discoveredCount++
        }
      } catch (error) {
        console.error(`Error discovering reels for resort ${resort.name}:`, error)
      }
    }

    return {
      success: true,
      data: {
        discovered: discoveredCount,
        reels: discoveredReels,
        message: `Successfully discovered ${discoveredCount} new reels`,
      },
    }
  }

  private async fetchResortReels(resort: any, account: any): Promise<any[]> {
    const reels: any[] = []

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    try {
      const response = await fetch(
        `https://graph.instagram.com/v19.0/${resort.officialAccountId}/media`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.data) {
        return reels
      }

      for (const media of data.data) {
        if (media.media_type !== 'VIDEO' && media.media_type !== 'CAROUSEL_ALBUM') {
          continue
        }

        const postedAt = new Date(media.timestamp)
        if (postedAt < sevenDaysAgo) {
          continue
        }

        const mediaDetails = await this.fetchMediaDetails(media.id, account.accessToken)

        reels.push({
          metaId: media.id,
          mediaUrl: media.media_url || mediaDetails?.media_url,
          thumbnailUrl: media.thumbnail_url || mediaDetails?.thumbnail_url,
          caption: media.caption,
          views: mediaDetails?.video_view_count || 0,
          likes: media.like_count || 0,
          comments: media.comments_count || 0,
          shares: mediaDetails?.share_count || 0,
          followerCount: resort.instagramHandle ? 0 : 0, 
          postedAt,
        })
      }
    } catch (error) {
      console.error('Error fetching resort reels:', error)
      throw error
    }

    return reels
  }

  private async fetchMediaDetails(mediaId: string, accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v19.0/${mediaId}?fields=media_url,thumbnail_url,video_view_count,share_count,caption,timestamp`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      return null
    }
  }
}
