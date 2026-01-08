# System Architecture

## Overview

Meta Content Scheduler is a multi-agent AI-powered platform deployed on **Vercel's serverless infrastructure**, automating Instagram Reels discovery, scoring, scheduling, and publishing for Maldives resorts.

## Vercel-First Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                           │
│              (Global CDN + Edge Runtime)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │             Next.js 14 (Full-Stack)                 │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ Dashboard│  │ Calendar │  │ Library  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Serverless API Routes                │     │    │
│  │  │     (Vercel Serverless Functions)           │     │    │
│  │  │                                                │    │
│  │  │  /api/auth     /api/accounts                  │     │    │
│  │  │  /api/reels    /api/schedule                 │     │    │
│  │  │  /api/settings /api/dashboard                │     │    │
│  │  │  /api/agents  /api/webhooks                 │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │            Agent Orchestrator                │     │    │
│  │  │  (Cron Jobs via Vercel Cron)               │     │    │
│  │  │                                                │     │    │
│  │  │  Discovery  Scoring  Compliance               │     │    │
│  │  │  Scheduling Publishing  Monitoring             │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│ Vercel Postgres │   │   Vercel KV     │   │ Vercel Blob    │
│   (Database)    │   │  (Queue+Cache) │   │  (Media)       │
│                │   │                 │   │                │
│ - Users        │   │ - Job Queues   │   │ - Reel Videos  │
│ - Accounts     │   │ - Cache Layer  │   │ - Thumbnails  │
│ - Reels        │   │ - Rate Limits  │   │ - Media Assets │
│ - Schedules    │   │ - Sessions     │   │                │
│ - Logs         │   │                 │   │                │
└────────────────┘   └─────────────────┘   └────────────────┘
        │                   │                       │
        └───────────────────┴───────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Vercel Edge Config│
                    │   (Configuration)  │
                    │                    │
                    │ - Time Slots       │
                    │ - Rules           │
                    │ - Settings        │
                    └────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Meta Graph API   │
                    │  (Instagram)      │
                    └───────────────────┘
```

## Vercel Services Integration

### 1. Vercel Postgres (Database)
**Purpose:** Primary database for all metadata and logs

**Key Features:**
- Fully managed PostgreSQL 16
- Auto-scaling read replicas
- Point-in-time recovery
- Connection pooling
- Global edge caching

**Stored Data:**
- User accounts and roles
- Instagram account connections
- Maldives resort profiles
- Reel metadata (views, scores, status)
- Scheduling information
- Agent execution logs
- Publish attempt history

**Benefits:**
- ✅ Global edge caching (sub-millisecond reads)
- ✅ Automatic backups
- ✅ No server management
- ✅ Free tier up to 512MB

**Connection:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2. Vercel KV (Cache & Queues)
**Purpose:** Redis-compatible store for caching, queues, and sessions

**Key Features:**
- Redis-compatible API
- Global edge distribution
- Automatic failover
- Persistent storage
- 128GB storage per account

**Use Cases:**
- **Job Queues:** Agent task scheduling
- **Caching:** API responses, computed scores
- **Rate Limiting:** Request throttling
- **Sessions:** User session storage
- **Real-time Updates:** WebSocket state

**Queue Implementation:**
```typescript
// lib/services/queue.ts
import { kv } from '@vercel/kv'

export async function enqueueJob(jobType: string, data: any) {
  const jobId = `job:${Date.now()}:${Math.random()}`
  await kv.lpush(`queue:${jobType}`, JSON.stringify({ id: jobId, data }))
  await kv.incr(`queue:${jobType}:count`)
  return jobId
}

export async function dequeueJob(jobType: string) {
  const job = await kv.rpop(`queue:${jobType}`)
  if (!job) return null
  await kv.decr(`queue:${jobType}:count`)
  return JSON.parse(job)
}

export async function getQueueSize(jobType: string) {
  const count = await kv.get(`queue:${jobType}:count`)
  return parseInt(count || '0')
}
```

**Cache Implementation:**
```typescript
// lib/services/cache.ts
import { kv } from '@vercel/kv'

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await kv.get(key)
  return data ? JSON.parse(data) : null
}

export async function setCached<T>(key: string, value: T, ttl: number = 3600) {
  await kv.set(key, JSON.stringify(value), { ex: ttl })
}

export async function invalidateCache(pattern: string) {
  const keys = await kv.keys(pattern)
  if (keys.length > 0) {
    await kv.del(...keys)
  }
}
```

**Rate Limiting:**
```typescript
// lib/services/rate-limit.ts
import { kv } from '@vercel/kv'

export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`
  const current = await kv.incr(key)

  if (current === 1) {
    await kv.expire(key, window)
  }

  const remaining = Math.max(0, limit - current)
  return {
    allowed: current <= limit,
    remaining,
  }
}
```

**Benefits:**
- ✅ Sub-10ms latency globally
- ✅ Automatic scaling
- ✅ No Redis server management
- ✅ Free tier up to 256MB

### 3. Vercel Blob (Object Storage)
**Purpose:** Store media files (Reel videos, thumbnails)

**Key Features:**
- S3-compatible API
- Global CDN distribution
- Automatic compression
- Intelligent caching
- Pre-signed URLs

**Stored Content:**
- Reel video files (downloaded from Instagram)
- Thumbnail images
- Generated assets
- User-uploaded media

**Implementation:**
```typescript
// lib/blob.ts
import { put, list, del } from '@vercel/blob'

export async function uploadMedia(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const blob = await put(filename, file, {
    access: 'public',
    contentType,
  })
  return { url: blob.url, path: blob.pathname }
}

export async function listMedia(prefix: string): Promise<any[]> {
  const { blobs } = await list({ prefix })
  return blobs
}

export async function deleteMedia(path: string): Promise<void> {
  await del(path)
}

export async function getPresignedUrl(path: string): Promise<string> {
  const blob = await list({ prefix: path })
  return blob.blobs[0]?.url
}
```

**Media Download Service:**
```typescript
// lib/services/media-storage.ts
import { kv } from '@vercel/kv'
import { uploadMedia } from '../blob'

export async function downloadAndStoreReel(reelUrl: string, reelId: string) {
  // Check cache first
  const cached = await kv.get(`reel:${reelId}:url`)
  if (cached) return cached as string

  // Download from Instagram
  const response = await fetch(reelUrl)
  const buffer = Buffer.from(await response.arrayBuffer())

  // Store in Blob
  const filename = `reels/${reelId}.mp4`
  const { url } = await uploadMedia(buffer, filename, 'video/mp4')

  // Cache for 30 days
  await kv.set(`reel:${reelId}:url`, url, { ex: 2592000 })

  return url
}
```

**Benefits:**
- ✅ Global CDN delivery
- ✅ Automatic optimization
- ✅ Pay-per-use pricing
- ✅ Free tier up to 100GB

### 4. Vercel Edge Config (Configuration)
**Purpose:** Low-latency configuration and feature flags

**Key Features:**
- Sub-1ms reads globally
- Instant updates
- Versioned configurations
- A/B testing support

**Stored Configuration:**
- Posting time slots
- Viral score thresholds
- Agent settings
- Feature flags
- Rate limit rules

**Implementation:**
```typescript
// lib/edge-config.ts
import { get } from '@vercel/edge-config'

export async function getTimeSlots(): Promise<string[]> {
  const config = await get()
  return config.timeSlots || ['12:00', '15:00', '18:00', '20:00', '22:00']
}

export async function getViralThreshold(): Promise<number> {
  const config = await get()
  return config.viralThreshold || 70
}

export async function getFeatureFlag(flag: string): Promise<boolean> {
  const config = await get()
  return config.flags?.[flag] || false
}
```

**Usage in Agents:**
```typescript
// lib/agents/SchedulingAgent.ts
import { getTimeSlots } from '../edge-config'

export class SchedulingAgent extends BaseAgent {
  async execute(input: AgentInput): Promise<AgentOutput> {
    // Get time slots from Edge Config (sub-1ms)
    const timeSlots = await getTimeSlots()
    // ... scheduling logic
  }
}
```

**Benefits:**
- ✅ Sub-1ms reads globally
- ✅ Instant configuration updates
- ✅ No restarts needed
- ✅ Free tier included

## Serverless API Architecture

### API Routes (Vercel Serverless Functions)

```
app/api/
├── auth/
│   ├── login/route.ts         # User authentication
│   ├── verify/route.ts        # Token verification
│   └── meta/
│       ├── authorize/route.ts  # Meta OAuth start
│       └── callback/route.ts   # Meta OAuth callback
│
├── accounts/route.ts         # Instagram accounts CRUD
│
├── reels/
│   ├── route.ts              # List reels
│   ├── library/route.ts       # Approved library
│   └── [id]/
│       ├── route.ts          # Single reel details
│       ├── approve/route.ts  # Manual approve
│       └── reject/route.ts   # Manual reject
│
├── schedule/
│   ├── route.ts              # List schedules
│   ├── today/route.ts        # Today's schedule
│   ├── calendar/route.ts     # Calendar view
│   └── [id]/route.ts        # Schedule CRUD
│
├── settings/route.ts         # Settings CRUD
│
├── dashboard/
│   ├── overview/route.ts     # Metrics overview
│   ├── stats/route.ts        # Statistics
│   ├── performance/route.ts   # Performance data
│   ├── top-reels/route.ts    # Top performers
│   └── alerts/route.ts      # Current alerts
│
├── agents/
│   ├── status/route.ts       # Agent logs
│   ├── discovery/route.ts    # Trigger discovery
│   ├── scoring/route.ts      # Trigger scoring
│   ├── compliance/route.ts   # Trigger compliance
│   ├── scheduling/route.ts   # Trigger scheduling
│   ├── publishing/route.ts   # Trigger publishing
│   └── monitoring/route.ts  # Trigger monitoring
│
└── webhooks/
    ├── meta/route.ts         # Meta webhooks
    └── vercel/route.ts      # Vercel events
```

### Edge Runtime vs. Node.js Runtime

**Edge Runtime (API endpoints):**
- Sub-1ms cold start
- Global execution
- Limited to smaller functions
- Use for: Auth, basic CRUD, simple queries

**Node.js Runtime (Agents):**
- Full Node.js compatibility
- Longer timeout (60s)
- Use for: Agent execution, heavy processing, Meta API calls

**Example Runtime Configuration:**
```typescript
// app/api/auth/login/route.ts
export const runtime = 'edge'  // Edge runtime (fast)

// app/api/agents/discovery/route.ts
export const runtime = 'nodejs'  // Node.js runtime (full features)
```

## Cron Jobs (Agent Scheduling)

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/discovery",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/scoring",
      "schedule": "15 * * * *"
    },
    {
      "path": "/api/cron/compliance",
      "schedule": "30 * * * *"
    },
    {
      "path": "/api/cron/scheduling",
      "schedule": "45 * * * *"
    },
    {
      "path": "/api/cron/monitoring",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Cron Route Implementation

```typescript
// app/api/cron/discovery/route.ts
import { DiscoveryAgent } from '@/lib/agents/DiscoveryAgent'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Run agent
  const agent = new DiscoveryAgent()
  const result = await agent.run({ instagramAccountId: 'default' })

  return Response.json(result)
}
```

## Data Flow

### 1. Discovery Flow (Edge-Cached)
```
User Request → Edge Function → Vercel Postgres (cached)
                              ↓
                        Vercel KV (rate limit check)
                              ↓
                        Discovery Agent (Node.js)
                              ↓
                        Meta Graph API
                              ↓
                        Vercel Blob (media storage)
                              ↓
                        Vercel Postgres (store)
                              ↓
                        Vercel KV (cache update)
```

### 2. Scoring Flow (Edge-Optimized)
```
Scheduler → Cron Job → Scoring Agent (Node.js)
                              ↓
                        Vercel Postgres (fetch reels)
                              ↓
                        Vercel KV (cache scores)
                              ↓
                        Compute viral score
                              ↓
                        Vercel Postgres (update status)
                              ↓
                        Vercel Edge Config (update threshold check)
```

### 3. Publishing Flow (Queue-Based)
```
Scheduled Time → Vercel KV (queue)
                              ↓
                        Worker picks job
                              ↓
                        Publishing Agent (Node.js)
                              ↓
                        Vercel Blob (get media)
                              ↓
                        Vercel KV (rate limit check)
                              ↓
                        Meta Graph API
                              ↓
                        Vercel Postgres (log attempt)
                              ↓
                        Vercel KV (update rate limit)
```

## Performance Optimizations

### 1. Global Edge Caching
- Database queries cached at the edge
- API responses cached with SWR
- Media files served from CDN
- Configuration reads sub-1ms

### 2. Connection Pooling
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL,
    },
  },
  // Connection pooling
  connectionLimit: 10,
})
```

### 3. Query Optimization
- Indexed queries on all frequently accessed fields
- Selective field loading
- Pagination for large datasets
- Batch operations where possible

### 4. Caching Strategy
- L1: Edge Config (configuration)
- L2: Vercel KV (computed data)
- L3: Vercel Postgres (persistent data)
- L4: Vercel Blob (media CDN)

## Security & Compliance

### Edge-Level Security
- Edge middleware for auth
- Rate limiting at the edge
- Geo-blocking if needed
- IP allowlisting

### API Security
- JWT authentication
- CORS configuration
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection

### Meta Safety
- Rate limiting via Vercel KV
- Posting jitter (random delays)
- Retry logic with backoff
- Full audit trail in Vercel Postgres
- No scraping (official Graph API)

## Scaling Strategy

### Horizontal Scaling
- Vercel automatically scales API routes
- Edge functions scale globally
- Database auto-scales with Vercel Postgres
- KV scales automatically

### Vertical Scaling
- Upgrade Vercel plan for more resources
- Increase database instance size
- Increase KV storage limit
- Add more Cron job slots

### Cost Optimization
- Pay-per-use pricing
- Free tiers for development
- No server management costs
- No idle time charges

## Monitoring & Observability

### Vercel Analytics
- Real-time logs (streamed)
- Error tracking (automatic)
- Performance metrics (built-in)
- Request traces (Edge Runtime)

### Custom Monitoring
```typescript
// lib/monitoring.ts
import { kv } from '@vercel/kv'

export async function logAgentRun(agentType: string, duration: number, success: boolean) {
  const key = `metrics:${agentType}:${new Date().toISOString().slice(0, 10)}`
  await kv.incr(key)
  await kv.incr(`${key}:duration`, duration)
  await kv.incr(`${key}:${success ? 'success' : 'failure'}`)
}

export async function getAgentMetrics(agentType: string, days: number = 7) {
  const metrics = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = `metrics:${agentType}:${date.toISOString().slice(0, 10)}`
    const count = await kv.get(key)
    metrics.push({ date: date.toISOString(), count: parseInt(count || '0') })
  }
  return metrics
}
```

### Error Tracking
```typescript
// lib/error-handler.ts
export function logError(error: Error, context: any) {
  // Send to Vercel logs (automatic)
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }))

  // Optionally send to external service (Sentry, LogRocket)
}
```

## Deployment Architecture

### Production Deployment
```
Git Push → Vercel CI → Build → Deploy to Edge
                                      ↓
                          Vercel Postgres (auto)
                                      ↓
                          Vercel KV (auto)
                                      ↓
                          Vercel Blob (auto)
                                      ↓
                          Vercel Edge Config (auto)
```

### Preview Deployments
- Automatic on every PR
- Isolated Vercel environment
- Shared production database (optional)
- Rollback with one click

### Environment Management
- `.env.local` - Local development
- `.env.production` - Production (encrypted in Vercel)
- Preview environments - Auto-created from PRs

## Benefits of Vercel Architecture

### Performance
- ✅ Global edge deployment (sub-10ms latency)
- ✅ Automatic CDN for media
- ✅ Edge caching for databases
- ✅ Zero cold starts for hot routes

### Developer Experience
- ✅ Single codebase (Next.js full-stack)
- ✅ Deploy with `git push`
- ✅ No infrastructure management
- ✅ Preview deployments for PRs

### Cost Efficiency
- ✅ Pay-per-use (no idle charges)
- ✅ Free tiers for development
- ✅ Auto-scaling (no overprovisioning)
- ✅ Transparent pricing

### Reliability
- ✅ 99.99% uptime SLA
- ✅ Automatic failover
- ✅ Daily backups (Vercel Postgres)
- ✅ Point-in-time recovery

### Security
- ✅ Built-in DDoS protection
- ✅ Automatic HTTPS
- ✅ Edge-level rate limiting
- ✅ Isolated environments

## Comparison: Vercel vs Traditional AWS

| Feature | Vercel | AWS |
|---------|---------|-----|
| Setup Time | 5 min | 2+ hours |
| Server Management | None | Required |
| Cold Starts | Edge: 0ms, Node: 100ms | Lambda: 200ms |
| Database | Managed Postgres | RDS (complex setup) |
| Cache | Managed KV | ElastiCache (complex) |
| Storage | Managed Blob | S3 (configuration needed) |
| CDN | Built-in | CloudFront (setup needed) |
| Deploy | `vercel --prod` | Multiple steps |
| Preview Deployments | Automatic | Manual |
| Pricing | Pay-per-use | Many separate services |
| Free Tier | 1000h/mo, 100GB storage | Limited, 12mo only |

## Migration from Traditional Stack

### From Node.js + Fastify + PostgreSQL + Redis + S3:
```bash
# 1. Move API routes to Next.js app/api/
mv backend/src/api/* app/api/

# 2. Replace Prisma datasource
# OLD: DATABASE_URL=postgresql://localhost:5432/db
# NEW: POSTGRES_URL=postgresql://user:pass@ep-xxx.../neondb

# 3. Replace Redis client
# OLD: import Redis from 'ioredis'
# NEW: import { kv } from '@vercel/kv'

# 4. Replace S3 client
# OLD: import S3 from '@aws-sdk/client-s3'
# NEW: import { put, list, del } from '@vercel/blob'

# 5. Deploy
vercel
```

This migration reduces infrastructure complexity from 5 services to 1 unified platform.
