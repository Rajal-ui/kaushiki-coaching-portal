# Contributing to Kaushiki Coaching Portal

First off, thank you for considering contributing! This document covers everything you need to know to set up, test, and extend the platform.

---

## Table of Contents

1. [Development Setup](#1-development-setup)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Mock Data & Testing](#4-mock-data--testing)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Data Flow & Workflow](#6-data-flow--workflow)
7. [Workflow: How the Website Works](#7-workflow-how-the-website-works)
8. [Branching Strategy, Issues & PR Process](#8-branching-strategy-issues--pr-process)
9. [Testing & Verification](#9-testing--verification)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Development Setup

### Prerequisites

- **Node.js** v20+ (with npm)
- **PostgreSQL** 16 (install locally or use Railway free tier)
- **Redis** (optional — app falls back to in-memory store when unavailable)

### Installation

```bash
git clone https://github.com/Rajal-ui/kaushiki-coaching-portal.git
cd kaushiki-coaching-portal
cp .env.example .env
npm install
```

### Database Setup

```bash
# Apply all migrations
npx prisma migrate dev

# Seed development data (9 users, 4 batches, 40 attendance records, etc.)
npx prisma db seed

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### Start Development

```bash
npm run dev
# → http://localhost:3000
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/kaushiki_db` | PostgreSQL connection |
| `REDIS_URL` | No | `redis://localhost:6379` | Falls back to in-memory store |
| `JWT_ACCESS_SECRET` | Yes | — | HS256 key for access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | HS256 key for refresh tokens |
| `RAZORPAY_KEY_ID` | No | — | Test key for development |
| `RAZORPAY_KEY_SECRET` | No | — | Test secret (never in client) |
| `RAZORPAY_WEBHOOK_SECRET` | No | — | HMAC secret for webhook |
| `MSG91_AUTH_KEY` | No | — | MSG91 API key |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | — | Public Google client ID |
| `SENTRY_DSN` | No | — | Error tracking |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Public   │  │   Auth   │  │Dashboard │  │   API    │   │
│  │  Pages    │  │  Pages   │  │  Pages   │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│        │             │             │              │         │
│        ▼             ▼             ▼              ▼         │
│  ┌──────────────────────────────────────────────────┐      │
│  │           ProtectedRoute (Client-side)            │      │
│  │           authenticateRequest (Server)             │      │
│  └──────────────────────────────────────────────────┘      │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Prisma  │     │  Redis   │     │ Razorpay │
    │  (PG)    │     │ (cache/  │     │ (payments│
    │          │     │  queue)  │     │ webhook) │
    └──────────┘     └──────────┘     └──────────┘
```

### Key Design Decisions

- **Route Groups**: The app uses flat `/app` routing (no `(role)` route groups). Role protection is enforced per-page via the `ProtectedRoute` client component.
- **API & UI co-location**: Route handlers live in `/app/api/` alongside pages. No separate backend server.
- **Real-time via polling**: React Query `refetchInterval` (15–60s depending on data volatility) instead of WebSockets — appropriate for this scale.
- **Redis fallback**: In-memory `Map`-based store when Redis is unreachable. All Redis methods (`get/set/del/incr/expire/ttl/rpush/blpop`) have fallback implementations.
- **Auth**: Dual-mode (OTP + password login, Google OAuth). Tokens stored in `localStorage` (client) and verified via `authenticateRequest` (server).

### Directory Structure

```
app/
├── api/                  # All API route handlers
│   ├── admin/            # 17 admin endpoints (stats, reports, CRUD)
│   ├── auth/             # 7 auth endpoints
│   ├── batches/          # Batch CRUD + roster
│   ├── enrollments/      # Enrollment + payment scoping
│   ├── payments/         # Razorpay orders, webhook, refunds
│   ├── attendance/       # Attendance + bulk entry
│   ├── scores/           # Test scores
│   ├── doubts/           # Doubt queries + responses
│   ├── links/            # Parent-student linking
│   ├── notifications/    # In-app notifications (list, read, unread count)
│   ├── sms-logs/         # SMS audit log
│   ├── tracks/           # Public track listing (ISR)
│   ├── inquiries/        # Inquiry form + admin pipeline
│   ├── users/            # User listing by role
│   ├── settings/         # Site settings (admin)
│   └── health/           # Health check
├── dashboard/            # Role-based pages
│   ├── admin/            # 11 pages (analytics, CRUD, reports, notifications)
│   ├── student/          # 5 tabs + notifications page
│   ├── faculty/          # Home + 4 sub-pages (attendance, scores, doubts, notifications)
│   └── parent/           # Child selector + notifications page
├── about/                # Public about page
├── programs/[slug]/      # Public track detail
└── [login|signup|enroll]/ Auth + enrollment pages

components/
├── ui/                   # shadcn primitives (button, card, input, etc.)
├── layout/               # DashboardSidebar, TopBar, Providers
├── auth/                 # ProtectedRoute, Google One Tap
└── payment/              # RazorpayCheckout

lib/
├── auth/                 # jwt.ts, otp.ts, middleware.ts
├── db/                   # prisma.ts (singleton with Pg adapter)
├── sms/                  # msg91.ts, queue.ts, mock.ts
├── validators/           # Zod schemas per domain (auth, batches, etc.)
├── hooks/                # useRealtimeQuery.ts, useNotifications.ts
├── notifications.ts     # Notification creation helpers
├── razorpay.ts           # Razorpay API adapter
├── redis.ts              # Redis client + in-memory fallback
├── redis-fallback.ts     # Map-based Redis fallback
└── rate-limit.ts         # Redis-based rate limiter

workers/
└── sms-worker.ts         # Standalone Redis blpop SMS consumer

prisma/
├── schema.prisma         # 16 models, 10 enums
├── seed.ts               # Full development seed
└── migrations/           # All migrations
```

---

## 3. Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 16 App Router | SSR + API routes in one deployable |
| **Language** | TypeScript strict | Full type safety across DB ↔ API ↔ UI |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` | Type-safe queries, easy migrations |
| **Database** | PostgreSQL 16 | Reliable, full-text search, JSONB support |
| **Cache** | Redis 7 (w/ in-memory fallback) | OTP TTL, rate limiting, SMS queue |
| **Auth (OTP)** | bcryptjs + jose (HS256 JWT) | OTP hashes in Redis, 6-digit crypto-random |
| **Auth (OAuth)** | google-auth-library | Server-side ID token verification |
| **Payments** | Razorpay Node SDK | Create orders, capture, refund, webhook HMAC |
| **SMS** | MSG91 Flow API | DLT-compliant transactional SMS in India |
| **State** | @tanstack/react-query v5 | Auto-refetch intervals, optimistic updates |
| **Charts** | Recharts | React-native, responsive, composable |
| **UI** | Tailwind CSS 3 + shadcn/ui | Utility-first, consistent design tokens |
| **Icons** | Lucide React | Lightweight, tree-shakeable |
| **Validation** | Zod 4 | Schema-based, detailed error messages |
| **Testing** | Jest 30 + MSW 2 + Playwright 1.61 | Unit, integration, and E2E |
| **Linting** | ESLint 9 + Prettier | Consistent code style |
| **Git Hooks** | Husky 9 + lint-staged | Pre-commit quality gates |
| **CSV Export** | csv-stringify/sync | Report downloads |

---

## 4. Mock Data & Testing

### 💡 Local Development OTP Tip
> [!NOTE]
> **Phone Login / OTP Verification:** During local development, you do not need an external SMS gateway integration. When you trigger a phone login request, the generated 6-digit OTP is automatically logged directly to your terminal/server console. Simply copy it from your console to complete the sign-in flow.

### Seed Data (`prisma db seed`)

The seed creates fully connected mock data across all 16 models. Run it anytime to reset to a known state:

```bash
npx prisma migrate dev   # First time only
npx prisma db seed       # Any time to re-seed
```

### What Gets Seeded

| Model | Count | Details |
|-------|-------|---------|
| **User** | 9 | 1 admin, 3 faculty (Priya/Amit/Sunita), 3 students (Arjun/Sneha/Rohan), 2 parents (Suresh/Anita) |
| **ParentStudentLink** | 2 | Suresh↔Arjun (approved), Anita↔Sneha (approved) |
| **Track** | 4 | Classes 1–5, 6–10, 11–12 Commerce, CA Foundation |
| **Subject** | 11 | Mapped to tracks (Math, Science, Accountancy, etc.) |
| **Batch** | 4 | Math (Priya, 15 cap), Science (Amit, 12 cap), Accountancy (Priya, 10 cap), CA Foundation (Sunita, 8 cap) |
| **Enrollment** | 5 | Arjun → Math+Science (ACTIVE), Sneha → Accountancy+Math (ACTIVE), Rohan → CA Foundation (ACTIVE) |
| **Payment** | 5 | 4 SUCCEEDED (₹4.5L–₹6L), 1 FAILED (₹8L — Rohan's CA Foundation) |
| **Attendance** | 40 | 10 sessions × 5 student-batch combos. Mix of present/absent. Rohan: 50% attendance |
| **TestScore** | 11 | Across 4 batches. Arjun: 74–91%, Sneha: 88–95%, Rohan: 62–71% |
| **DoubtQuery** | 4 | 2 ANSWERED (Arjun's Math + Science), 2 OPEN (Sneha's Accountancy, Rohan's CA) |
| **Inquiry** | 5 | 2 NEW (Vijay, Deepak), 1 CONTACTED (Kavita), 1 ENROLLED (Priya), 1 CLOSED (Santosh) |
| **SmsLog** | 5 | 3 DELIVERED (confirmations), 1 SENT (payment failed), 1 FAILED (doubt answered) |
| **Notification** | 12 | Doubt answers, payments, enrollments, link approvals, inquiries |
| **SiteSetting** | 12 | Institution info, fee amounts, MSG91 template IDs |

### Login Credentials

All passwords: **`Kaushiki@123`**

| Role | Name | Phone | Use for testing |
|------|------|-------|-----------------|
| Admin | Rajesh Sharma | `9175498572` | Full admin portal access |
| Faculty | Priya Kulkarni | `9876543210` | Math + Accountancy batches |
| Faculty | Amit Desai | `9823456701` | Science batch |
| Faculty | Sunita Joshi | `9712345678` | CA Foundation batch |
| Student | Arjun Patil | `9900112233` | 2 enrolled batches, answered doubts |
| Student | Sneha Mehta | `9900223344` | 2 enrolled, open doubt |
| Student | Rohan Kadam | `9900334455` | 1 enrolled, low attendance, failed payment |
| Parent | Suresh Patil | `9800112233` | Linked to Arjun |
| Parent | Anita Mehta | `9800223344` | Linked to Sneha |

### Pre-configured Test Scenarios

1. **Student with low attendance (risk alert)**: Rohan (9900334455) — 50% attendance in CA Foundation batch. Admin dashboard risk alerts will show this.
2. **Student with failed payment**: Rohan's CA Foundation enrollment has a FAILED payment (₹8L, card declined).
3. **Student with answered doubts**: Arjun (9900112233) — both Math and Science doubts have faculty responses.
4. **Student with open doubt**: Sneha (9900223344) — Accountancy doubt unresponded. Rohan — CA Foundation doubt unresponded.
5. **Faculty with multiple batches**: Priya (9876543210) — teaches both Math and Accountancy.
6. **Parent with linked student**: Suresh (9800112233) can see Arjun's data. Anita (9800223344) can see Sneha's.
7. **Inquiry pipeline**: All 5 statuses represented (NEW, CONTACTED, ENROLLED, CLOSED).
8. **Batch fill rates**: All 4 batches are well under capacity — good for testing enrollment flow.

---

## 5. API Endpoints Reference

### Authentication (public)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/send-otp` | `{ phone: "9900112233" }` | 200 OTP sent, 429 rate-limited |
| POST | `/api/auth/verify-otp` | `{ phone, otp }` | `{ accessToken, refreshToken }` |
| POST | `/api/auth/signup` | `{ phone, name, role }` | Creates user, returns tokens |
| POST | `/api/auth/login` | `{ login, password }` | Password auth (email or phone) |
| POST | `/api/auth/google` | `{ credential }` | Google OAuth ID token |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Rotates token pair |
| POST | `/api/auth/logout` | — | Deletes refresh token (auth) |

### Public

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/tracks` | ISR 60s, force-static |
| GET | `/api/tracks/[id]/batches` | ISR 60s |
| POST | `/api/inquiries` | Rate-limited 5/IP/hr, honeypot spam protection |
| GET | `/api/health` | DB + Redis connectivity check |

### Batches (admin/faculty)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET/POST | `/api/batches` | Admin only |
| PATCH | `/api/batches/[id]` | Admin only |
| GET | `/api/batches/[id]/roster` | Admin, Faculty (own batches) |
| GET | `/api/batches/my` | Faculty only |

### Enrollment & Payments

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/enrollments` | Student/Parent |
| GET | `/api/enrollments/me` | Student only |
| POST | `/api/payments/create-order` | Student/Parent |
| POST | `/api/payments/webhook` | Public (HMAC verified) |
| POST | `/api/payments/[id]/refund` | Admin only |

### Operations

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/attendance` | Role-scoped |
| POST | `/api/attendance/bulk` | Faculty/Admin |
| GET/POST | `/api/scores` | Role-scoped |
| POST/GET | `/api/doubts` | Role-scoped |
| PATCH | `/api/doubts/[id]/respond` | Faculty/Admin |
| POST/GET | `/api/links` | Parent/Student |
| POST | `/api/links/[id]/approve` | Admin only |

### Notifications

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/notifications` | Role-scoped (paginated, unreadOnly filter) |
| GET | `/api/notifications/unread-count` | Role-scoped |
| POST | `/api/notifications/read-all` | Role-scoped |
| PATCH | `/api/notifications/[id]/read` | Ownership check |

### Admin Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Summary cards (active students, revenue, etc.) |
| GET | `/api/admin/revenue-trend` | Monthly revenue chart data |
| GET | `/api/admin/enrollment-trend` | Monthly enrollment chart data |
| GET | `/api/admin/track-distribution` | Enrollment pie chart by track |
| GET | `/api/admin/batch-fill-rates` | Capacity bars for each batch |
| GET | `/api/admin/student-risks` | Attendance < 60% + failed tests |
| GET | `/api/admin/activity-feed` | Recent events (15s polling) |
| GET/PATCH | `/api/admin/students` | Student list + CRUD |
| GET | `/api/admin/students/[id]` | Full student profile |
| GET/POST | `/api/admin/faculty` | Faculty list + create |
| GET | `/api/admin/faculty/[id]` | Faculty profile |
| GET/POST | `/api/admin/schedule` | Class sessions CRUD |
| DELETE | `/api/admin/schedule/[id]` | Delete session |
| GET | `/api/admin/reports/revenue` | Revenue report + CSV |
| GET | `/api/admin/reports/enrollments` | Enrollment report + CSV |
| GET | `/api/admin/reports/attendance` | Attendance report + CSV |
| GET | `/api/admin/reports/scores` | Scores report + CSV |
| GET/PATCH | `/api/settings` | Site settings (admin) |
| GET/POST | `/api/sms-logs` | SMS audit log (admin) |
| POST | `/api/sms-logs/[id]/retry` | Retry failed SMS |

---

## 6. Data Flow & Workflow

### Authentication Flow

```
User enters phone → POST /api/auth/send-otp
    → Rate-limit check (Redis incr 5/hr/phone)
    → Generate 6-digit OTP (crypto.randomBytes)
    → Hash OTP (bcrypt, 10 rounds)
    → Store in Redis: otp:{phone} → { hash, attempts: 0 } (TTL 300s)
    → Enqueue SMS (mock or MSG91)
    → Response: 200

User enters OTP → POST /api/auth/verify-otp
    → Fetch hash from Redis
    → bcrypt.compare(otp, hash)
    → If match: delete Redis key, generate JWT pair
        → accessToken (HS256, 15m): { sub: userId, role, sessionId }
        → refreshToken (HS256, 7d): { sub: userId, sessionId }
        → Store SHA-256 hash in Redis: refresh:{sessionId} (TTL 7d)
    → If mismatch: increment attempts, if > 3 → delete key
```

### Enrollment + Payment Flow

```
Student browses batches → POST /api/enrollments
    → $transaction:
        1. Check batch capacity (seatsFilled < capacity)
        2. Create Enrollment (PENDING)
        3. Create Payment (PENDING)
    → Create Razorpay order (outside transaction)
    → Return order_id to client

Client opens Razorpay checkout → Payment success → Razorpay sends webhook
    → POST /api/payments/webhook
    → Read raw body (req.text())
    → HMAC-SHA256 verify (x-razorpay-signature header)
    → Check ProcessedWebhookEvent (idempotency)
    → Find payment by gatewayOrderId
    → If payment.captured:
        → Update Payment → SUCCEEDED
        → Update Enrollment → ACTIVE
        → Increment Batch.seatsFilled
        → Enqueue SMS confirmation
    → If payment.failed:
        → Update Payment → FAILED
        → Enqueue SMS failure notice

Client polls GET /api/enrollments/me until status = ACTIVE
    → Redirect to dashboard
```

### Attendance Flow

```
Faculty selects batch + date → GET /api/batches/[id]/roster
    → Returns enrolled students

Faculty marks present/absent per student → POST /api/attendance/bulk
    → Upsert per unique (batchId, studentId, sessionDate)
    → Each record: { present: boolean, markedById: facultyId }

Student views attendance → GET /api/attendance?studentId=me
    → Returns all records scoped to student's ACTIVE enrollments
```

### Doubt Query Flow

```
Student submits doubt → POST /api/doubts
    → Validate batchId is in student's ACTIVE enrollments
    → Create DoubtQuery (OPEN)
    → Enqueue SMS to batch faculty (notification)

Faculty views inbox → GET /api/doubts?batchId={id}
    → Returns OPEN first, sorted by newest

Faculty responds → PATCH /api/doubts/[id]/respond
    → Update status → ANSWERED
    → Set responseText, respondedById, respondedAt
    → Enqueue SMS to student (notification)
```

---

## 7. Workflow: How the Website Works

### User Journey

```
1. LANDING PAGE (public)
   Any visitor → / → Hero section + Tracks + Inquiry form
   "Inquire Now" → Scroll to inquiry form → Submit lead → POST /api/inquiries

2. REGISTRATION
   Click "Sign Up" → /signup
   → Select role (Student/Parent/Faculty)
   → Enter phone → OTP sent → Verify OTP → Create account → Auto-login

3. STUDENT EXPERIENCE
   Login → /dashboard/student (5 tabs)
   ├─ Batches: View enrolled batches, capacity bars, quick actions
   ├─ Scores: Per-batch test scores with trend chart
   ├─ Attendance: Per-batch percentage bars
   ├─ Doubts: Submit new query, view response threads
   └─ Fees: Payment history per enrollment
   
   Browse & Enroll → /enroll
   → Select track → View batches → Click "Enroll"
   → Razorpay checkout → Wait for webhook → Dashboard shows ACTIVE

4. FACULTY EXPERIENCE
   Login → /dashboard/faculty
   → View assigned batch cards
   → Mark Attendance: Select batch → Date → Check present/absent → Submit
   → Enter Scores: Select batch → Test name → Max score → Enter per-student → Submit
   → Doubt Inbox: View open doubts → Reply inline → SMS sent to student

5. PARENT EXPERIENCE
   Login → /dashboard/parent
   → Select child (pill buttons)
   → View summary cards (batches, attendance, recent score)
   → Click "View Attendance" / "View Scores" → API data in new tab
   → View child's doubt queries and responses

6. ADMIN EXPERIENCE
   Login → /dashboard/admin
   ├─ Dashboard: 4 summary cards + 4 charts + risk alerts + activity feed
   ├─ Inquiries: Pipeline with status tabs, batch-enroll modal
   ├─ Batches: CRUD table, create/edit modal, detail with roster + analytics
   ├─ Students: Search/filter list, profile with 6 tabs
   ├─ Faculty: Add faculty, view assignments
   ├─ Payments: Fee records
   ├─ Schedule: Day/week view, add/delete class sessions
   ├─ Reports: 4 report types with CSV export
   ├─ SMS Logs: Audit with retry for failed
   └─ Settings: Institution info, fee structure, batch defaults
```

### Auth Guard Model

```
Every dashboard page wraps content in:
  <ProtectedRoute allowedRoles={['STUDENT']}>

Every API route (non-public) checks:
  authenticateRequest(req) → { user } or 401
  auth.user.role !== 'ADMIN' → 403

Public pages/routes are unprotected:
  /, /about, /programs/[slug]
  GET /api/tracks, POST /api/inquiries, POST /api/auth/*
```

---

## 8. Branching Strategy, Issues & PR Process

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/description` | `feat/doubt-attachment-upload` |
| Fix | `fix/description` | `fix/attendance-upsert-duplicate` |
| Refactor | `refactor/description` | `refactor/auth-middleware` |
| Docs | `docs/description` | `docs/api-reference` |

### Issue Guidelines & Format

Before creating a new issue, please search existing issues to ensure it hasn't already been reported. When submitting a new issue, use one of the templates below:

#### 1. Bug Report Template
```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Screenshots / Screen Recordings
If applicable, add screenshots or recordings to help explain the problem.

## Environment Details
- OS: [e.g. Windows, macOS, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Node version: [e.g. v20.11.0]
- Database: PostgreSQL (Local / Remote)

## Additional Context
Add any other context about the problem here (e.g. console logs, network responses).
```

#### 2. Feature Request Template
```markdown
## Feature Pitch
A clear and concise description of what the feature is and why it's needed.

## Proposed Solution
Describe the solution or feature you'd like to see implemented.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockup designs, or details here.
```

### PR Requirements & Process

1. **Target**: Always open PRs against `main`
2. **Title**: Prefix with type: `feat:`, `fix:`, `refactor:`, `docs:`
3. **Description**: What problem does this solve? How does the code change address it?
4. **UI Changes**: Include screenshots or screen recording
5. **Pre-submit Checklist**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```
6. **All checks must pass** on GitHub Actions before merge.

### Pull Request Template

When opening a Pull Request, please copy and fill out the template below:

```markdown
## Description
Provide a summary of the changes and the related issue (e.g., Closes #123).

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactoring (structural code changes without functional differences)
- [ ] Documentation update

## How Has This Been Tested?
Please describe the tests that you ran to verify your changes.
- [ ] Unit Tests (`npm run test`)
- [ ] Integration Tests (specify files)
- [ ] E2E Tests (`npx playwright test`)
- [ ] Manual Verification (describe steps)

## Screenshots / Video (if UI changes are made)
Attach visual proof of the changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] All pre-commit checks pass locally (`test` -> `lint` -> `type-check`)
```

---

### Working with the Seed

To verify seed data works end-to-end through the API:

```bash
# Start the dev server
npm run dev

# Test admin stats (replace token with an actual JWT from login)
curl http://localhost:3000/api/admin/stats -H "Authorization: Bearer <token>"
# → { activeStudents: 3, openInquiries: 2, monthlyRevenue: 0, batchesNearCapacity: 0 }

# Test student enrollment
curl http://localhost:3000/api/enrollments/me -H "Authorization: Bearer <student-token>"

# Test parent links
curl http://localhost:3000/api/links -H "Authorization: Bearer <parent-token>"

# Test health endpoint (no auth needed)
curl http://localhost:3000/api/health
# → { status: "healthy", checks: { database: "ok", redis: "ok" } }
```

---

### Database Migrations & Updates

Whenever you pull changes that include model modifications or make updates to the `prisma/schema.prisma` file yourself, use the following commands to keep your local environment in sync:


Generate and apply a new migration after schema changes
```bash
npx prisma migrate dev --name <migration_name>
```
Sync your local database with the current schema without creating a migration file (Prototyping)
```
npx prisma db push
```
Regenerate the Prisma Client (run automatically by migrate dev, but useful if types aren't updating)
```
npx prisma generate
```

---

## 9. Testing & Verification

### Pre-Commit Hook (enforced)

This repository enforces quality gates on **every commit** via Husky. The `.husky/pre-commit` hook automatically runs the following chain — **in this exact order** — before any commit is accepted:

```
npm test → npx lint-staged → npm run type-check
```

#### Phase 1: `npm test` (All 60 tests)

```bash
npm run test
```

Runs the full Jest test suite (unit + integration). All 60 tests across 10 suites must pass. If any test fails, the commit is aborted immediately — phases 2 and 3 do not run.

#### Phase 2: `npx lint-staged` (ESLint on staged files)

```bash
npx lint-staged
```

Scans only the files staged for commit with ESLint. If any staged file fails linting, the commit is blocked. This keeps the lint pass fast by not scanning the entire codebase.

#### Phase 3: `npm run type-check` (TypeScript strict)

```bash
npm run type-check
```

Runs `tsc --noEmit` across the entire project. TypeScript strict mode is enforced — any type error, even on files not in the commit, will block the commit. This ensures the codebase maintains full type safety at all times.

> **If a commit is blocked**, fix the failure in the failing phase, `git add` the fix, and retry the commit. Do not use `--no-verify` or `-n` to skip hooks unless absolutely necessary (and document why).

### Running Tests

```bash
# All tests (60 tests, 10 suites)
npm run test

# Specific test file
npx jest __tests__/integration/enrollments.test.ts

# Watch mode
npx jest --watch
```

### Test Structure

```
__tests__/
├── unit/
│   ├── auth/otp.test.ts        OTP generation & hashing
│   └── auth/jwt.test.ts        JWT sign/verify, expiry, tampering
├── integration/
│   ├── otp-flow.test.ts        Full OTP send→verify flow
│   ├── rate-limit.test.ts      5 req/hr enforcement
│   ├── inquiries.test.ts       Honeypot, rate-limit, CRUD
│   ├── batches.test.ts         Admin CRUD, access control
│   ├── enrollments.test.ts     Enrollment+payment, webhook, idempotency
│   ├── notifications.test.ts   List, unread count, mark read, pagination, ownership
│   └── security.test.ts        Auth enforcement, RBAC, webhook sig
└── components/
    └── ui/button.test.tsx       Button rendering & variants
```

### E2E Tests (Playwright)

```bash
npx playwright test
```

Tests are in `e2e/`:
- `auth-flow.spec.ts` — Landing page, login, signup, unauthenticated redirect
- `enrollment-flow.spec.ts` — Public tracks, inquiry form, enrollment auth guard
- `health.spec.ts` — Health endpoint, tracks API

### Writing Tests

**Pattern for integration tests:**

```typescript
/**
 * @jest-environment node
 */
let mockAuthRole = 'STUDENT';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: 'user-1', role: mockAuthRole, sessionId: 'sess-1' },
  })),
}));

// Mock Prisma, Redis, external services as needed
import { GET } from '@/app/api/some-route/route';
const req = new Request('http://localhost:3000/api/endpoint');
const res = await GET(req);
expect(res.status).toBe(200);
```

### Pre-Push Verification

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

---


## 10. Future Roadmap

### Sprint 10 — Study Materials & Resource Library
- `Resource` model (title, description, file URL, type, track/batch association)
- File upload API (local `/uploads` or S3-compatible storage)
- Faculty uploads resources, students browse by track/batch
- Resource categories (Notes, Practice Papers, Reference Books, Videos)

### Sprint 11 — Online Tests & Quizzes
- `Test`/`Question`/`TestAttempt`/`TestAnswer` models
- MCQ + subjective question types
- Faculty creates timed tests, students attempt online
- Auto-grading for MCQs, manual grading for subjective
- Leaderboard and performance analytics per test

### Sprint 12 — Homework & Assignments
- `Assignment`/`AssignmentSubmission` models
- Faculty posts assignments with due dates
- Students upload submissions (file + text)
- Faculty grades and returns feedback
- Late submission tracking

### Sprint 13 — Live Classes (Zoom/Meet Integration)
- `LiveSession` model (meeting link, platform, recording URL)
- Integration with Zoom API / Google Meet links
- Calendly-style scheduling with reminders
- Attendance auto-marked via join tracking
- Recording archive accessible to enrolled students

### Sprint 14 — Fee Management & Dues
- `FeeStructure` model (installment plans, due dates, late fees)
- Dues dashboard for admin — who owes what
- Late fee calculation engine
- Payment reminders (SMS + notification)
- Downloadable fee receipts (PDF via PDFKit)

### Sprint 15 — Announcements & Broadcast
- `Announcement` model (title, body, target roles, target batch)
- Admin creates announcements with priority levels
- Notification + SMS broadcast to targeted users
- Faculty can announce to their batches
- Archive and search

### Sprint 16 — Progress Reports (PDF)
- PDF report generator using PDFKit
- Student progress report: attendance %, test scores trend, faculty remarks
- Batch-wise class performance snapshot
- Downloadable from admin and parent dashboards

### Sprint 17 — In-App Chat (Faculty ↔ Student)
- `Conversation`/`Message` models
- Real-time messaging via polling or WebSocket
- Faculty can initiate conversations with students
- Read receipts, typing indicators
- Integrated with existing notification system

### Sprint 18 — HR & Staff Management
- `StaffAttendance`/`StaffLeave` models
- Faculty check-in/check-out
- Leave application and approval workflow
- Payroll calculation (basic + variable)
- Admin dashboard for staff analytics

### Sprint 19 — Dark Mode & Mobile Polish
- CSS custom properties for theme switching
- Dark theme for all dashboards and public pages
- Tailwind breakpoint audit for mobile
- Collapsed sidebar by default on small screens
- Touch-friendly interaction targets

### Sprint 20 — AI Tutor / Chatbot
- OpenAI API integration
- RAG pipeline over study materials (embeddings + vector search)
- Students ask questions in natural language
- Rate-limited per student (e.g., 50 queries/day)
- Faculty review and approve AI-generated answers

### Sprint 21 — Multi-Language Support (i18n)
- Hindi (HI) and Marathi (MR) translations
- `next-intl` or `react-i18next` integration
- Language selector persisted in user preferences
- All public pages + dashboards translatable
- Faculty can set default language per batch

### Sprint 22 — Mobile App (React Native)
- React Native (Expo) frontend reusing existing API
- Push notifications via Expo Push
- Offline-capable attendance marking
- Biometric login
- Shared code: validation schemas, types, API client

### Sprint 23 — PWA & Offline Support
- Service worker with workbox
- Offline-capable attendance + score entry (Sync on reconnect)
- IndexedDB local cache for frequently accessed data
- Install prompt for mobile browsers
- Push notification support via service worker

---

## Need Help?

- **Issues**: Report bugs at https://github.com/Rajal-ui/kaushiki-coaching-portal/issues
- **Discussions**: Use GitHub Discussions for questions about architecture or development
- **Internal Docs**: Project PRD, TRD, and implementation plans are maintained in `docs/`
