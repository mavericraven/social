import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { agentType: string } }
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

    const validAgents = ['Discovery', 'Scoring', 'Compliance', 'Scheduling', 'Publishing', 'Monitoring']
    if (!validAgents.includes(params.agentType)) {
      return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 })
    }

    const agentType = `${params.agentType}Agent`

    const log = await prisma.agentRunLog.create({
      data: {
        agentType,
        status: 'RUNNING',
        instagramAccountId,
        input: {},
        startedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `${agentType} triggered successfully`,
      logId: log.id
    })
  } catch (error) {
    console.error('Agent trigger error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
