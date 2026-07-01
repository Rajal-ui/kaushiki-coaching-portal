# Implementation Plan: Kaushiki Classes Platform

**Version:** 1.0
**Methodology:** Agile (2-week sprints)
**Companion Docs:** PRD v1.0, TRD v1.0
**Total estimated duration:** ~14 weeks (7 sprints) to production

---

## 0. Pre-Sprint Setup (Week 0 — Before Sprint 1 Begins)

These must be done before any sprint starts or will block later sprints.

| Task | Owner | Blocks |
|---|---|---|
| GitHub repo created (monorepo), branch protection on `main` + `staging` | Dev Lead | Sprint 1 |
| GitHub Actions CI skeleton committed (lint + type check + test jobs — no actual tests yet) | Dev Lead | Sprint 1 |
| Vercel project linked to repo (`main` → prod, `staging` → staging auto-deploy) | Dev Lead | Sprint 1 |
| Railway project created: Postgres 16 + Redis 7 + Worker service configured | Dev Lead | Sprint 1 |
| Environment variables provisioned in Vercel + Railway (all from TRD Section 8.3 — placeholders for now, real secrets as they're obtained) | Dev Lead | Sprint 2+ |
| Razorpay account created, test keys obtained, webhook endpoint URL noted for Sprint 4 | Client / Dev | Sprint 4 |
| **MSG91 DLT template registration initiated** (takes 3-7 working days) | Client + Dev | Sprint 5 |
| Domain DNS configured: `www.klnbs.in` or subdomain pointed to Vercel | Client | Sprint 7 |
| Sentry project created, DSN added to env vars | Dev Lead | Sprint 1 |

**DLT Registration Warning:** MSG91 DLT registration is a regulatory requirement (TRAI, India). It cannot be fast-tracked. Start Week 0, not Sprint 5. List of templates to register is in TRD Section 7.4.

---

## Sprint 1 — Foundation + Public UI Shell (Weeks 1–2)

**Goal:** Running Next.js app deployed to staging with all public pages built against MSW mocked data. CI pipeline enforces lint and type-check.

### Tasks

**Setup**
- [ ] `npx create-next-app@latest` with TypeScript + Tailwind + App Router
- [ ] Install core deps: shadcn/ui init, React Query, React Hook Form, Zod, Prisma, BullMQ, jose, MSW 2.x
- [ ] `openapi.yaml` skeleton committed — define all endpoint paths from TRD Section 5 (request/response shapes TBD per sprint, filled in progressively)
- [ ] MSW set up: `mocks/handlers/index.ts` with handlers for `/api/tracks` and `/api/inquiries` returning static fixture data

**UI: Public Pages**
- [ ] Layout component: header (nav: Home, Programs, Contact, Login), footer (Kaushiki contact details, KLN logo — pulled from config, not hardcoded)
- [ ] Home page: hero ("Learn. Grow. Excel."), 6-pillars grid (Concept-Based Learning, Tests & Assessments, Individual Attention, Performance Tracking, Doubt Clearing, Result Oriented), "Why Parents Trust Us" strip (5 trust factors from flyer), admissions-open banner (text from Admin-editable config field — hardcode value in MVP env var: "2026-27")
- [ ] Programs page: 4 track cards (Classes 1–5, Classes 6–10, Classes 11–12 Commerce, CA Foundation & Intermediate), each with subject list per TRD schema, board coverage tag, "Inquire Now" CTA → Contact pre-filled. ISR revalidate 60s.
- [ ] Contact/Inquiry page: form (Name, Phone, Email optional, Track of interest dropdown, Message), inline Zod validation, success/error states, no submit yet (MSW mock returns 200)
- [ ] 404 page, error boundary page

**CI**
- [ ] GitHub Actions: on-PR job → ESLint + TypeScript `tsc --noEmit` + `next build` check
- [ ] Staging auto-deploy on merge to `staging` branch via Vercel

**Definition of Done:** All public pages render correctly on staging. CI passes. No hardcoded contact details (everything in config/env).

---

## Sprint 2 — Database + Auth (Weeks 3–4)

**Goal:** Prisma schema live against real Postgres. Phone OTP auth working end-to-end.

### Tasks

**Database**
- [ ] `prisma/schema.prisma` — full schema from TRD Section 4 committed
- [ ] `prisma migrate dev --name init` → baseline migration
- [ ] Seed script: seed 4 Tracks with correct names + board coverage, seed Subjects per track (exact list from PRD Section 3.2 verified against flyer)
- [ ] All indexes from TRD Section 8.1 added as `@@index` in Prisma schema
- [ ] `ProcessedWebhookEvent` model confirmed + `gatewayEventId` UNIQUE constraint verified

**Auth — API Routes**
- [ ] `POST /api/auth/send-otp`: phone validation (Indian mobile — 10 digits, starts 6-9), OTP generate (6-digit crypto random), bcrypt hash, store in Redis with TTL 300s, rate-limit 5/hour/phone, enqueue SMS (mock SMS in this sprint — real MSG91 in Sprint 5)
- [ ] `POST /api/auth/verify-otp`: fetch from Redis, compare hash, decrement attempts (max 3), on success issue JWT access + refresh tokens per TRD Section 7.1, DEL OTP from Redis
- [ ] `POST /api/auth/refresh`: validate refresh token hash from Redis, rotate
- [ ] `POST /api/auth/logout`: DEL refresh token from Redis
- [ ] Auth middleware (`lib/auth/middleware.ts`): extract + verify access token, attach `req.user`, return 401 if invalid/expired

**Auth — UI**
- [ ] Login page: phone input → OTP request → 6-digit OTP input → submit → redirect to role-appropriate dashboard
- [ ] Signup page: Name + Phone → OTP verify → account created → same redirect
- [ ] Protected route wrapper (redirect to login if no valid token)
- [ ] Role-based redirect on login: student → `/dashboard/student`, parent → `/dashboard/parent`, faculty → `/dashboard/faculty`, admin → `/dashboard/admin`

**MSW**
- [ ] Update MSW handlers to require `Authorization: Bearer <token>` header on protected endpoints — simulate 401 for missing token

**Tests**
- [ ] Unit: OTP generation (entropy, not `Math.random()`), OTP rate-limit counter logic
- [ ] Unit: JWT sign/verify (valid, expired, tampered)
- [ ] Integration: full OTP flow (send → verify → tokens returned), rate-limit enforcement (6th request → 429)

**Definition of Done:** User can sign up and log in via OTP on staging. Protected routes redirect unauthenticated users. Migration runs cleanly in Railway Postgres.

---

## Sprint 3 — Batch Management + Admin Panel (Core) (Weeks 5–6)

**Goal:** Admin can manage batches and faculty. Faculty dashboard shows assigned batches. Admin inquiry pipeline live.

### Tasks

**Batches — API**
- [ ] `GET /api/tracks` — public, returns Tracks + Subjects from DB (replacing MSW mock)
- [ ] `GET /api/tracks/:id/batches` — public, returns active batches with `seatsFilled / capacity` (ISR-compatible — add `cache: 'no-store'` on auth endpoints, ISR on public)
- [ ] `POST /api/batches` — Admin only: create batch (subject, faculty, capacity, schedule)
- [ ] `PATCH /api/batches/:id` — Admin only: update
- [ ] `GET /api/batches/:id/roster` — Faculty/Admin: student list

**Inquiries — API**
- [ ] `POST /api/inquiries` — public, rate-limited (5/IP/hour via Redis), honeypot field check, creates Inquiry record in DB (replacing MSW mock)
- [ ] `GET /api/inquiries` — Admin only, paginated, filter by status/track/assignee
- [ ] `PATCH /api/inquiries/:id` — Admin only: update status, assign to staff member

**Admin Dashboard — UI**
- [ ] Left nav layout (Inquiries, Batches, Enrollments, Fees, Faculty, SMS Logs, Settings)
- [ ] Summary cards: open inquiries count, active batches count, batches at/near capacity (visual warning)
- [ ] Inquiries table: name, phone, track, status badge, assignee dropdown, date, status-update action
- [ ] Batches table: track, subject, faculty name, `seats_filled/capacity` progress bar, schedule, status, edit action
- [ ] Create Batch form/modal: subject dropdown (filtered by track), faculty picker, capacity number input, schedule text

**Faculty Dashboard — UI**
- [ ] My Batches list: subject, track, capacity fill, schedule
- [ ] (Roster view deferred to Sprint 4 when enrollment exists)

**Tests**
- [ ] Integration: Admin CRUD on batches (create, read, update)
- [ ] Integration: Inquiry rate-limit (6th from same IP → 429), honeypot reject
- [ ] Integration: Non-admin access to `/api/batches` POST → 403

**Definition of Done:** Admin can create batches and assign faculty. Contact form submissions go to real DB. Inquiry pipeline visible + manageable in Admin panel.

---

## Sprint 4 — Enrollment + Razorpay Payment (Weeks 7–8)

**Goal:** Full enrollment + payment flow working in Razorpay sandbox. Atomic transaction implemented. Seat-count enforcement live.

### Tasks

**Enrollment — API**
- [ ] `POST /api/enrollments`: validate student not already enrolled in same batch (`@@unique`), check batch capacity (reject if full), create `Enrollment` (PENDING) + `Payment` (PENDING + `gatewayOrderId`)  in single transaction, return Razorpay `order_id` to client
- [ ] `GET /api/enrollments/me` — Student: own active enrollments with batch/subject/faculty info
- [ ] `GET /api/enrollments?studentId=` — Admin/Parent: scoped query (Parent: verify `ParentStudentLink.status = APPROVED` before returning)

**Payments — API**
- [ ] `POST /api/payments/create-order`: call Razorpay API to create order, return `order_id` + `key_id` to client for checkout widget initialization
- [ ] `POST /api/payments/webhook`: full implementation per TRD Section 6.4:
  - Raw body read (before JSON.parse — critical for HMAC)
  - Signature verify
  - `payment.captured` → `activateEnrollment()` transaction (TRD Section 6.2)
  - `payment.failed` → update Payment to FAILED, enqueue SMS (mock in this sprint)
- [ ] `POST /api/payments/:id/refund` — Admin: Razorpay refund API call, on success update Payment + Enrollment, decrement `seatsFilled`

**Checkout — UI**
- [ ] "Enroll" button on Programs/Batch detail page (Student/Parent authenticated)
- [ ] Razorpay checkout widget integration (client-side SDK, `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
- [ ] Post-payment redirect: polling or webhook-callback-driven status page (poll `/api/enrollments/me` for status change from PENDING to ACTIVE — do not trust redirect callback alone)
- [ ] Student Dashboard: "My Batches" section with live enrollment status

**Parent-Student Linking — API + UI**
- [ ] `POST /api/links/request` — Parent or Student initiates link (provides other party's phone)
- [ ] `POST /api/links/:id/approve` — Admin (or Student for self-service, configurable)
- [ ] Parent Dashboard: show linked children selector + child's enrollment/fee data

**Attendance + Test Scores — API**
- [ ] `POST /api/attendance/bulk` — Faculty/Admin: mark session attendance (array of {studentId, present})
- [ ] `GET /api/attendance?batchId=&studentId=` — scoped by role
- [ ] `POST /api/scores` — Faculty/Admin: bulk score entry per test
- [ ] `GET /api/scores?batchId=&studentId=` — scoped

**Faculty + Student Dashboard — UI (extended)**
- [ ] Faculty: batch roster, attendance-entry grid (date picker + per-student checkbox), test-score entry table
- [ ] Student: attendance % display, test scores list/chart (simple line chart: score over tests)

**Tests**
- [ ] Integration: full enrollment happy path (POST → webhook → ACTIVE + seatsFilled++)
- [ ] Integration: capacity enforcement (16th enrollment on capacity-15 batch → 409)
- [ ] Integration: duplicate webhook idempotency (second identical event → no state change)
- [ ] Integration: invalid webhook signature → 400
- [ ] E2E (Playwright + Razorpay sandbox): student enrolls → pays → dashboard shows active

**Definition of Done:** Student can enroll and pay via Razorpay sandbox. Seat count accurate. Webhook idempotency verified via integration test. Parent can view child's enrollment after link approval.

---

## Sprint 5 — SMS Integration + Doubt Queries (Weeks 9–10)

**Goal:** Real SMS via MSG91 (DLT templates confirmed by now — started Week 0). Doubt-clearing query system live.

### Pre-sprint gate:** Confirm MSG91 DLT templates approved. If not, use MSG91 in non-DLT test mode and delay production SMS go-live — do NOT skip this sprint, build the system, just toggle to test mode.

### Tasks

**Redis Worker Setup**
- [ ] `workers/sms-worker.ts` implemented per TRD Section 6.3 — separate Node process
- [ ] Railway: configure `workers/` as a separate Railway service (always-on, auto-restart)
- [ ] Bull-Board UI added at `/admin/queues` (admin-auth-gated) for queue visibility

**SMS Integration — Real MSG91**
- [ ] `lib/sms/msg91.ts`: HTTP adapter for MSG91 transactional SMS API using DLT template IDs from env vars
- [ ] Replace mock SMS calls in `/api/auth/send-otp` with real MSG91 (OTP SMS template)
- [ ] Replace mock SMS jobs in webhook handler with real enqueue → real worker dispatch
- [ ] Test all 6 triggers end-to-end in staging (with MSG91 test/sandbox numbers)

**SMS Logs — Admin UI**
- [ ] SMS Logs page in Admin panel: table (recipient phone, trigger event, template, status badge, timestamp, retry count)
- [ ] Filter by status (QUEUED / SENT / FAILED)
- [ ] Manual resend button per failed log → `POST /api/sms-logs/:id/retry`

**Doubt Queries — API**
- [ ] `POST /api/doubts` — Student: subject + question + optional image upload (store to Vercel Blob or Cloudflare R2, save URL to `attachmentUrl`)
- [ ] `GET /api/doubts?batchId=` — Faculty: query inbox, filter open/answered
- [ ] `PATCH /api/doubts/:id/respond` — Faculty/Admin: save responseText, update status, enqueue SMS to Student

**Doubt Queries — UI**
- [ ] Student dashboard: "Ask a Doubt" tab — batch/subject selector (from enrolled batches), text area, optional photo upload
- [ ] Student dashboard: "My Queries" list with response thread view
- [ ] Parent dashboard: read-only view of child's queries + responses
- [ ] Faculty dashboard: Query Inbox — list of open queries per batch, respond inline

**Tests**
- [ ] Unit: `lib/sms/msg91.ts` (mock HTTP, verify request shape, template ID injection)
- [ ] Unit: SMS producer — Redis unavailable scenario (no throw to caller, error logged)
- [ ] Integration: Doubt query submit → appears in Faculty inbox, Faculty responds → SMS job enqueued
- [ ] Integration: SMS retry (worker failure → retry count increments → FAILED after 3)

**Definition of Done:** Real SMS sends in staging for all 6 triggers. Doubt queries flow Student → Faculty → response visible to Student + Parent. Admin can see and retry failed SMS logs.

---

## Sprint 6 — QA, Hardening, Performance, E2E (Weeks 11–12)

**Goal:** Staging environment == production-ready. All E2E flows pass. Performance targets met. Security audit passed.

### Tasks

**QA & E2E Coverage**
- [ ] Playwright: all 6 E2E flows from TRD Section 9.3 passing on staging
- [ ] Load test: simulate 50 concurrent users (k6 or Artillery) — confirm P95 TTFB < 500ms, no DB connection pool exhaustion
- [ ] Manual QA pass: all user roles (Student, Parent, Faculty, Admin) — walk every PRD acceptance criteria item manually

**Hardening**
- [ ] Security audit checklist:
  - [ ] All API routes: role middleware attached? Test unauthenticated + wrong-role access for every endpoint
  - [ ] Webhook: raw body parsing confirmed (not pre-parsed JSON) — HMAC verified against raw bytes
  - [ ] OTP: Redis hash stores bcrypt hash, not plain text — verify
  - [ ] Refresh token: HttpOnly + Secure + SameSite=Strict cookie confirmed in response headers
  - [ ] Razorpay key: `RAZORPAY_KEY_SECRET` never appears in client bundle (`NEXT_PUBLIC_` prefix absent) — `next build` output audit
  - [ ] All `console.log()` containing user PII replaced with structured logging (no PII in logs)
  - [ ] Rate limiting: manually trigger limits on OTP + inquiry endpoints
- [ ] Sentry: verify errors surface with correct stack traces (source maps uploaded)
- [ ] Health endpoint `/api/health` implemented and tested

**Performance**
- [ ] Lighthouse audit on Programs page (public, SEO-important): target LCP < 2.5s, CLS < 0.1
- [ ] Next.js Image component used for all images (auto-optimize)
- [ ] Programs page ISR confirmed (60s revalidate) — verify stale-while-revalidate behavior

**Admin Settings Page**
- [ ] Admissions cycle label (editable by Admin → stored in DB config table, not hardcoded)
- [ ] Institution contact details (phone, email, address) — editable by Admin, reflected on public pages without redeploy
- [ ] MSG91 DLT template IDs configurable (so template changes don't require env var redeploy)

**DB Maintenance**
- [ ] Migration: confirm all indexes created in Railway Postgres (run `\d tablename` to verify)
- [ ] Backup: Railway auto-backup configured + tested restore once

**Definition of Done:** All E2E Playwright tests green on staging. Lighthouse scores on target. Security checklist 100% complete. No P0 bugs open.

---

## Sprint 7 — Production Deploy + Monitoring + Handover (Weeks 13–14)

**Goal:** Live on Kaushiki's domain. Monitoring active. Client team trained.

### Tasks

**Production Deploy**
- [ ] GitHub Actions prod-deploy workflow: trigger on git tag `v1.0.0` only
  ```yaml
  # .github/workflows/deploy-prod.yml
  on:
    push:
      tags: ['v*']
  jobs:
    deploy:
      steps:
        - run: vitest run                          # Full test suite
        - run: playwright test --project=staging   # E2E on staging
        - run: prisma migrate deploy               # Run migrations on prod DB
        - run: vercel --prod                       # Deploy to Vercel prod
        - run: curl $PROD_URL/api/health           # Smoke test
  ```
- [ ] Production env vars set in Vercel + Railway (real Razorpay live keys, real MSG91 DLT templates)
- [ ] Domain: `www.klnbs.in` CNAME → Vercel production URL (or custom domain set in Vercel)
- [ ] SSL: auto-provisioned by Vercel (Let's Encrypt) — verify HTTPS-only

**Monitoring Go-Live**
- [ ] Better Uptime: monitor `https://www.klnbs.in/api/health` every 2 min, alert to Admin phone + email on downtime
- [ ] Sentry: production DSN active, test by triggering a known error, confirm alert received
- [ ] Bull-Board: admin queue UI accessible at production URL for worker monitoring
- [ ] Railway: set up memory/CPU alerts for worker process

**Real Razorpay Live Smoke Test**
- [ ] One real INR transaction (₹1 test if Razorpay allows, or actual course fee) end-to-end: checkout → webhook → enrollment ACTIVE → SMS received
- [ ] Verify SMS delivery on Indian number with DLT-registered template

**Client Handover**
- [ ] Admin walkthrough: batch creation, inquiry management, fee tracking, SMS log review
- [ ] Faculty walkthrough: attendance entry, test scores, doubt query inbox
- [ ] Handover doc: "Admin Operations Guide" — how to open new admissions cycle, add faculty, archive old batches, pull payment report
- [ ] Emergency runbook: what to do if Razorpay webhook stops firing, if SMS queue backs up, if Railway Postgres goes down

**Definition of Done:** Platform live on production domain. One real payment completed successfully. Client team can operate the platform independently.

---

## Dependency Map (Critical Path)

```
Week 0: Infra setup + MSG91 DLT registration (START DLT NOW)
    │
Sprint 1: Public UI + MSW + CI
    │
Sprint 2: Auth (OTP + JWT)
    │
Sprint 3: Batch Mgmt + Admin Panel + Inquiries
    │
Sprint 4: Enrollment + Razorpay Payment ◄── CRITICAL: Razorpay test keys must be ready
    │
Sprint 5: SMS + Doubt Queries ◄──────────── CRITICAL: MSG91 DLT approval must be in by now
    │
Sprint 6: QA + Hardening + Perf
    │
Sprint 7: Prod Deploy ◄───────────────────── Client: domain DNS + live Razorpay keys ready
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| MSG91 DLT approval delayed | Medium | High (blocks Sprint 5 SMS go-live) | Start Week 0, use MSG91 sandbox mode if approval delayed — ship SMS system, go live pending template approval |
| Razorpay webhook delivery unreliable in production | Low | High | Implement dead-letter mechanism — any webhook that errors 3x alerts Admin for manual reconciliation |
| Batch capacity race condition (2 enrollments simultaneously fill last seat) | Low | Medium | DB `$transaction` with `seatsFilled < capacity` check inside transaction (TRD Section 6.2) — eliminates race at DB level |
| Client DNS misconfiguration at deploy | Medium | Medium | Document exact DNS record type/value in handover doc; validate on staging subdomain first |
| Playwright E2E tests flaky due to Razorpay sandbox timing | Medium | Low | Mock payment confirmation in E2E (bypass real Razorpay widget, call webhook directly) for CI reliability; real Razorpay E2E only in manual QA |
| Faculty enters wrong attendance/scores (data error) | High | Medium | Admin can edit attendance/scores (POST → PATCH support), with audit log of who changed what and when |

---

## Definition of Done (Project-Level)

- [ ] All 7 PRD acceptance criteria groups verifiable in production
- [ ] E2E: Student → Inquiry → Enrollment → Payment → SMS → Dashboard flow complete in under 3 minutes
- [ ] All security checklist items from Sprint 6 passed
- [ ] MSG91 DLT templates live (not sandbox) for all 6 trigger events
- [ ] Client Admin team has completed training walkthrough
- [ ] Monitoring alerts tested and confirmed routing to client contacts
- [ ] Codebase: `main` branch clean, no TODO/FIXME comments in production paths, README complete
