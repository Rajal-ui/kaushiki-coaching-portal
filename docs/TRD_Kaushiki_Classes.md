# Technical Requirements Document (TRD): Kaushiki Classes Platform

**Version:** 1.0
**Status:** Engineering Handoff
**Client:** Kaushiki Classes / KLN Business Solutions
**Date:** June 2026
**Companion Docs:** PRD v1.0, Implementation Plan v1.0

---

## 1. Document Purpose

This TRD translates the PRD's product requirements into precise, engineering-actionable technical specifications. Every decision here has a rationale. Engineers should treat this as the ground truth for stack selection, architecture patterns, API contracts, DB schema, and DevOps configuration.

---

## 2. System Architecture Overview

### 2.1 Deployment Topology

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│         Browser (Next.js SSR/SSG + React hydration)      │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS / TLS 1.3
┌─────────────────────────▼────────────────────────────────┐
│                     CDN / EDGE                           │
│      Vercel Edge Network (static assets, SSG pages)      │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                   APPLICATION LAYER                      │
│   Next.js App Router (SSR pages + /app/api/* API routes) │
│              Node.js 20 LTS runtime                      │
└────┬───────────────┬──────────────────┬──────────────────┘
     │               │                  │
┌────▼────┐   ┌──────▼──────┐   ┌──────▼──────┐
│PostgreSQL│   │   Redis 7   │   │  Razorpay   │
│(Primary  │   │(BullMQ job  │   │  Webhook    │
│  DB)     │   │  queue)     │   │  Endpoint   │
└─────────┘   └──────┬──────┘   └─────────────┘
                     │
              ┌──────▼──────┐
              │ SMS Worker  │
              │  Process    │
              │(BullMQ/Node)│
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │MSG91 / SMS  │
              │  Provider   │
              └─────────────┘
```

**Architecture Decision:** Monorepo with Next.js full-stack (API Routes) for MVP. Reason: single deployment unit, shared types between frontend and backend, simpler CI/CD for a one-institution build. Separate microservices only if KLN scales to multi-tenant (Section 6 in PRD — not now).

### 2.2 Repository Structure

```
kaushiki-platform/
├── app/                        # Next.js App Router
│   ├── (public)/               # Public route group
│   │   ├── page.tsx            # Home/About
│   │   ├── programs/page.tsx   # Tracks catalog
│   │   └── contact/page.tsx    # Inquiry + Contact
│   ├── (auth)/                 # Auth route group
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/              # Authenticated portals
│   │   ├── student/page.tsx
│   │   ├── parent/page.tsx
│   │   ├── faculty/page.tsx
│   │   └── admin/page.tsx
│   └── api/                    # API routes
│       ├── auth/
│       ├── tracks/
│       ├── batches/
│       ├── enrollments/
│       ├── payments/
│       │   └── webhook/        # Razorpay webhook endpoint
│       ├── inquiries/
│       ├── doubts/
│       ├── attendance/
│       ├── scores/
│       └── sms-logs/
├── components/                 # Shared UI components
├── lib/                        # Utilities, DB client, queue client
│   ├── db/                     # Prisma client + generated types
│   ├── queue/                  # BullMQ job definitions + producer
│   ├── sms/                    # SMS provider adapter
│   ├── auth/                   # JWT helpers, OTP logic
│   └── razorpay/               # Webhook signature verify, API client
├── workers/                    # Standalone worker process (separate from web)
│   └── sms-worker.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/              # CI/CD pipelines
├── openapi.yaml                # Contract-first API spec
└── mocks/                      # MSW handlers (frontend-first dev)
    └── handlers/
```

---

## 3. Technology Stack (Finalized)

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Frontend Framework | Next.js (App Router) | 14.x | SSR for SEO (Programs page must be indexed), SSG for static public pages, built-in API routes eliminate separate Express server for MVP |
| Language | TypeScript | 5.x | Shared types across frontend/backend/Prisma — catches contract drift at compile time |
| Styling | Tailwind CSS | 3.x | Utility-first, fast iteration during frontend-first sprints |
| Component Library | shadcn/ui (Radix primitives) | Latest | Accessible, unstyled base — lets us apply Kaushiki brand without fighting component library defaults |
| State Management | React Query (TanStack Query) | 5.x | Server-state caching, background refetch, optimistic updates for attendance/score entry |
| Form Handling | React Hook Form + Zod | Latest | Schema-driven validation, Zod schemas shared with API validation layer |
| ORM | Prisma | 5.x | Type-safe DB queries, migration management, generated client from schema |
| Database | PostgreSQL | 16.x | ACID compliance for atomic payment+enrollment+seat-decrement transactions |
| Cache / Queue | Redis 7 + BullMQ | Latest | BullMQ for typed job queue with retry/backoff; Redis also used for rate-limit counters |
| Auth | Custom JWT (jose library) | — | jose runs in Node and Edge runtimes (needed if moving any middleware to Vercel Edge); no NextAuth for MVP (adds complexity for phone-OTP-first flow) |
| Payment | Razorpay SDK (Node) | Latest | INR-only, Indian-bank-rail optimized, mandatory for Indian DLT-compliant transactions |
| SMS | MSG91 (primary) | — | TRAI DLT pre-registration support, strong delivery rates to Indian numbers, transactional SMS template approval process well-documented |
| Mock API Layer | MSW (Mock Service Worker) | 2.x | Intercepts fetch at Service Worker level — works without a running backend |
| API Contract | OpenAPI 3.1 (openapi.yaml) | — | Source of truth for MSW mocks + Schemathesis contract tests |
| Testing (Unit/Int) | Vitest + Supertest | Latest | Vitest: faster than Jest for Vite/Next ecosystem, compatible API; Supertest: HTTP integration tests against Next API routes |
| Testing (E2E) | Playwright | Latest | Cross-browser, reliable network-intercept for payment flow testing in sandbox mode |
| CI/CD | GitHub Actions | — | Native to GitHub, YAML-based, secrets management built-in |
| Hosting | Vercel (web) + Railway (Postgres + Redis + Worker) | — | Vercel for Next.js optimal DX/CDN; Railway for managed Postgres/Redis + always-on worker process |
| Error Monitoring | Sentry | Latest | Source maps, Next.js SDK, transaction tracing |
| Uptime Monitoring | Better Uptime / UptimeRobot | — | Health endpoint monitoring, alert on downtime |

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ──────────────────────────────────────────────

enum Role {
  STUDENT
  PARENT
  FACULTY
  ADMIN
}

enum AccountStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
}

enum TrackName {
  CLASSES_1_5
  CLASSES_6_10
  CLASSES_11_12_COMMERCE
  CA_FOUNDATION_INTERMEDIATE
}

enum BatchStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum LinkStatus {
  PENDING
  APPROVED
}

enum EnrollmentStatus {
  PENDING
  ACTIVE
  COMPLETED
  REVOKED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum InquiryStatus {
  NEW
  CONTACTED
  ENROLLED
  CLOSED
}

enum QueryStatus {
  OPEN
  ANSWERED
}

enum SmsStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
}

// ─── CORE MODELS ────────────────────────────────────────

model User {
  id               String        @id @default(cuid())
  name             String
  phone            String        @unique
  email            String?       @unique
  passwordHash     String
  role             Role
  status           AccountStatus @default(PENDING_VERIFICATION)
  phoneVerified    Boolean       @default(false)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  parentLinks          ParentStudentLink[] @relation("ParentLinks")
  studentLinks         ParentStudentLink[] @relation("StudentLinks")
  approvedLinks        ParentStudentLink[] @relation("ApprovedLinks")
  assignedBatches      Batch[]             @relation("FacultyBatches")
  enrollments          Enrollment[]        @relation("StudentEnrollments")
  payments             Payment[]           @relation("PayerPayments")
  doubtQueries         DoubtQuery[]        @relation("StudentQueries")
  doubtResponses       DoubtQuery[]        @relation("FacultyResponses")
  attendance           Attendance[]
  testScores           TestScore[]
  assignedInquiries    Inquiry[]           @relation("AssignedInquiries")
  smsLogs              SmsLog[]
  adminEnrollments     Enrollment[]        @relation("AdminEnrollments")

  @@map("users")
}

model ParentStudentLink {
  id           String     @id @default(cuid())
  parentId     String
  studentId    String
  status       LinkStatus @default(PENDING)
  approvedById String?
  createdAt    DateTime   @default(now())

  parent     User  @relation("ParentLinks",   fields: [parentId],     references: [id])
  student    User  @relation("StudentLinks",  fields: [studentId],    references: [id])
  approvedBy User? @relation("ApprovedLinks", fields: [approvedById], references: [id])

  @@unique([parentId, studentId])
  @@map("parent_student_links")
}

model Track {
  id            String    @id @default(cuid())
  name          TrackName @unique
  boardCoverage String?   // "CBSE | ICSE | State Board" for Classes 1-10
  displayOrder  Int
  createdAt     DateTime  @default(now())

  subjects Subject[]

  @@map("tracks")
}

model Subject {
  id        String   @id @default(cuid())
  trackId   String
  name      String
  createdAt DateTime @default(now())

  track   Track   @relation(fields: [trackId], references: [id])
  batches Batch[]

  @@unique([trackId, name])
  @@map("subjects")
}

model Batch {
  id          String      @id @default(cuid())
  subjectId   String
  facultyId   String
  capacity    Int
  seatsFilled Int         @default(0)
  schedule    String      // e.g. "Mon/Wed/Fri 4:00 PM"
  status      BatchStatus @default(ACTIVE)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  subject     Subject      @relation(fields: [subjectId],  references: [id])
  faculty     User         @relation("FacultyBatches", fields: [facultyId], references: [id])
  enrollments Enrollment[]
  doubtQueries DoubtQuery[]
  attendance  Attendance[]
  testScores  TestScore[]

  @@map("batches")
}

model Enrollment {
  id          String           @id @default(cuid())
  studentId   String
  batchId     String
  status      EnrollmentStatus @default(PENDING)
  inquiryId   String?
  enrolledById String?          // Admin who manually enrolled (null if self)
  enrolledAt  DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  student    User     @relation("StudentEnrollments", fields: [studentId],    references: [id])
  batch      Batch    @relation(fields: [batchId],    references: [id])
  inquiry    Inquiry? @relation(fields: [inquiryId],  references: [id])
  enrolledBy User?    @relation("AdminEnrollments",   fields: [enrolledById], references: [id])
  payment    Payment?

  @@unique([studentId, batchId])
  @@map("enrollments")
}

model Payment {
  id             String        @id @default(cuid())
  enrollmentId   String        @unique
  payerId        String
  amount         Int           // in paise (INR smallest unit — no decimals in Razorpay)
  currency       String        @default("INR")
  gateway        String        @default("razorpay")
  gatewayOrderId String?       // Razorpay order_id (created at checkout)
  gatewayEventId String?       @unique // Razorpay payment_id / event_id for idempotency
  status         PaymentStatus @default(PENDING)
  failureReason  String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  payer      User       @relation("PayerPayments",  fields: [payerId],       references: [id])

  @@map("payments")
}

model Inquiry {
  id         String        @id @default(cuid())
  name       String
  phone      String
  email      String?
  trackId    String?
  message    String
  status     InquiryStatus @default(NEW)
  assigneeId String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  assignee    User?        @relation("AssignedInquiries", fields: [assigneeId], references: [id])
  enrollments Enrollment[]

  @@map("inquiries")
}

model DoubtQuery {
  id            String      @id @default(cuid())
  studentId     String
  batchId       String
  questionText  String
  attachmentUrl String?
  status        QueryStatus @default(OPEN)
  responseText  String?
  respondedById String?
  respondedAt   DateTime?
  createdAt     DateTime    @default(now())

  student     User   @relation("StudentQueries",  fields: [studentId],     references: [id])
  batch       Batch  @relation(fields: [batchId],                          references: [id])
  respondedBy User?  @relation("FacultyResponses", fields: [respondedById], references: [id])

  @@map("doubt_queries")
}

model Attendance {
  id          String   @id @default(cuid())
  batchId     String
  studentId   String
  sessionDate DateTime @db.Date
  present     Boolean  @default(false)
  markedById  String?  // Faculty or Admin who marked it

  batch   Batch @relation(fields: [batchId],   references: [id])
  student User  @relation(fields: [studentId], references: [id])

  @@unique([batchId, studentId, sessionDate])
  @@map("attendance")
}

model TestScore {
  id        String   @id @default(cuid())
  batchId   String
  studentId String
  testName  String
  score     Int
  maxScore  Int
  testDate  DateTime @db.Date
  remark    String?
  enteredAt DateTime @default(now())

  batch   Batch @relation(fields: [batchId],   references: [id])
  student User  @relation(fields: [studentId], references: [id])

  @@map("test_scores")
}

model ProcessedWebhookEvent {
  id           String   @id // = gateway_event_id (idempotency key)
  gateway      String
  eventType    String
  processedAt  DateTime @default(now())

  @@map("processed_webhook_events")
}

model SmsLog {
  id           String    @id @default(cuid())
  userId       String?
  phone        String
  templateId   String    // MSG91 DLT-registered template ID
  triggerEvent String    // e.g. "enrollment_confirmed", "payment_failed"
  status       SmsStatus @default(QUEUED)
  retryCount   Int       @default(0)
  failureReason String?
  providerId   String?   // MSG91 response reference
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User? @relation(fields: [userId], references: [id])

  @@map("sms_logs")
}
```

---

## 5. API Contract (OpenAPI Summary)

Full spec lives in `openapi.yaml`. Key endpoint groups:

### 5.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/send-otp | Public | Send OTP to phone |
| POST | /api/auth/verify-otp | Public | Verify OTP → return tokens |
| POST | /api/auth/refresh | Public (refresh token) | Rotate access token |
| POST | /api/auth/logout | Bearer | Revoke refresh token |

### 5.2 Tracks & Batches

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/tracks | Public | All tracks + subjects (public Programs page) |
| GET | /api/tracks/:id/batches | Public | Open batches for a track (capacity aware) |
| POST | /api/batches | Admin | Create batch |
| PATCH | /api/batches/:id | Admin | Update batch (capacity, schedule, faculty) |
| GET | /api/batches/:id/roster | Faculty/Admin | Student list for batch |

### 5.3 Enrollments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/enrollments | Student/Parent/Admin | Initiate enrollment → creates Payment (pending) |
| GET | /api/enrollments/me | Student | Own enrollments |
| GET | /api/enrollments?studentId= | Parent/Admin | Child's or any student's enrollments |

### 5.4 Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/payments/create-order | Student/Parent | Create Razorpay order → return order_id to client |
| POST | /api/payments/webhook | Public (signature-verified) | Razorpay event handler |
| POST | /api/payments/:id/refund | Admin | Trigger refund |

### 5.5 Inquiries

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/inquiries | Public | Submit inquiry (rate-limited) |
| GET | /api/inquiries | Admin | Paginated list with filters |
| PATCH | /api/inquiries/:id | Admin | Update status/assignee |

### 5.6 Doubt Queries

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/doubts | Student | Submit query |
| GET | /api/doubts?batchId= | Faculty/Admin | Query inbox for batch |
| PATCH | /api/doubts/:id/respond | Faculty/Admin | Submit response |

### 5.7 Attendance & Test Scores

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/attendance/bulk | Faculty/Admin | Mark attendance for a session (batch of records) |
| GET | /api/attendance?batchId=&studentId= | Faculty/Admin/Student/Parent | Attendance records |
| POST | /api/scores | Faculty/Admin | Enter test scores (bulk per test) |
| GET | /api/scores?batchId=&studentId= | All auth roles (scoped) | Test score records |

### 5.8 SMS Logs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/sms-logs | Admin | Paginated, filterable by status |
| POST | /api/sms-logs/:id/retry | Admin | Manual resend |

---

## 6. Critical Technical Implementations

### 6.1 Phone OTP Authentication Flow

```
Client                    API                      Redis
  │                         │                         │
  ├──POST /auth/send-otp───►│                         │
  │  { phone }              │──SET otp:{phone}───────►│
  │                         │  value: {code, attempts}│
  │                         │  TTL: 300s              │
  │◄──{ success }───────────│                         │
  │                         │                         │
  ├──POST /auth/verify-otp─►│                         │
  │  { phone, code }        │──GET otp:{phone}────────►│
  │                         │◄─{code, attempts}────────│
  │                         │  [verify match]         │
  │                         │──DEL otp:{phone}────────►│
  │◄──{ accessToken,        │                         │
  │    refreshToken }       │                         │
```

**OTP Security rules:**
- Max 3 verification attempts before code invalidated (prevent brute-force).
- Max 5 OTP send requests per phone per hour (prevent SMS-bombing).
- OTP: 6 digits, cryptographically random (not `Math.random()`).
- OTP stored as bcrypt hash in Redis (even Redis compromise doesn't expose raw OTPs).

### 6.2 Atomic Enrollment + Seat-Decrement + Payment

```typescript
// lib/db/enrollment-transaction.ts
// Called from webhook handler ONLY — never from checkout-initiation

export async function activateEnrollment(
  prisma: PrismaClient,
  enrollmentId: string,
  gatewayEventId: string,
  gatewayOrderId: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Idempotency: check if already processed (belt+suspenders after DB UNIQUE constraint)
    const existing = await tx.processedWebhookEvent.findUnique({
      where: { id: gatewayEventId }
    });
    if (existing) return { alreadyProcessed: true };

    // 2. Get enrollment + batch (with lock to prevent concurrent race)
    const enrollment = await tx.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: { batch: true }
    });

    // 3. Check batch not overbooked (race-condition guard)
    if (enrollment.batch.seatsFilled >= enrollment.batch.capacity) {
      // Edge case from PRD 3.4: flag for Admin, do not overbook
      throw new Error('BATCH_CAPACITY_EXCEEDED_AT_CONFIRMATION');
    }

    // 4. All mutations in single transaction
    await tx.processedWebhookEvent.create({
      data: { id: gatewayEventId, gateway: 'razorpay', eventType: 'payment.captured' }
    });
    await tx.payment.update({
      where: { enrollmentId },
      data: { status: 'SUCCEEDED', gatewayEventId, gatewayOrderId }
    });
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ACTIVE' }
    });
    await tx.batch.update({
      where: { id: enrollment.batchId },
      data: { seatsFilled: { increment: 1 } }
    });

    return { alreadyProcessed: false, enrollmentId };
  });
}
```

### 6.3 BullMQ SMS Worker

```typescript
// workers/sms-worker.ts — runs as SEPARATE PROCESS (not imported by web server)

import { Worker } from 'bullmq';
import { sendSmsViaMSG91 } from '../lib/sms/msg91';
import { prisma } from '../lib/db/client';
import { redis } from '../lib/queue/redis-connection';

const SMS_QUEUE = 'sms-dispatch';

new Worker(SMS_QUEUE, async (job) => {
  const { smsLogId, phone, templateId, variables } = job.data;

  try {
    const result = await sendSmsViaMSG91({ phone, templateId, variables });

    await prisma.smsLog.update({
      where: { id: smsLogId },
      data: { status: 'SENT', providerId: result.requestId }
    });
  } catch (err) {
    const isLastAttempt = job.attemptsMade >= 2; // 0-indexed, max 3 total
    await prisma.smsLog.update({
      where: { id: smsLogId },
      data: {
        status: isLastAttempt ? 'FAILED' : 'QUEUED',
        retryCount: job.attemptsMade + 1,
        failureReason: err instanceof Error ? err.message : 'unknown'
      }
    });
    throw err; // Re-throw so BullMQ triggers retry
  }
}, {
  connection: redis,
  concurrency: 5,                         // Respect MSG91 rate limits
  limiter: { max: 50, duration: 1000 }    // 50 SMS/sec max
});
```

**Producer (called from webhook handler after DB commit — non-blocking):**

```typescript
// lib/queue/sms-producer.ts
import { Queue } from 'bullmq';
import { redis } from './redis-connection';

const smsQueue = new Queue('sms-dispatch', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // 5s, 10s, 20s
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

export async function enqueueSms(payload: SmsJobPayload) {
  // Create log record first — job may fail to enqueue (Redis down)
  const log = await prisma.smsLog.create({ data: { ...payload, status: 'QUEUED' } });
  try {
    await smsQueue.add('send', { ...payload, smsLogId: log.id });
  } catch (err) {
    // Redis unavailable: log error, do NOT fail parent request
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', failureReason: 'Redis enqueue failed' }
    });
    console.error('[SMS Queue] Failed to enqueue:', err);
    // Alert via Sentry — do not throw
  }
}
```

### 6.4 Razorpay Webhook Handler

```typescript
// app/api/payments/webhook/route.ts

import crypto from 'crypto';
import { activateEnrollment } from '@/lib/db/enrollment-transaction';
import { enqueueSms } from '@/lib/queue/sms-producer';

export async function POST(req: Request) {
  const rawBody = await req.text(); // Must read raw body for signature verification
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // 1. Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    console.warn('[Webhook] Invalid signature — rejected');
    return new Response('Unauthorized', { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventId = event.payload?.payment?.entity?.id;   // Razorpay payment ID
  const orderId = event.payload?.payment?.entity?.order_id;

  if (event.event === 'payment.captured') {
    const enrollment = await prisma.enrollment.findFirst({
      where: { payment: { gatewayOrderId: orderId } }
    });
    if (!enrollment) return new Response('Order not found', { status: 200 }); // 200 to stop retries

    const result = await activateEnrollment(prisma, enrollment.id, eventId, orderId);

    if (!result.alreadyProcessed) {
      // Non-blocking SMS enqueue AFTER transaction
      await enqueueSms({
        phone: enrollment.student.phone,
        templateId: process.env.MSG91_TEMPLATE_ENROLLMENT_CONFIRMED!,
        triggerEvent: 'enrollment_confirmed',
        variables: { name: enrollment.student.name }
      });
    }
  }

  if (event.event === 'payment.failed') {
    // Update payment status, enqueue failure SMS
    // ... (similar pattern, no seat decrement)
  }

  return new Response('OK', { status: 200 });
}
```

---

## 7. Security Specifications

### 7.1 JWT Implementation

```
Access Token:  HS256, TTL 15 minutes, payload: { sub: userId, role, sessionId }
Refresh Token: HS256, TTL 7 days, stored as SHA-256 hash in Redis (key: refresh:{sessionId})
               Raw token sent to client as HttpOnly, Secure, SameSite=Strict cookie
               Rotated on every use (old token hash deleted, new one stored)
               Revocation: DEL refresh:{sessionId} from Redis (e.g. on suspend, logout)
```

### 7.2 Rate Limiting (Redis-based, Sliding Window)

| Endpoint | Limit | Window |
|---|---|---|
| POST /auth/send-otp | 5 per phone | 1 hour |
| POST /auth/verify-otp | 3 attempts per OTP | Per code lifetime |
| POST /inquiries | 5 per IP | 1 hour |
| POST /api/* (authenticated) | 200 per user | 1 minute |

### 7.3 Input Validation

All API inputs validated via Zod schemas at the route handler entry point — reject with 400 before any DB query executes. Zod schemas live in `lib/validators/` and are shared with frontend form validation (single source of truth).

### 7.4 TRAI / MSG91 DLT Compliance

**Critical for Indian SMS:** All transactional SMS templates must be pre-registered on TRAI's DLT platform via MSG91 before go-live. Required templates to register:

| Template ID (env var) | Trigger | Content skeleton |
|---|---|---|
| `MSG91_TEMPLATE_ENROLLMENT_CONFIRMED` | enrollment_confirmed | "Dear {name}, your enrollment in {batch} at Kaushiki Classes is confirmed. Contact: 9175498572" |
| `MSG91_TEMPLATE_PAYMENT_FAILED` | payment_failed | "Dear {name}, your fee payment for {batch} at Kaushiki Classes was unsuccessful. Retry: {link}" |
| `MSG91_TEMPLATE_FEE_REMINDER` | fee_due_reminder | "Dear {name}, fee for {batch} at Kaushiki Classes is due on {date}. Pay: {link}" |
| `MSG91_TEMPLATE_INQUIRY_ACK` | inquiry_ack | "Thank you {name} for your inquiry at Kaushiki Classes. We'll contact you shortly. Call us: 9175498572" |
| `MSG91_TEMPLATE_DOUBT_ANSWERED` | doubt_answered | "Dear {name}, your doubt query for {subject} has been answered. Login to view: {link}" |
| `MSG91_TEMPLATE_RESULT_PUBLISHED` | result_published | "Dear {name}, your test results for {test_name} are now available. Login: {link}" |

**DLT registration must happen before Sprint 5 (SMS integration sprint) — it takes 3–7 working days and blocks go-live if missed.**

---

## 8. Non-Functional Technical Specifications

### 8.1 Performance

- Next.js ISR (Incremental Static Regeneration) for `/programs` page — revalidate every 60s (batch availability updates reflected without full rebuild).
- React Query cache TTL: 30s for batch-availability data, 5 min for static track/subject data.
- PostgreSQL connection pooling via `pg_bouncer` or Prisma's built-in pool (max 10 connections from web, 5 from worker — Railway Postgres connection limits considered).
- Index requirements (beyond Prisma defaults):
  ```sql
  CREATE INDEX idx_enrollments_student   ON enrollments(student_id);
  CREATE INDEX idx_enrollments_batch     ON enrollments(batch_id);
  CREATE INDEX idx_attendance_batch_date ON attendance(batch_id, session_date);
  CREATE INDEX idx_test_scores_batch     ON test_scores(batch_id);
  CREATE INDEX idx_sms_logs_status       ON sms_logs(status);
  CREATE INDEX idx_sms_logs_user         ON sms_logs(user_id);
  ```

### 8.2 Error Handling Standards

All API routes return consistent error shape:
```json
{
  "error": {
    "code": "BATCH_CAPACITY_EXCEEDED",
    "message": "This batch is full. Please choose another batch.",
    "details": {}
  }
}
```
Error codes are typed in `lib/errors.ts` — frontend switches on `error.code` for localized messaging, not `error.message` (message can change without breaking UI).

### 8.3 Environment Variables (Required — All Must Be in GitHub Secrets)

```
DATABASE_URL                           # PostgreSQL connection string
REDIS_URL                              # Redis connection string
JWT_ACCESS_SECRET                      # HS256 signing secret (min 32 chars)
JWT_REFRESH_SECRET                     # Separate from access secret
RAZORPAY_KEY_ID                        # Razorpay API key (public — safe for client)
RAZORPAY_KEY_SECRET                    # Server-side only
RAZORPAY_WEBHOOK_SECRET                # Webhook signature verification
MSG91_AUTH_KEY                         # MSG91 API auth key
MSG91_SENDER_ID                        # DLT-registered sender ID
MSG91_TEMPLATE_ENROLLMENT_CONFIRMED    # DLT template IDs (one per trigger)
MSG91_TEMPLATE_PAYMENT_FAILED
MSG91_TEMPLATE_FEE_REMINDER
MSG91_TEMPLATE_INQUIRY_ACK
MSG91_TEMPLATE_DOUBT_ANSWERED
MSG91_TEMPLATE_RESULT_PUBLISHED
SENTRY_DSN                             # Error monitoring
NEXT_PUBLIC_RAZORPAY_KEY_ID            # Client-safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL                    # Base URL for SMS links
```

---

## 9. Testing Specifications

### 9.1 Unit Tests (Vitest)

| Target | What to Test |
|---|---|
| `lib/auth/otp.ts` | OTP generation entropy, TTL, attempt-count logic |
| `lib/razorpay/verify-signature.ts` | Valid/invalid/tampered signature cases |
| `lib/db/enrollment-transaction.ts` | Idempotency (second call returns alreadyProcessed), capacity-exceeded throw |
| Zod validators | All edge cases from PRD acceptance criteria |
| `lib/queue/sms-producer.ts` | Redis-unavailable scenario does not throw to caller |

### 9.2 Integration Tests (Vitest + Supertest)

| Scenario | Assertions |
|---|---|
| Full enrollment flow (happy path) | POST /enrollments → POST /payments/create-order → simulate webhook → enrollment ACTIVE, seats_filled incremented, SMS job queued |
| Duplicate webhook | Second identical event → 200, no state change, no duplicate SMS job |
| Batch capacity enforcement | Attempt 16th enrollment in capacity-15 batch → 409 |
| Invalid webhook signature | 400 response, no DB mutation |
| OTP rate limit | 6th send-otp request within 1h → 429 |
| Parent-child data isolation | Parent cannot access non-linked student's data → 403 |

### 9.3 E2E Tests (Playwright)

| Flow | Notes |
|---|---|
| Student: signup → OTP verify → browse programs → submit inquiry | Tests full public + auth funnel |
| Student: enroll → Razorpay sandbox checkout → verify dashboard shows active enrollment | Razorpay test card mode |
| Faculty: mark attendance for batch → verify Student dashboard reflects it | Cross-role data flow |
| Parent: link to student → view test scores | Link approval flow (Admin approves) |
| Admin: manage inquiry → mark enrolled | Converts inquiry to enrollment, checks inquiry_id backref |
| Payment failure → retry checkout | Verify seat held for grace period |

### 9.4 Coverage Gate (CI-enforced)

```
Unit + Integration coverage gate: 75% lines minimum
PR blocked if gate fails — no exceptions
E2E: run on staging only (not PR gate — too slow), must pass before prod deploy tag
```

---

## 10. Observability

| Concern | Tool | What to Monitor |
|---|---|---|
| Runtime errors | Sentry | All unhandled exceptions, especially in webhook handler and worker |
| Performance | Sentry Performance | P95 TTFB, webhook processing duration |
| Worker health | BullMQ dashboard (Bull-Board) | Queue depth, failed jobs, retry rates |
| Uptime | Better Uptime | `/api/health` endpoint (returns DB ping status + queue connection status) |
| DB slow queries | PostgreSQL `pg_stat_statements` | Queries over 500ms |

**Health endpoint spec:**
```
GET /api/health
Response 200: { "db": "ok", "queue": "ok", "timestamp": "..." }
Response 503: { "db": "error", "queue": "ok", ... } — partial degradation visible
```
