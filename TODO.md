# TODOs & Implementation Notes

## Meta Graph API Integration

### 🔴 High Priority

#### 1. Instagram Basic Display OAuth Flow
- [ ] Register Meta app and get App ID/Secret
- [ ] Configure OAuth redirect URI in Meta Developer Console
- [ ] Implement OAuth callback handler in `/api/auth/meta/callback`
- [ ] Exchange short-lived token for long-lived token (60-day expiry)
- [ ] Store access token securely in database
- [ ] Implement token refresh logic
- [ ] Add error handling for OAuth failures
- [ ] Test OAuth flow end-to-end

**Files:** `backend/src/api/auth.ts`, `frontend/app/login/page.tsx`

**Meta API Documentation:**
- https://developers.facebook.com/docs/instagram-basic-display-api
- https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions

#### 2. Instagram Content Publishing Permissions
- [ ] Request `instagram_content_publish` permission from Meta
- [ ] Add business verification if required
- [ ] Configure app review in Meta Developer Console
- [ ] Test permission grant flow
- [ ] Handle permission denied scenarios

**Required Permissions:**
- `instagram_basic` - Basic profile data
- `instagram_content_publish` - Publish Reels
- `pages_read_engagement` - Read engagement metrics

**Meta API Documentation:**
- https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish

#### 3. Reel Media Fetching
- [ ] Implement media list fetching from resort accounts
- [ ] Filter for REELS media type
- [ ] Fetch detailed media metrics (views, likes, comments, shares)
- [ ] Handle pagination for large media lists
- [ ] Cache media responses in Redis
- [ ] Implement error handling for rate limits

**Files:** `backend/src/agents/DiscoveryAgent.ts`

**Endpoints:**
- GET /{user-id}/media - Get media list
- GET /{media-id} - Get media details
- GET /{media-id}/insights - Get media metrics

#### 4. Media Upload & Publishing
- [ ] Implement container creation for video upload
- [ ] Handle video upload to Meta servers
- [ ] Implement publishing with container ID
- [ ] Add captions with hashtags
- [ ] Handle publish errors and retry logic
- [ ] Log publish results in database
- [ ] Implement posting jitter (1-5 seconds random delay)

**Files:** `backend/src/agents/PublishingAgent.ts`

**Endpoints:**
- POST /{user-id}/media - Create media container
- POST /{user-id}/media_publish - Publish media

**Rate Limits:**
- Media creation: ~200/hour per account
- Media publishing: ~25/hour per account

#### 5. Rate Limiting Implementation
- [ ] Track API request counts per endpoint
- [ ] Implement sliding window rate limiting
- [ ] Add exponential backoff on 429 responses
- [ ] Store rate limit data in Redis
- [ ] Add rate limit warnings in logs
- [ ] Implement graceful degradation when rate limited
- [ ] Add rate limit headers to API responses

**Files:** `backend/src/agents/PublishingAgent.ts`, `backend/src/lib/rate-limiter.ts` (new)

**Meta Rate Limits:**
- https://developers.facebook.com/docs/graph-api/using-graph-api/rate-limiting

### 🟡 Medium Priority

#### 6. Media Download & Storage
- [ ] Download Reel videos from Instagram
- [ ] Upload to S3-compatible storage
- [ ] Generate thumbnails
- [ ] Implement CDN for media delivery
- [ ] Add media cleanup (old files)
- [ ] Handle failed downloads

**Files:** `backend/src/services/media-storage.ts` (new)

#### 7. Comment & Engagement Tracking
- [ ] Fetch comments on published Reels
- [ ] Track comment sentiment (optional)
- [ ] Monitor engagement trends
- [ ] Alert on low engagement

**Files:** `backend/src/services/engagement-tracker.ts` (new)

#### 8. Hashtag & Trend Analysis
- [ ] Extract hashtags from captions
- [ ] Track trending hashtags
- [ ] Suggest optimal hashtags
- [ ] Analyze hashtag performance

**Files:** `backend/src/services/trend-analyzer.ts` (new)

#### 9. Webhook Integration
- [ ] Set up Meta webhooks for updates
- [ ] Handle media deleted events
- [ ] Handle account status changes
- [ ] Verify webhook signatures

**Files:** `backend/src/api/webhooks.ts` (new)

### 🟢 Low Priority

#### 10. Analytics Integration
- [ ] Track reach and impressions
- [ ] Monitor audience demographics
- [ ] Track follower growth
- [ ] Export analytics reports

#### 11. A/B Testing
- [ ] Test different captions
- [ ] Test different posting times
- [ ] Track performance variations
- [ ] Auto-select best performers

#### 12. Content Generation
- [ ] AI caption generation
- [ ] Auto-hashtag generation
- [ ] Video editing suggestions

---

## Frontend TODOs

### 🔴 High Priority

#### 1. Navigation & Layout
- [ ] Add navigation bar component
- [ ] Implement responsive menu
- [ ] Add user profile dropdown
- [ ] Add logout functionality
- [ ] Add loading states between pages

**Files:** `frontend/components/ui/navbar.tsx`, `frontend/components/ui/sidebar.tsx`

#### 2. Dashboard Enhancements
- [ ] Add real-time updates (WebSocket)
- [ ] Add performance charts
- [ ] Add engagement trends
- [ ] Add viral score distribution chart
- [ ] Add top performing resorts list

**Files:** `frontend/app/dashboard/page.tsx`, `frontend/components/dashboard/*`

#### 3. Calendar Improvements
- [ ] Implement drag-and-drop scheduling
- [ ] Add date range picker
- [ ] Show multiple reels per time slot
- [ ] Add conflict detection
- [ ] Add bulk reschedule

**Files:** `frontend/app/calendar/page.tsx`, `frontend/components/calendar/*`

#### 4. Library Features
- [ ] Add advanced filters (date range, viral score range)
- [ ] Add search by resort name
- [ ] Add sort options (date, score, engagement)
- [ ] Add preview modal for Reels
- [ ] Add bulk actions (approve, reject, schedule)

**Files:** `frontend/app/library/page.tsx`, `frontend/components/library/*`

#### 5. Settings Validation
- [ ] Add form validation
- [ ] Test settings with API
- [ ] Add timezone support
- [ ] Add caption template preview
- [ ] Save settings preferences to localStorage

**Files:** `frontend/app/settings/page.tsx`

### 🟡 Medium Priority

#### 6. Error Handling
- [ ] Global error boundary
- [ ] Error toast notifications
- [ ] Retry mechanisms
- [ ] Offline support
- [ ] Network status indicator

**Files:** `frontend/components/ErrorBoundary.tsx`, `frontend/lib/error-handler.ts`

#### 7. Loading States
- [ ] Skeleton loaders for all lists
- [ ] Progress indicators for long operations
- [ ] Optimistic UI updates
- [ ] Pull-to-refresh on mobile

**Files:** `frontend/components/ui/skeleton.tsx`

#### 8. Mobile Optimization
- [ ] Touch-friendly UI
- [ ] Mobile navigation drawer
- [ ] Responsive grid layouts
- [ ] Mobile-specific gestures
- [ ] PWA support

#### 9. Analytics Dashboard
- [ ] Create dedicated analytics page
- [ ] Add chart components (line, bar, pie)
- [ ] Add date range filters
- [ ] Export data functionality
- [ ] Compare time periods

**Files:** `frontend/app/analytics/page.tsx` (new)

### 🟢 Low Priority

#### 10. Dark Mode
- [ ] Implement theme toggle
- [ ] Dark mode styles for all components
- [ ] Persist theme preference

#### 11. Notifications
- [ ] In-app notifications
- [ ] Email notifications
- [ ] Browser push notifications
- [ ] Notification preferences

**Files:** `frontend/components/notifications/*`

#### 12. Internationalization (i18n)
- [ ] Add i18n support
- [ ] Translate UI text
- [ ] Support multiple languages
- [ ] Language switcher

---

## Backend TODOs

### 🔴 High Priority

#### 1. Agent Testing
- [ ] Write unit tests for all agents
- [ ] Write integration tests
- [ ] Mock Meta API responses
- [ ] Test error scenarios
- [ ] Test retry logic

**Files:** `backend/tests/agents/*`

#### 2. API Validation
- [ ] Add Zod schemas for all endpoints
- [ ] Validate request bodies
- [ ] Validate query parameters
- [ ] Add meaningful error messages

**Files:** `backend/src/validations/*`

#### 3. Database Optimizations
- [ ] Add database indexes
- [ ] Optimize queries
- [ ] Add connection pooling
- [ ] Implement query caching

**Files:** `backend/prisma/schema.prisma`

#### 4. Queue Management
- [ ] Set up Bull dashboard
- [ ] Monitor queue health
- [ ] Add job retry strategies
- [ ] Implement dead letter queue

**Files:** `backend/src/lib/queue.ts`

### 🟡 Medium Priority

#### 5. Logging & Monitoring
- [ ] Structured logging setup
- [ ] Log aggregation (ELK/Splunk)
- [ ] Performance monitoring (APM)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

**Files:** `backend/src/lib/logger.ts`

#### 6. Security Hardening
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting per user

**Files:** `backend/src/middleware/security.ts`

#### 7. Cache Implementation
- [ ] Cache API responses
- [ ] Cache database queries
- [ ] Cache invalidation strategy
- [ ] Redis caching layer

**Files:** `backend/src/lib/cache.ts`

#### 8. Background Jobs
- [ ] Token refresh job
- [ ] Old data cleanup job
- [ ] Analytics aggregation job
- [ ] Backup job

**Files:** `backend/src/jobs/*`

### 🟢 Low Priority

#### 9. Admin Features
- [ ] Admin dashboard
- [ ] User management
- [ ] System configuration
- [ ] Audit log viewer
- [ ] Bulk operations

#### 10. Performance Optimization
- [ ] Response compression
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Database query optimization

---

## Data & Content TODOs

### 🔴 High Priority

#### 1. Resort Data
- [ ] Compile list of official Maldives resorts
- [ ] Add resort Instagram handles
- [ ] Add resort metadata (location, amenities)
- [ ] Categorize resorts by region
- [ ] Add resort logos/images

**Files:** `database/seeds/resorts.ts` (new)

#### 2. Caption Templates
- [ ] Create default caption templates
- [ ] Add hashtag collections
- [ ] Add emoji sets
- [ ] CTA templates
- [ ] Seasonal templates

**Files:** `database/seeds/captions.ts` (new)

### 🟡 Medium Priority

#### 3. Seed Data
- [ ] Create test users
- [ ] Create test Instagram accounts
- [ ] Create sample resorts
- [ ] Create sample reels
- [ ] Create sample schedules

**Files:** `database/seeds/index.ts`

---

## DevOps & Infrastructure TODOs

### 🔴 High Priority

#### 1. CI/CD Pipeline
- [ ] Set up GitHub Actions
- [ ] Automated testing on PR
- [ ] Automated builds
- [ ] Automated deployments
- [ ] Rollback mechanism

**Files:** `.github/workflows/*`

#### 2. Monitoring Setup
- [ ] CloudWatch or Prometheus
- [ ] Grafana dashboards
- [ ] Alert configuration
- [ ] Log aggregation
- [ ] Uptime monitoring

#### 3. Backup Strategy
- [ ] Database backups
- [ ] Redis backups
- [ ] S3 backups
- [ ] Backup restoration testing
- [ ] Off-site backups

### 🟡 Medium Priority

#### 4. Infrastructure as Code
- [ ] Terraform configuration
- [ ] Docker Compose for dev
- [ ] Kubernetes manifests
- [ ] Helm charts
- [ ] Environment configuration

#### 5. Security Scanning
- [ ] Dependency vulnerability scanning
- [ ] Static code analysis
- [ ] Container security scanning
- [ ] Penetration testing
- [ ] Security audit

### 🟢 Low Priority

#### 6. Documentation
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Deployment guides
- [ ] Onboarding docs
- [ ] Troubleshooting guides

---

## Testing TODOs

### 🔴 High Priority

- [ ] Unit tests for all agents
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for critical flows
- [ ] Load testing for API
- [ ] Security testing

### 🟡 Medium Priority

- [ ] Component tests for React
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Accessibility tests

### 🟢 Low Priority

- [ ] Chaos engineering
- [ ] Disaster recovery testing
- [ ] User acceptance testing

---

## Known Issues & Limitations

### Meta API Limitations
1. **Rate Limits:** Instagram has strict API rate limits (~25-200 requests/hour per account)
   - Mitigation: Implement robust retry logic and backoff

2. **Token Expiry:** Long-lived tokens expire after 60 days
   - Mitigation: Implement automatic token refresh 7 days before expiry

3. **Permissions:** Instagram content publishing requires business verification
   - Mitigation: Guide users through verification process

4. **Media Availability:** Source Reels may be deleted
   - Mitigation: Auto-replace with alternative approved Reels

### Technical Limitations
1. **Discovery Latency:** Scanning all resorts takes time
   - Mitigation: Parallel processing and caching

2. **Scoring Accuracy:** AI scoring is approximate
   - Mitigation: Continuous model tuning and user feedback

3. **Publish Failures:** Network issues or API errors
   - Mitigation: Retry logic and auto-replacement

---

## Additional Resources

### Meta Documentation
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/content-publishing)
- [Rate Limiting](https://developers.facebook.com/docs/graph-api/using-graph-api/rate-limiting)
- [OAuth](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

### Development Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/) - Redis GUI
- [Bull Board](https://github.com/felixmosh/bull-board) - Queue dashboard
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - API documentation

### Best Practices
- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Best Practices](https://www.fastify.io/docs/latest/Guides/Best-Practices/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
