import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        instagramAccounts: {
          include: {
            settings: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const settings = user.instagramAccounts[0]?.settings

    if (!settings) {
      return NextResponse.json({
        postingSchedule: ['12:00', '15:00', '18:00', '20:00', '22:00'],
        captionTemplate: 'Discover paradise in Maldives! 🏝️✨\n\nExperience the luxury of {resort_name}\n\n#Maldives #Travel #Luxury',
        dailyReelCount: 5,
        minReelGapMinutes: 90,
        viralScoreThreshold: 70,
      })
    }

    return NextResponse.json({
      postingSchedule: settings.postingSchedule,
      captionTemplate: settings.captionTemplate,
      dailyReelCount: settings.dailyReelCount,
      minReelGapMinutes: settings.minReelGapMinutes,
      viralScoreThreshold: settings.viralScoreThreshold,
    })
  } catch (error) {
    console.error('Settings get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        instagramAccounts: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const instagramAccountId = user.instagramAccounts[0]?.id

    if (!instagramAccountId) {
      return NextResponse.json({ error: 'No Instagram account found' }, { status: 400 })
    }

    const body = await request.json()

    const settings = await prisma.settings.upsert({
      where: { instagramAccountId },
      update: body,
      create: {
        instagramAccountId,
        ...body
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
