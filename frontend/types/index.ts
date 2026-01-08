export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'CLIENT'
}

export interface InstagramAccount {
  id: string
  userId: string
  metaAccountId: string
  metaUsername: string
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'WARNING'
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Resort {
  id: string
  name: string
  instagramHandle: string
  officialAccountId: string | null
  isActive: boolean
  region: string | null
}

export interface Reel {
  id: string
  metaId: string
  instagramAccountId: string
  resortId: string | null
  resort?: Resort
  mediaUrl: string
  thumbnailUrl: string
  caption: string | null
  views: number
  likes: number
  comments: number
  shares: number
  followerCount: number
  viralScore: number
  viewToFollowRatio: number
  engagementRate: number
  isFromOfficial: boolean
  hasWatermark: boolean
  creatorCredited: boolean
  discoveredAt: Date
  postedAt: Date
  status: 'DISCOVERED' | 'SCORING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'DELETED'
  scoreDetails?: any
}

export interface Schedule {
  id: string
  reelId: string
  reel?: Reel
  instagramAccountId: string
  instagramAccount?: InstagramAccount
  scheduledFor: Date
  publishedAt: Date | null
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'DELETED'
}

export interface Settings {
  id: string
  instagramAccountId: string
  postingSchedule: string[]
  captionTemplate: string | null
  dailyReelCount: number
  minReelGapMinutes: number
  viralScoreThreshold: number
}

export interface AgentRunLog {
  id: string
  agentType: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  instagramAccountId: string | null
  input?: any
  output?: any
  error?: string
  startedAt: Date
  completedAt: Date | null
  durationMs: number | null
  retryCount: number
}

export interface PublishAttempt {
  id: string
  scheduleId: string
  schedule?: Schedule
  instagramAccountId: string
  instagramAccount?: InstagramAccount
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRYING'
  mediaUploaded: boolean
  containerId: string | null
  mediaId: string | null
  error?: string
  errorDetails?: any
  attemptedAt: Date
  completedAt: Date | null
  retryCount: number
  nextRetryAt: Date | null
}

export interface DashboardOverview {
  totalReels: number
  totalPublished: number
  totalViews: number
  averageViralScore: number
  todaySchedules: Schedule[]
}

export interface CalendarSchedule {
  id: string
  date: string
  time: string
  reel: {
    id: string
    thumbnailUrl: string
    viralScore: number
    resort: Resort
  }
  status: string
}
