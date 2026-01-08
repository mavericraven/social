# Deployment Guide - Vercel Infrastructure

## Overview

This guide covers deploying Meta Content Scheduler to **Vercel's serverless platform**, utilizing:
- **Vercel Postgres** - Managed PostgreSQL database
- **Vercel KV** - Redis-compatible cache and queue
- **Vercel Blob** - Object storage for media
- **Vercel Edge Config** - Low-latency configuration
- **Vercel Edge Network** - Global CDN and edge runtime

## Prerequisites

- Node.js 20+ LTS
- Vercel account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)
- Meta Developer Account

---

## Step 1: Project Setup

### 1.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 1.2 Initialize Vercel Project

```bash
cd meta-content-scheduler
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: meta-content-scheduler
# - Directory: ./
# - Override settings? No
```

### 1.3 Install Project Dependencies

```bash
npm install
```

---

## Step 2: Create Vercel Resources

### 2.1 Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Choose "Postgres"
6. Configure:
   - **Plan:** Hobby (free) or Pro
   - **Region:** Closest to your users (recommended: us-east-1)
   - **Database Name:** meta_scheduler
7. Click "Create"

**Copy the Connection String:**
```bash
# It will look like:
# postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2.2 Create Vercel KV Store

1. In the same "Storage" tab
2. Click "Create Database"
3. Choose "KV"
4. Configure:
   - **Plan:** Hobby (free) or Pro
   - **Region:** Same as Postgres
   - **Database Name:** meta_scheduler_kv
5. Click "Create"

**Copy the KV Credentials:**
```bash
# REST API URL: https://xxx.kv.vercel-storage.com
# REST API Token: xxx
```

### 2.3 Create Vercel Blob Storage

1. In the same "Storage" tab
2. Click "Create Database"
3. Choose "Blob"
4. Configure:
   - **Plan:** Hobby (free) or Pro
   - **Region:** Same as Postgres
5. Click "Create"

**Copy the Blob Token:**
```bash
# Read/Write Token: vercel_blob_xxx
```

### 2.4 Create Vercel Edge Config

1. Go to "Settings" > "Edge Config"
2. Click "Create Edge Config"
3. Configure:
   - **Name:** meta_scheduler_config
   - **Environment:** Production (and Preview if desired)
4. Add initial configuration:
   ```json
   {
     "timeSlots": ["12:00", "15:00", "18:00", "20:00", "22:00"],
     "viralThreshold": 70,
     "dailyReelCount": 5,
     "minReelGapMinutes": 90,
     "flags": {
       "enableAutoRetry": true,
       "enableNotifications": false
     }
   }
   ```
5. Click "Create"

**Copy the Edge Config ID:**
```bash
# Config ID: xxx
```

---

## Step 3: Configure Environment Variables

### 3.1 Set Variables in Vercel Dashboard

Go to "Settings" > "Environment Variables" and add:

**Database:**
- `POSTGRES_URL` - Your Vercel Postgres connection string
- `DATABASE_URL` - Same as POSTGRES_URL (for Prisma)

**KV Store:**
- `KV_REST_API_URL` - Your Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Your Vercel KV REST API Token
- `REDIS_URL` - Optional legacy compatibility

**Blob Storage:**
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob read/write token

**Edge Config:**
- `EDGE_CONFIG_ID` - Your Edge Config ID

**Meta API:**
- `META_APP_ID` - Your Meta Application ID
- `META_APP_SECRET` - Your Meta Application Secret
- `META_REDIRECT_URI` - https://your-project.vercel.app/api/auth/callback

**JWT:**
- `JWT_SECRET` - Your JWT secret (generate: `openssl rand -base64 32`)

**Agent Configuration:**
- `DISCOVERY_INTERVAL_MINUTES` - 60
- `SCORING_THRESHOLD` - 70
- `MAX_RETRY_ATTEMPTS` - 3
- `RETRY_BACKOFF_MS` - 5000
- `RATE_LIMIT_PER_HOUR` - 200

**Cron Security:**
- `CRON_SECRET` - Generate secure secret for cron jobs

**Node Configuration:**
- `NODE_ENV` - production

### 3.2 Set Variables for Local Development

Create `.env.local` file:

```bash
# Vercel Postgres (use connection string from Step 2.1)
POSTGRES_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Vercel KV (use credentials from Step 2.2)
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token-here

# Vercel Blob (use token from Step 2.3)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Vercel Edge Config (use ID from Step 2.4)
EDGE_CONFIG_ID=your-edge-config-id

# Meta API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:3000/api/auth/callback

# JWT
JWT_SECRET=your-jwt-secret-here

# Cron Security (local development)
CRON_SECRET=your-cron-secret-here

# Settings
DISCOVERY_INTERVAL_MINUTES=60
SCORING_THRESHOLD=70
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=5000
RATE_LIMIT_PER_HOUR=200

NODE_ENV=development
```

---

## Step 4: Database Setup

### 4.1 Generate Prisma Client

```bash
npx prisma generate
```

### 4.2 Run Database Migrations

```bash
# Push schema to Vercel Postgres
npx prisma db push

# Or create migration first (recommended)
npx prisma migrate dev --name init

# For production
npx prisma migrate deploy
```

### 4.3 Seed Database (Optional)

```bash
npx prisma db seed
```

### 4.4 Verify Connection

```bash
npx prisma studio
```

This opens Prisma Studio where you can view and manage your database.

---

## Step 5: Configure Vercel Cron Jobs

### 5.1 Create vercel.json Configuration

Create `vercel.json` in project root:

```json
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
  ],
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 5.2 Create Cron Route Handlers

Create these files (examples):

**`app/api/cron/discovery/route.ts`**
```typescript
import { DiscoveryAgent } from '@/lib/agents/DiscoveryAgent'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const agent = new DiscoveryAgent()
    const result = await agent.run({ instagramAccountId: 'default' })
    return Response.json(result)
  } catch (error) {
    console.error('Discovery cron failed:', error)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

Repeat for other cron jobs (scoring, compliance, scheduling, monitoring).

### 5.3 Test Cron Jobs Locally

```bash
# Manually trigger cron
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/discovery
```

---

## Step 6: Deploy to Vercel

### 6.1 Deploy Preview

```bash
# Deploy to preview (test)
vercel
```

This creates a preview URL where you can test before production.

### 6.2 Deploy to Production

```bash
# Deploy to production
vercel --prod
```

Or connect to GitHub for automatic deployments on push to main branch.

### 6.3 Verify Deployment

1. Check Vercel dashboard for build logs
2. Test preview URL
3. Check that all routes are working:
   - https://your-project.vercel.app/
   - https://your-project.vercel.app/api/docs
   - https://your-project.vercel.app/api/dashboard/overview

---

## Step 7: Configure Meta OAuth

### 7.1 Update Meta Developer Console

1. Go to https://developers.facebook.com
2. Select your app
3. Go to "Instagram" > "Basic Display"
4. Add "Valid OAuth Redirect URIs":
   - `https://your-project.vercel.app/api/auth/callback`

### 7.2 Test OAuth Flow

1. Navigate to https://your-project.vercel.app/login
2. Click "Connect Instagram"
3. Complete OAuth flow
4. Verify token is stored in Vercel Postgres

---

## Step 8: Monitor and Scale

### 8.1 Vercel Dashboard Monitoring

Go to your project dashboard to monitor:

**Analytics:**
- Request counts
- Response times
- Error rates
- Geographic distribution

**Logs:**
- Real-time logs from Edge and Node.js runtimes
- Filter by route or error
- Download logs for analysis

**Storage:**
- Vercel Postgres usage and performance
- Vercel KV memory and storage
- Vercel Blob storage usage

### 8.2 Scaling Your Resources

**Upgrade Vercel Postgres:**
- Go to Storage > Postgres > Settings
- Change plan (Hobby → Pro → Enterprise)
- More connections, storage, and features

**Upgrade Vercel KV:**
- Go to Storage > KV > Settings
- Change plan (Hobby → Pro → Enterprise)
- More storage and operations

**Upgrade Vercel Blob:**
- Go to Storage > Blob > Settings
- Change plan (Hobby → Pro → Enterprise)
- More storage and bandwidth

### 8.3 Edge Config Updates

Update configuration without redeploying:

1. Go to Settings > Edge Config
2. Edit values (e.g., change time slots)
3. Changes propagate globally in <1 second
4. No deployment needed

---

## Local Development Setup

### Option 1: Connect to Vercel Resources

Use `.env.local` with Vercel credentials (from Step 3.2):

```bash
npm run dev
```

### Option 2: Use Local Resources

For full offline development:

```bash
# Install Docker
docker-compose up -d

# Start Next.js
npm run dev
```

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: scheduler
      POSTGRES_PASSWORD: password
      POSTGRES_DB: meta_scheduler
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Update `.env.local`:
```bash
POSTGRES_URL=postgresql://scheduler:password@localhost:5432/meta_scheduler
REDIS_URL=redis://localhost:6379
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**
1. Verify `POSTGRES_URL` is correct
2. Check firewall allows Vercel IP ranges
3. Test connection: `npx prisma db push`

### KV Connection Issues

**Error:** `Failed to connect to KV`

**Solutions:**
1. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN`
2. Check KV is active in Vercel dashboard
3. Test connection:
   ```typescript
   import { kv } from '@vercel/kv'
   await kv.set('test', 'hello')
   const value = await kv.get('test')
   console.log(value) // Should be 'hello'
   ```

### Blob Upload Issues

**Error:** `Failed to upload to Blob`

**Solutions:**
1. Verify `BLOB_READ_WRITE_TOKEN`
2. Check Blob storage limit (100GB free)
3. Test upload:
   ```typescript
   import { put } from '@vercel/blob'
   await put('test.txt', Buffer.from('hello'), { access: 'public' })
   ```

### Cron Jobs Not Running

**Error:** Cron jobs not executing

**Solutions:**
1. Verify `vercel.json` configuration
2. Check cron paths exist
3. Test manually with curl
4. Check Vercel cron logs
5. Verify `CRON_SECRET` is set

### Rate Limiting Issues

**Error:** Too many requests

**Solutions:**
1. Check KV rate limit implementation
2. Adjust `RATE_LIMIT_PER_HOUR`
3. Monitor KV usage in dashboard
4. Consider upgrading KV plan

### Deployment Failures

**Error:** Build failed

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `prisma generate` runs before build
3. Check environment variables are set
4. Review TypeScript errors
5. Test locally: `npm run build`

---

## Performance Optimization

### 1. Edge Caching

Cache API responses at the edge:

```typescript
// app/api/reels/route.ts
import { unstable_cache } from 'next/cache'

export const revalidate = 3600 // 1 hour

export async function GET() {
  // Response cached for 1 hour at the edge
  return Response.json(data)
}
```

### 2. Database Connection Pooling

Optimize Prisma for serverless:

```typescript
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_URL,
      },
    },
    // Connection pooling for serverless
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 3. KV Caching

Cache expensive operations:

```typescript
import { kv } from '@vercel/kv'

export async function getCachedReels() {
  const cached = await kv.get('reels:approved')
  if (cached) return JSON.parse(cached)

  const reels = await prisma.reel.findMany({
    where: { status: 'APPROVED' }
  })

  await kv.set('reels:approved', JSON.stringify(reels), { ex: 300 })
  return reels
}
```

### 4. CDN for Media

Use Blob's built-in CDN:

```typescript
import { put } from '@vercel/blob'

const blob = await put(filename, buffer, {
  access: 'public', // Served from CDN
  contentType: 'video/mp4',
})

// URL is globally cached
console.log(blob.url)
```

---

## Security Best Practices

### 1. Edge Middleware

Protect routes at the edge:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rate limiting at the edge
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `ratelimit:${ip}`
  
  // Implement rate limit check using Vercel KV
  
  // Auth check for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const token = request.headers.get('authorization')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### 2. Environment Variables Security

- Never commit `.env.local` to Git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use different secrets for production and preview

### 3. Cron Job Security

Always verify cron secret:

```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... cron logic
}
```

### 4. Meta API Security

- Use HTTPS only
- Validate OAuth state
- Store tokens securely (encrypted)
- Rotate Meta app secret regularly

---

## Cost Estimation (Vercel)

### Hobby Plan (Free Tier)

| Resource | Limit | Cost |
|-----------|--------|------|
| Serverless Functions | 1000h/mo | Free |
| Vercel Postgres | 512MB storage | Free |
| Vercel KV | 256MB storage | Free |
| Vercel Blob | 100GB storage | Free |
| Edge Config | Included | Free |
| Bandwidth | 100GB/mo | Free |

**Total: $0/month**

### Pro Plan (Recommended for Production)

| Resource | Limit | Cost |
|-----------|--------|------|
| Serverless Functions | Unlimited | $20/mo |
| Vercel Postgres | 8GB storage | $20/mo |
| Vercel KV | 1GB storage | $10/mo |
| Vercel Blob | 500GB storage | $20/mo |
| Edge Config | Included | Free |
| Bandwidth | 1TB/mo | $40/mo |

**Total: ~$110/month**

### Enterprise Plan

Custom pricing with:
- Unlimited storage
- Dedicated support
- SLA guarantees
- Advanced features

---

## Backup & Disaster Recovery

### Automatic Backups

**Vercel Postgres:**
- Daily automatic backups
- 7-day retention (Hobby)
- 30-day retention (Pro)
- Point-in-time recovery available

**Vercel KV:**
- Automatic persistence
- No manual backups needed

**Vercel Blob:**
- Immutable objects
- No backups needed (redownload from source)

### Manual Backups

Export database:

```bash
# Using Prisma
npx prisma db pull

# Or using pg_dump
pg_dump $POSTGRES_URL > backup.sql
```

Import database:

```bash
# Using Prisma
npx prisma db push

# Or using psql
psql $POSTGRES_URL < backup.sql
```

---

## Rollback Procedure

### Quick Rollback

```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback
```

### Database Rollback

```bash
# Use Prisma Studio to revert changes
npx prisma studio

# Or restore from backup
psql $POSTGRES_URL < backup.sql
```

### Edge Config Rollback

1. Go to Settings > Edge Config
2. View version history
3. Revert to previous version
4. Changes apply globally in <1 second

---

## Monitoring & Alerts

### Vercel Analytics

**Real-time Metrics:**
- Request count
- Response time (p50, p95, p99)
- Error rate
- Geographic distribution

**Logs:**
- Edge runtime logs
- Node.js runtime logs
- Filter by route
- Export logs

### Custom Monitoring

Set up external monitoring:

```typescript
// lib/monitoring.ts
import { kv } from '@vercel/kv'

export async function trackMetric(metric: string, value: number) {
  const key = `metrics:${metric}:${new Date().toISOString().slice(0, 10)}`
  await kv.incr(key)
  await kv.incr(`${key}:total`, value)
}

// Use in your code
await trackMetric('api_requests', 1)
await trackMetric('reels_published', 1)
await trackMetric('errors', 1)
```

### Alerting

Configure Vercel to send alerts:

1. Go to Settings > Notifications
2. Add integrations:
   - Email alerts
   - Slack webhook
   - PagerDuty
   - Custom webhook
3. Set thresholds:
   - Error rate > 1%
   - Response time > 1000ms
   - Build failures

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run type check
        run: npm run typecheck
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Secrets in GitHub

Add these secrets in GitHub repository settings:
- `VERCEL_TOKEN` - Your Vercel token
- `ORG_ID` - Your Vercel organization ID
- `PROJECT_ID` - Your Vercel project ID

---

## Migration from Traditional Stack

### From Node.js + Fastify + PostgreSQL + Redis + S3

**Migration Steps:**

1. **Move API Routes to Next.js:**
```bash
# Old structure
backend/src/api/auth.ts
backend/src/api/accounts.ts

# New structure
app/api/auth/login/route.ts
app/api/accounts/route.ts
```

2. **Update Database Connection:**
```typescript
// OLD
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

// NEW
import { kv } from '@vercel/kv'
```

3. **Update Storage:**
```typescript
// OLD
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
const s3 = new S3Client({ region: 'us-east-1' })

// NEW
import { put } from '@vercel/blob'
const blob = await put(filename, buffer, { access: 'public' })
```

4. **Update Crons:**
```typescript
// OLD (node-cron)
cron.schedule('0 * * * *', runDiscovery)

// NEW (Vercel Cron)
// app/api/cron/discovery/route.ts
export async function GET() { /* discovery logic */ }
```

5. **Deploy:**
```bash
vercel
```

**Benefits of Migration:**
- Reduced infrastructure complexity (5 services → 1 platform)
- No server management
- Faster deployments
- Built-in scaling
- Global edge network

---

## Best Practices

### 1. Use Edge Runtime for Fast APIs

```typescript
// app/api/auth/login/route.ts
export const runtime = 'edge' // Sub-1ms cold start

export async function POST(request: Request) {
  // Fast auth logic
}
```

### 2. Use Node.js Runtime for Agents

```typescript
// app/api/agents/discovery/route.ts
export const runtime = 'nodejs' // Full Node.js features

export async function POST(request: Request) {
  // Agent logic with full Node.js support
}
```

### 3. Cache Aggressively

- Cache at the edge (Vercel)
- Cache in KV (Redis)
- Cache expensive queries
- Use appropriate TTL values

### 4. Monitor Performance

- Track response times
- Monitor error rates
- Watch database query times
- Check KV hit rates

### 5. Use Preview Deployments

- Test every PR
- Catch issues before production
- Share preview URLs with stakeholders
- Rollback easily

---

## Support

For issues or questions:

1. **Vercel Documentation:** https://vercel.com/docs
2. **Vercel Postgres:** https://vercel.com/docs/storage/vercel-postgres
3. **Vercel KV:** https://vercel.com/docs/storage/vercel-kv
4. **Vercel Blob:** https://vercel.com/docs/storage/vercel-blob
5. **Edge Config:** https://vercel.com/docs/storage/edge-config
6. **Next.js:** https://nextjs.org/docs
7. **Prisma:** https://www.prisma.io/docs

---

## Summary

Deploying to Vercel provides:

- ✅ **5-minute setup** vs hours/days for traditional infrastructure
- ✅ **Zero server management** - fully managed services
- ✅ **Global edge deployment** - sub-10ms latency worldwide
- ✅ **Auto-scaling** - no manual intervention needed
- ✅ **Pay-per-use** - no idle charges
- ✅ **Built-in monitoring** - logs, metrics, alerts
- ✅ **Preview deployments** - test before production
- ✅ **Instant rollbacks** - one-click deployment history
- ✅ **Free tier** - develop for $0

The Vercel architecture significantly reduces operational complexity while providing better performance, security, and developer experience compared to traditional AWS deployment.
