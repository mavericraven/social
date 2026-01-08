# API Documentation

## Base URL

```
Development: http://localhost:3001
Production: https://api.metacontentscheduler.com
```

## Authentication

All API requests (except `/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
}
```

### POST /api/auth/verify
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "userId": "clx...",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

### GET /api/auth/meta/authorize
Get Meta OAuth authorization URL.

**Response (200):**
```json
{
  "authUrl": "https://www.facebook.com/v19.0/dialog/oauth?client_id=..."
}
```

### POST /api/auth/meta/callback
Exchange Meta authorization code for access token.

**Request Body:**
```json
{
  "code": "authorization_code_from_meta"
}
```

**Response (200):**
```json
{
  "accessToken": "IGQVJY...",
  "expiresIn": 5184000,
  "user": {
    "id": "123456789",
    "username": "resort_username"
  }
}
```

---

## Instagram Accounts

### GET /api/accounts
Get all Instagram accounts for authenticated user.

**Response (200):**
```json
{
  "id": "clx...",
  "userId": "clx...",
  "metaAccountId": "178414...",
  "metaUsername": "resort_username",
  "status": "ACTIVE",
  "lastSyncAt": "2024-01-07T10:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/accounts
Connect new Instagram account.

**Request Body:**
```json
{
  "metaAccountId": "178414...",
  "metaUsername": "resort_username",
  "accessToken": "IGQVJY...",
  "tokenExpiresAt": "2024-06-01T00:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "metaAccountId": "178414...",
  "metaUsername": "resort_username",
  "status": "ACTIVE"
}
```

### GET /api/accounts/:id
Get specific Instagram account details.

**Response (200):**
```json
{
  "id": "clx...",
  "metaAccountId": "178414...",
  "metaUsername": "resort_username",
  "schedules": [
    {
      "id": "clx...",
      "reel": { ... },
      "scheduledFor": "2024-01-07T12:00:00Z",
      "status": "SCHEDULED"
    }
  ]
}
```

### DELETE /api/accounts/:id
Delete Instagram account.

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

---

## Reels

### GET /api/reels
Get all reels with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (DISCOVERED, SCORING, APPROVED, REJECTED, SCHEDULED, PUBLISHED, FAILED)
- `resortId` (optional): Filter by resort
- `minViralScore` (optional): Minimum viral score
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "reels": [
    {
      "id": "clx...",
      "metaId": "180706...",
      "mediaUrl": "https://...",
      "thumbnailUrl": "https://...",
      "caption": "Beautiful sunset at the resort...",
      "views": 150000,
      "likes": 25000,
      "comments": 500,
      "shares": 100,
      "viralScore": 85,
      "viewToFollowRatio": 2.5,
      "engagementRate": 0.17,
      "resort": {
        "id": "clx...",
        "name": "Paradise Resort",
        "instagramHandle": "@paradiseresort"
      },
      "status": "APPROVED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /api/reels/library
Get library of approved reels ready for scheduling.

**Query Parameters:**
- `minViralScore` (optional, default: 70): Minimum viral score

**Response (200):**
```json
[
  {
    "id": "clx...",
    "thumbnailUrl": "https://...",
    "viralScore": 85,
    "views": 150000,
    "resort": {
      "name": "Paradise Resort",
      "instagramHandle": "@paradiseresort"
    }
  }
]
```

### GET /api/reels/:id
Get specific reel details.

**Response (200):**
```json
{
  "id": "clx...",
  "metaId": "180706...",
  "mediaUrl": "https://...",
  "thumbnailUrl": "https://...",
  "caption": "Beautiful sunset...",
  "views": 150000,
  "likes": 25000,
  "viralScore": 85,
  "status": "APPROVED",
  "scoreDetails": {
    "viewToFollowRatio": 90,
    "engagementRate": 95,
    "recencyScore": 80,
    "visualQualityScore": 100,
    "audioTrendScore": 80
  },
  "schedules": [
    {
      "id": "clx...",
      "scheduledFor": "2024-01-07T12:00:00Z",
      "publishAttempts": [ ... ]
    }
  ]
}
```

### POST /api/reels/:id/approve
Manually approve a reel.

**Response (200):**
```json
{
  "id": "clx...",
  "status": "APPROVED"
}
```

### POST /api/reels/:id/reject
Manually reject a reel.

**Response (200):**
```json
{
  "id": "clx...",
  "status": "REJECTED"
}
```

---

## Schedule

### GET /api/schedule
Get scheduled reels with filters.

**Query Parameters:**
- `instagramAccountId` (optional): Filter by account
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)

**Response (200):**
```json
[
  {
    "id": "clx...",
    "reel": {
      "id": "clx...",
      "thumbnailUrl": "https://...",
      "viralScore": 85,
      "resort": { ... }
    },
    "instagramAccount": { ... },
    "scheduledFor": "2024-01-07T12:00:00Z",
    "publishedAt": null,
    "status": "SCHEDULED",
    "publishAttempts": []
  }
]
```

### GET /api/schedule/today
Get today's scheduled reels.

**Response (200):**
```json
[
  {
    "id": "clx...",
    "reel": { ... },
    "scheduledFor": "2024-01-07T12:00:00Z",
    "status": "SCHEDULED"
  }
]
```

### GET /api/schedule/calendar
Get calendar view of scheduled reels.

**Query Parameters:**
- `month` (optional, default: current month): Month (1-12)
- `year` (optional, default: current year): Year

**Response (200):**
```json
[
  {
    "id": "clx...",
    "date": "2024-01-07",
    "time": "12:00",
    "reel": {
      "id": "clx...",
      "thumbnailUrl": "https://...",
      "viralScore": 85,
      "resort": {
        "name": "Paradise Resort",
        "instagramHandle": "@paradiseresort"
      }
    },
    "status": "SCHEDULED"
  }
]
```

### POST /api/schedule
Create new schedule.

**Request Body:**
```json
{
  "reelId": "clx...",
  "instagramAccountId": "clx...",
  "scheduledFor": "2024-01-07T12:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "reelId": "clx...",
  "scheduledFor": "2024-01-07T12:00:00Z",
  "status": "SCHEDULED"
}
```

### PUT /api/schedule/:id
Update schedule time.

**Request Body:**
```json
{
  "scheduledFor": "2024-01-07T15:00:00Z"
}
```

**Response (200):**
```json
{
  "id": "clx...",
  "scheduledFor": "2024-01-07T15:00:00Z"
}
```

### DELETE /api/schedule/:id
Delete schedule and return reel to library.

**Response (200):**
```json
{
  "message": "Schedule deleted successfully"
}
```

---

## Settings

### GET /api/settings/:accountId
Get account settings.

**Response (200):**
```json
{
  "id": "clx...",
  "instagramAccountId": "clx...",
  "postingSchedule": ["12:00", "15:00", "18:00", "20:00", "22:00"],
  "captionTemplate": null,
  "dailyReelCount": 5,
  "minReelGapMinutes": 90,
  "viralScoreThreshold": 70
}
```

### PUT /api/settings/:accountId
Update account settings.

**Request Body:**
```json
{
  "postingSchedule": ["12:00", "15:00", "18:00", "20:00", "22:00"],
  "captionTemplate": "Custom caption template...",
  "dailyReelCount": 5,
  "minReelGapMinutes": 90,
  "viralScoreThreshold": 70
}
```

**Response (200):**
```json
{
  "id": "clx...",
  "postingSchedule": ["12:00", "15:00", "18:00", "20:00", "22:00"],
  "dailyReelCount": 5,
  "viralScoreThreshold": 70
}
```

---

## Dashboard

### GET /api/dashboard/overview
Get dashboard overview metrics.

**Response (200):**
```json
{
  "totalReels": 500,
  "totalPublished": 350,
  "totalViews": 25000000,
  "averageViralScore": 78,
  "todaySchedules": [
    {
      "id": "clx...",
      "reel": { ... },
      "scheduledFor": "2024-01-07T12:00:00Z",
      "status": "SCHEDULED"
    }
  ]
}
```

### GET /api/dashboard/stats
Get dashboard statistics.

**Query Parameters:**
- `period` (optional, default: "7"): Number of days

**Response (200):**
```json
{
  "byStatus": [
    {
      "status": "PUBLISHED",
      "_count": 50
    }
  ],
  "byPublishStatus": [
    {
      "status": "SUCCESS",
      "_count": 48
    }
  ],
  "period": "7 days"
}
```

### GET /api/dashboard/performance
Get recent performance data.

**Response (200):**
```json
[
  {
    "publishedAt": "2024-01-07T12:00:00Z",
    "views": 150000,
    "likes": 25000,
    "comments": 500,
    "shares": 100,
    "viralScore": 85,
    "resort": {
      "name": "Paradise Resort"
    }
  }
]
```

### GET /api/dashboard/top-reels
Get top performing reels.

**Query Parameters:**
- `limit` (optional, default: 10): Number of reels

**Response (200):**
```json
[
  {
    "id": "clx...",
    "thumbnailUrl": "https://...",
    "views": 500000,
    "likes": 100000,
    "viralScore": 92,
    "resort": {
      "name": "Luxury Resort",
      "instagramHandle": "@luxuryresort"
    }
  }
]
```

### GET /api/dashboard/alerts
Get current alerts and issues.

**Response (200):**
```json
{
  "alerts": [
    {
      "type": "error",
      "message": "3 publish failures in the last hour",
      "count": 3
    },
    {
      "type": "warning",
      "message": "Rate limiting is active",
      "count": 1
    }
  ],
  "total": 2
}
```

---

## Agents

### GET /api/agents/status
Get agent execution status logs.

**Query Parameters:**
- `agentType` (optional): Filter by agent type (DISCOVERY, SCORING, COMPLIANCE, SCHEDULING, PUBLISHING, MONITORING)
- `limit` (optional, default: 10): Number of logs

**Response (200):**
```json
[
  {
    "id": "clx...",
    "agentType": "DISCOVERY",
    "status": "COMPLETED",
    "input": { ... },
    "output": { ... },
    "startedAt": "2024-01-07T10:00:00Z",
    "completedAt": "2024-01-07T10:05:00Z",
    "durationMs": 300000,
    "retryCount": 0
  }
]
```

### POST /api/agents/discovery/run
Manually trigger Discovery Agent.

**Request Body:**
```json
{
  "instagramAccountId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "discovered": 15,
    "reels": [ ... ],
    "message": "Successfully discovered 15 new reels"
  }
}
```

### POST /api/agents/scoring/run
Manually trigger Scoring Agent.

**Request Body:**
```json
{
  "instagramAccountId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "scored": 15,
    "approved": 12,
    "rejected": 3,
    "message": "Scored 15 reels: 12 approved, 3 rejected"
  }
}
```

### POST /api/agents/compliance/run
Manually trigger Compliance Agent.

**Request Body:**
```json
{
  "instagramAccountId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verified": 11,
    "rejected": 1,
    "message": "Compliance check complete: 11 verified, 1 rejected"
  }
}
```

### POST /api/agents/scheduling/run
Manually trigger Scheduling Agent.

**Request Body:**
```json
{
  "instagramAccountId": "clx...",
  "targetDate": "2024-01-08"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "scheduled": 5,
    "date": "2024-01-08T00:00:00Z",
    "reels": [ ... ],
    "message": "Successfully scheduled 5 reels for Jan 8, 2024"
  }
}
```

### POST /api/agents/publishing/run
Manually trigger Publishing Agent.

**Request Body:**
```json
{
  "scheduleId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Reel published successfully",
    "schedule": { ... },
    "mediaId": "180706..."
  }
}
```

### POST /api/agents/monitoring/run
Manually trigger Monitoring Agent.

**Request Body:**
```json
{
  "instagramAccountId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "retriedPublishes": 2,
    "failedSchedulesReplaced": 1,
    "alertsSent": 0,
    "agentHealthChecked": 5,
    "message": "Monitoring complete"
  }
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

## Rate Limits

- **Default:** 30 requests per minute, 200 per hour
- **Publish endpoint:** Stricter limits (Meta API constraints)
- **Rate limit headers:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp (Unix epoch)
