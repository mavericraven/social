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

    const reel = await prisma.reel.findUnique({
      where: { id: params.id },
      include: {
        resort: true,
        instagramAccount: true,
        schedules: true
      }
    })

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    return NextResponse.json(reel)
  } catch (error) {
    console.error('Reel details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['APPROVED', 'REJECTED', 'SCHEDULED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const reel = await prisma.reel.update({
      where: { id: params.id },
      data: { status },
      include: {
        resort: true
      }
    })

    return NextResponse.json(reel)
  } catch (error) {
    console.error('Reel update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
