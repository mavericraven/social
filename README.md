# Meta Content Scheduler

AI-powered Instagram Reels automation platform for Maldives resorts. Discovers, scores, schedules, and publishes high-quality Reels while maintaining Meta compliance and brand safety.

## 🚀 Features

- **Multi-Agent System:** 6 specialized agents for discovery, scoring, compliance, scheduling, publishing, and monitoring
- **Viral Scoring AI:** Intelligent scoring algorithm (0-100) based on engagement, recency, and quality metrics
- **Meta-Safe Publishing:** Rate limiting, posting jitter, retry logic, and full audit trails
- **Luxury Travel UI:** Clean, mobile-first interface inspired by Instagram Reels
- **Real-Time Dashboard:** Track daily schedules, performance metrics, and alerts
- **Calendar Management:** Drag-and-drop scheduling with thumbnail previews
- **Content Library:** Filter approved reels by viral score, resort, and date
- **Role-Based Access:** Admin, Editor, Viewer, and Client roles

## 📋 Project Structure

```
meta-content-scheduler/
├── app/                     # Next.js 14 App Router
│   ├── api/                # API routes (Vercel serverless)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── accounts/      # Instagram account management
│   │   ├── reels/         # Reel discovery & library
│   │   ├── schedule/      # Scheduling endpoints
│   │   ├── settings/      # Account preferences
│   │   ├── dashboard/     # Metrics & analytics
│   │   └── agents/        # Agent triggers
│   ├── login/             # Authentication page
│   ├── dashboard/         # Main dashboard
│   ├── calendar/          # Calendar view
│   ├── library/           # Reel library
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # React Query providers
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/         # Dashboard components
│   ├── calendar/          # Calendar components
│   ├── library/           # Library components
│   └── settings/          # Settings components
│
├── lib/                  # Server-side utilities
│   ├── prisma.ts         # Vercel Postgres client
│   ├── kv.ts             # Vercel KV client
│   ├── blob.ts           # Vercel Blob client
│   ├── edge-config.ts    # Vercel Edge Config client
│   ├── api-client.ts     # HTTP client (frontend)
│   └── utils.ts         # Helper functions
│
├── lib/agents/           # Agent implementations
│   ├── BaseAgent.ts
│   ├── DiscoveryAgent.ts
│   ├── ScoringAgent.ts
│   ├── ComplianceAgent.ts
│   ├── SchedulingAgent.ts
│   ├── PublishingAgent.ts
│   ├── MonitoringAgent.ts
│   └── orchestrator.ts
│
├── lib/services/         # Business logic services
│   ├── media-storage.ts  # Blob storage operations
│   ├── queue.ts         # KV-based queue management
│   └── cache.ts         # KV caching layer
│
├── prisma/               # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts          # Database seeding
│
├── types/               # TypeScript types
│   └── index.ts
│
├── docs/                # Documentation
│   ├── architecture/
│   │   └── system-architecture.md
│   ├── api/
│   │   └── api-documentation.md
│   └── deployment/
│       └── deployment-guide.md
│
├── README.md            # This file
├── PROJECT_SUMMARY.md    # Project overview
├── QUICK_START.md       # Quick start guide
├── TODO.md             # Implementation TODOs
└── next.config.js      # Next.js config
```

## 🛠️ Tech Stack

### Frontend & Backend
- **Framework:** Next.js 14 (App Router) - Full-stack deployment
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Data Fetching:** TanStack Query (React Query)
- **Date Handling:** date-fns, react-day-picker
- **Charts:** Recharts

### Vercel Infrastructure
- **Database:** Vercel Postgres (PostgreSQL 16)
- **Cache/Queue:** Vercel KV (Redis-compatible)
- **Storage:** Vercel Blob (object storage)
- **Config:** Vercel Edge Config (low-latency config)
- **API:** Meta Graph API (Instagram)
- **Deployment:** Vercel (serverless functions + edge runtime)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- Vercel account (free tier works)
- Meta Developer Account

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd meta-content-scheduler
```

2. **Setup Vercel Projects**
```bash
# Install Vercel CLI
npm i -g vercel

# Create Vercel project
vercel

# Create these resources in Vercel Dashboard:
# - Vercel Postgres database
# - Vercel KV store
# - Vercel Blob storage
# - Vercel Edge Config
```

3. **Install dependencies**
```bash
npm install
```

4. **Configure environment**
```bash
# Copy environment template
cp .env.example .env.local

# Add your Vercel credentials:
# POSTGRES_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb
# KV_REST_API_URL=https://xxx.kv.vercel-storage.com
# KV_REST_API_TOKEN=xxx
# BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
# EDGE_CONFIG=xxx

# Setup database
npm run db:generate
npm run db:migrate
```

5. **Run locally**
```bash
npm run dev
```

6. **Deploy to Vercel**
```bash
vercel --prod
```

### Access application
- Local: http://localhost:3000
- Production: https://your-project.vercel.app
- API Docs: https://your-project.vercel.app/api/docs

## 📊 Database Schema

See [database/schema.prisma](../database/schema.prisma) for complete schema definition.

### Key Models
- **User:** User accounts with roles
- **InstagramAccount:** Connected Instagram accounts
- **Resort:** Maldives resort profiles
- **Reel:** Discovered and scored Instagram Reels
- **Schedule:** Scheduled publishing times
- **AgentRunLog:** Agent execution logs
- **PublishAttempt:** Publish attempt tracking
- **Settings:** Account-specific preferences

## 🤖 Agent Architecture

### 1. Discovery Agent (Every Hour)
- Scans official Maldives resort Instagram handles
- Fetches Reels posted within last 7 days
- Checks for duplicates
- Stores metadata (views, likes, comments, etc.)

### 2. Scoring Agent (Every Hour)
- Calculates viral scores (0-100)
- Evaluates view-to-follower ratios
- Measures engagement velocity
- Assesses recency and visual quality
- Tags Reels as APPROVED (≥70) or REJECTED

### 3. Compliance Agent (Every Hour)
- Verifies official resort sources
- Checks for watermarks
- Ensures creator credits exist
- Validates captions
- Rejects non-compliant content

### 4. Scheduling Agent (Every Hour)
- Assigns approved Reels to time slots
- Ensures 90-minute minimum gap
- Manages publish queues
- Auto-replaces failed slots

### 5. Publishing Agent (Scheduled/Manual)
- Posts Reels via Meta Graph API
- Applies posting jitter
- Implements retry logic with backoff
- Logs all attempts
- Handles rate limiting

### 6. Monitoring Agent (Every 30 Minutes)
- Retries failed publishes
- Replaces failed schedules
- Monitors agent health
- Sends critical alerts
- Tracks performance metrics

## 🔐 Security & Compliance

### Meta Safety
- ✅ Official Graph API only (no scraping)
- ✅ Rate limiting enforced
- ✅ Posting jitter (random delays)
- ✅ Exponential backoff for retries
- ✅ Full audit trail
- ✅ Creator credit enforcement

### Application Security
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Encrypted credentials
- ✅ HTTPS enforcement
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)

## 📈 Success Metrics

- **Daily Posting:** 5 Reels per day
- **Compliance:** 0 account warnings/bans
- **Reach Uplift:** +30% organic reach
- **Efficiency:** <10 min discovery-to-schedule time
- **Success Rate:** >95% publish success rate

## 🌐 API Documentation

Complete API documentation available at:
- Interactive Swagger UI: http://localhost:3001/docs
- [API Documentation](../docs/api/api-documentation.md)

## 📚 Documentation

- [System Architecture](docs/architecture/system-architecture.md) - Vercel-first architecture
- [API Documentation](docs/api/api-documentation.md)
- [Deployment Guide](docs/deployment/deployment-guide.md) - Vercel deployment
- [Vercel Migration Summary](VERCEL_MIGRATION.md) - Benefits of Vercel stack

## 🔧 Configuration

### Environment Variables

**Local Development (.env.local):**
```env
# Vercel Postgres
POSTGRES_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb

# Vercel KV (Redis-compatible)
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token

# Vercel Blob (Object Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Vercel Edge Config
EDGE_CONFIG_ID=xxx

# Meta API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback

# JWT
JWT_SECRET=your-jwt-secret

# Settings
DISCOVERY_INTERVAL_MINUTES=60
SCORING_THRESHOLD=70
MAX_RETRY_ATTEMPTS=3
RATE_LIMIT_PER_HOUR=200
```

**Vercel Environment Variables (set in dashboard):**
- `POSTGRES_URL` - Automatically set by Vercel Postgres
- `KV_REST_API_URL` - Automatically set by Vercel KV
- `KV_REST_API_TOKEN` - Automatically set by Vercel KV
- `BLOB_READ_WRITE_TOKEN` - Automatically set by Vercel Blob
- `EDGE_CONFIG_ID` - Automatically set by Vercel Edge Config

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## 🚢 Deployment

See [Deployment Guide](../docs/deployment/deployment-guide.md) for detailed deployment instructions.

### Quick Deploy (Docker)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deploy (Vercel + AWS)

```bash
# Deploy frontend to Vercel
cd frontend
vercel --prod

# Deploy backend to AWS Elastic Beanstalk
cd backend
eb deploy production
```

## 📝 Development

### Running Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (dev only)
npx prisma migrate reset
```

### API Testing

```bash
# Get API docs
curl http://localhost:3001/docs

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@metacontentscheduler.com

## 🔮 Roadmap

### Phase 1: MVP (Current)
- ✅ Multi-agent system
- ✅ Viral scoring
- ✅ Daily scheduling (5 reels/day)
- ✅ Meta-safe publishing
- ✅ Basic monitoring

### Phase 2: Multi-Account
- ⏳ Multiple Instagram accounts per user
- ⏳ Account switching
- ⏳ Per-account settings

### Phase 3: Optimization & Ads
- ⏳ A/B testing captions
- ⏳ Performance analytics
- ⏳ Reel boosting suggestions
- ⏳ Facebook Reels cross-posting

### Future Enhancements
- ⏳ Story auto-generation
- ⏳ Trend analysis
- ⏳ Influencer collaboration detection
- ⏳ Multi-language support

## ⚠️ Disclaimer

This tool is designed for legitimate content curation from official sources. Users must:
- Only connect their own authorized accounts
- Respect Instagram's Terms of Service
- Give proper credit to content creators
- Not use for spam or deceptive practices

We are not affiliated with Meta Platforms, Inc. or Instagram.
