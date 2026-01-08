import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
      return NextResponse.json([])
    }

    const where: any = { instagramAccountId }
    if (startDate && endDate) {
      where.scheduledFor = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        reel: {
          include: {
            resort: true
          }
        }
      },
      orderBy: { scheduledFor: 'asc' }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Schedule list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { reelId, scheduledFor } = body

    if (!reelId || !scheduledFor) {
      return NextResponse.json({ error: 'Reel ID and scheduled time are required' }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        reelId,
        instagramAccountId,
        scheduledFor: new Date(scheduledFor)
      },
      include: {
        reel: {
          include: {
            resort: true
          }
        }
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Schedule create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
