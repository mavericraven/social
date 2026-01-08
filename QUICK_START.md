# Quick Start Guide - Vercel Deployment

Get Meta Content Scheduler up and running on Vercel in 15 minutes.

## Prerequisites

- Node.js 20+ LTS
- Vercel account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)
- Meta Developer Account

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd meta-content-scheduler
```

## Step 2: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 3: Install Project Dependencies

```bash
npm install
```

## Step 4: Create Vercel Project

```bash
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: meta-content-scheduler
# - Directory: ./
# - Override settings? No
```

## Step 5: Create Vercel Resources

### 5.1 Create Vercel Postgres

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Choose "Postgres"
6. Configure:
   - **Plan:** Hobby (free)
   - **Region:** Closest to you (recommend: us-east-1)
   - **Database Name:** meta_scheduler
7. Click "Create"

Copy the connection string (it looks like):
```
postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 5.2 Create Vercel KV

1. In the same "Storage" tab
2. Click "Create Database"
3. Choose "KV"
4. Configure:
   - **Plan:** Hobby (free)
   - **Region:** Same as Postgres
   - **Database Name:** meta_scheduler_kv
5. Click "Create"

Copy the credentials:
```
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx
```

### 5.3 Create Vercel Blob

1. In the same "Storage" tab
2. Click "Create Database"
3. Choose "Blob"
4. Configure:
   - **Plan:** Hobby (free)
   - **Region:** Same as Postgres
5. Click "Create"

Copy the token:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

### 5.4 Create Vercel Edge Config

1. Go to "Settings" > "Edge Config"
2. Click "Create Edge Config"
3. Configure:
   - **Name:** meta_scheduler_config
   - **Environment:** Production
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

Copy the ID:
```
EDGE_CONFIG_ID=xxx
```

## Step 6: Configure Environment Variables

### 6.1 Set Variables in Vercel Dashboard

Go to "Settings" > "Environment Variables" and add:

**Database:**
```
POSTGRES_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**KV Store:**
```
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token
```

**Blob Storage:**
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

**Edge Config:**
```
EDGE_CONFIG_ID=your-edge-config-id
```

**Meta API:**
```
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback
```

**JWT & Cron:**
```
JWT_SECRET=generate-with-openssl-rand-base64-32
CRON_SECRET=generate-with-openssl-rand-base64-32
```

**Settings:**
```
DISCOVERY_INTERVAL_MINUTES=60
SCORING_THRESHOLD=70
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=5000
RATE_LIMIT_PER_HOUR=200
NODE_ENV=production
```

### 6.2 Set Variables for Local Development

Create `.env.local` file:

```bash
cp .env.vercel.example .env.local
```

Edit `.env.local` with your Vercel credentials (from Step 5):
```env
# Vercel Postgres
POSTGRES_URL=postgresql://user:password@ep-xxx.../neondb

# Vercel KV
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Vercel Edge Config
EDGE_CONFIG_ID=your-edge-config-id

# Meta API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:3000/api/auth/callback

# JWT & Cron
JWT_SECRET=dev-jwt-secret
CRON_SECRET=dev-cron-secret

# Settings
DISCOVERY_INTERVAL_MINUTES=60
SCORING_THRESHOLD=70
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=5000
RATE_LIMIT_PER_HOUR=200

NODE_ENV=development
PORT=3000
```

## Step 7: Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to Vercel Postgres
npm run db:push

# Or create migration (recommended for production)
npx prisma migrate dev --name init
```

Verify connection:
```bash
# Open Prisma Studio
npm run db:studio
```

## Step 8: Run Locally

```bash
npm run dev
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- API Docs: http://localhost:3000/api/docs

## Step 9: Deploy to Vercel

### 9.1 Deploy Preview

```bash
vercel
```

This creates a preview URL where you can test before production.

### 9.2 Deploy to Production

```bash
vercel --prod
```

Or connect to GitHub for automatic deployments on push to main branch.

## Step 10: Verify Deployment

1. Check Vercel dashboard for build logs
2. Test production URL: https://your-project.vercel.app
3. Verify cron jobs are running (Vercel Dashboard > Cron Jobs)
4. Check Vercel resources are active (Storage tab)

## Step 11: Configure Meta OAuth

1. Go to https://developers.facebook.com
2. Select your app
3. Go to "Instagram" > "Basic Display"
4. Add "Valid OAuth Redirect URIs":
   ```
   https://your-project.vercel.app/api/auth/callback
   ```

Test OAuth flow:
1. Navigate to https://your-project.vercel.app/login
2. Click "Connect Instagram"
3. Complete OAuth flow
4. Verify token is stored in Vercel Postgres

## Common Issues

### Database Connection Failed
```
Error: Can't reach database server
```
**Solution:**
- Verify `POSTGRES_URL` is correct
- Check database is active in Vercel Dashboard
- Test with `npm run db:push`

### KV Connection Failed
```
Error: Failed to connect to KV
```
**Solution:**
- Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN`
- Check KV is active in Vercel Dashboard
- Test with simple KV operation

### Cron Jobs Not Running
```
Cron jobs not executing
```
**Solution:**
- Verify `vercel.json` has cron configuration
- Check cron paths exist: `app/api/cron/*/route.ts`
- Verify `CRON_SECRET` matches in cron routes
- Check Vercel cron logs in dashboard

## Next Steps

1. **Add Content**
   - Compile Maldives resort Instagram handles
   - Add resorts to database via Prisma Studio
   - Test discovery agent

2. **Test Agents**
   ```bash
   # Manually trigger agents
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/discovery
   ```

3. **Monitor**
   - Check Vercel dashboard logs
   - Monitor KV usage (Storage tab)
   - Track agent execution in database

4. **Customize**
   - Update Edge Config (Settings > Edge Config)
   - Adjust time slots
   - Modify viral score threshold
   - Create caption templates

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Edge Config](https://vercel.com/docs/storage/edge-config)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)

---

**You're now ready to use Meta Content Scheduler on Vercel! 🚀**

**Deployment Time: 15 minutes** vs hours for traditional infrastructure
**Setup Complexity:** 1 platform (Vercel) vs 5+ services
**Performance:** Sub-10ms global latency (Edge Network)
