# Kaushiki Coaching Portal

[![Build Status](https://img.shields.io/github/actions/workflow/status/Rajal-ui/kaushiki-coaching-portal/main.yml?branch=main)](https://github.com/Rajal-ui/kaushiki-coaching-portal/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Full-stack EdTech platform for coaching centre management — attendance, fees, test scores, parent communication, and analytics.

**Kaushiki Classes** is a single-tenant educational institution management platform that digitises the entire student lifecycle — from inquiry and enrollment to daily attendance, test performance, fee collection, and parent engagement. Built for small-to-medium coaching centres in India.

### Key Features
- **Role-based dashboards** — Admin, Faculty, Student, Parent with tailored views
- **Enrollment + Payment flow** — Razorpay integration with webhook-driven seat activation
- **Real-time analytics** — Revenue trends, batch fill rates, student risk detection
- **Communication** — In-app notifications, SMS (MSG91) for doubt responses & payment confirmations
- **Inquiry pipeline** — Lead capture with honeypot spam protection, admin funnel management
- **Parent-student linking** — Parents monitor child's attendance, scores, and doubts
- **Doubt queries** — Students submit, faculty respond inline, instant notification
- **Reports & CSV exports** — Revenue, enrollment, attendance, and score reports

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | v20+ | Includes npm |
| **PostgreSQL** | 16 | Required — install locally or use Railway free tier |
| **Redis** | 7 | Optional — app auto-falls back to in-memory store |

### Installation

```bash
# Clone the repository
git clone https://github.com/Rajal-ui/kaushiki-coaching-portal.git
cd kaushiki-coaching-portal

# Copy environment file
cp .env.example .env

# Install dependencies
npm install
```

### Database Setup

```bash
# Apply all database migrations
npx prisma migrate dev

# Seed development data (9 users, 4 batches, 40 attendance records, etc.)
npx prisma db seed

# (Optional) Explore data visually
npx prisma studio
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Docker not required.** Redis has a built-in in-memory fallback — only PostgreSQL needs to be running.

### Login Credentials

All accounts use password **`Kaushiki@123`** — login at `/login` using the Password tab.

| Role | Name | Phone |
|------|------|-------|
| Admin | Rajesh Sharma | `9175498572` |
| Faculty | Priya Kulkarni | `9876543210` |
| Faculty | Amit Desai | `9823456701` |
| Faculty | Sunita Joshi | `9712345678` |
| Student | Arjun Patil | `9900112233` |
| Student | Sneha Mehta | `9900223344` |
| Student | Rohan Kadam | `9900334455` |
| Parent | Suresh Patil | `9800112233` |
| Parent | Anita Mehta | `9800223344` |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Rajal-ui/kaushiki-coaching-portal.git
cd kaushiki-coaching-portal
cp .env.example .env
npm install

# 2. Database (PostgreSQL running on localhost:5432)
npx prisma migrate dev
npx prisma db seed

# 3. Start
npm run dev
# → http://localhost:3000
```

**Docker-free development:** Redis has an in-memory fallback when unavailable. Only PostgreSQL is required (install locally or use Railway free tier).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL 16 via Prisma 7 ORM |
| **Cache / Queue** | Redis 7 (`ioredis` with in-memory fallback) |
| **Auth** | OTP (bcrypt hashes, Redis TTL), JWT (jose, HS256), Google OAuth |
| **Payments** | Razorpay (orders, webhooks, refunds) |
| **SMS** | MSG91 transactional API + Redis worker |
| **UI** | Tailwind CSS, shadcn/ui primitives, Lucide icons |
| **Charts** | Recharts |
| **State / Data** | React Query (`@tanstack/react-query`) with polling |
| **Testing** | Jest + MSW (unit/integration), Playwright (E2E) |
| **CI/CD** | Husky pre-commit hooks (test → lint → type-check) |

---

## Sprint Completion

| Sprint | Focus | Status |
|--------|-------|--------|
| **0** | Infrastructure, Tailwind design system, UI primitives, pre-commit hooks, CI | ✅ |
| **1–2** | Database schema (16 models, 10 enums), auth (OTP/JWT/Google), Redis | ✅ |
| **3** | Batch CRUD, inquiry management, role-based dashboards, auth refactor | ✅ |
| **4** | Enrollment + Razorpay payment flow, parent-student linking, attendance/scoring APIs | ✅ |
| **5** | MSG91 SMS integration, Redis worker, SMS logs admin, doubt queries | ✅ |
| **6** | QA hardening, health endpoint, admin settings, Playwright E2E, security audit | ✅ |
| **7** | Redis in-memory fallback (zero Docker dependency for dev) | ✅ |
| **8** | Mock data seeding, full admin portal, real-time polling, all role dashboards | ✅ |
| **9** | In-app notifications system (bell + dropdown + full page, auto-creation on events) | ✅ |

---

## Architecture

### Route Structure

```
/                      Landing page (public)
/about                 About Kaushiki Classes (public)
/programs/[slug]       Track detail + batch list (public)

/login | /signup       Auth pages

/dashboard/admin/*     Admin portal (full CRUD + analytics)
/dashboard/faculty/*   Faculty portal (attendance, scores, doubts)
/dashboard/student/*   Student hub (batches, scores, attendance, doubts, fees)
/dashboard/parent/*    Parent portal (child monitoring)

/api/auth/*            Auth endpoints (public)
/api/tracks            Track listing (public, ISR 60s)
/api/inquiries         Inquiry form (public, rate-limited)

/api/batches/*         Batch CRUD (admin/faculty)
/api/enrollments/*     Enrollment + payment (student/parent)
/api/payments/*        Razorpay orders + webhook + refunds
/api/attendance/*      Attendance records (faculty/student/parent)
/api/scores/*          Test scores (faculty/student/parent)
/api/doubts/*          Doubt queries (student/faculty/admin)
/api/links/*           Parent-student linking
/api/sms-logs/*        SMS audit log (admin)

/api/admin/*           Admin dashboard APIs (stats, reports, charts, CSV exports)
/api/health            Health check (DB + Redis)
```

### Data Flow

```
User → Browser → Next.js App Router → API Route Handler
                                         │
                           ┌─────────────┼─────────────┐
                           ▼             ▼             ▼
                       Prisma ORM     Redis         Razorpay
                           │          (cache,         │
                           ▼           queue)         ▼
                      PostgreSQL      MSG91       Webhook
                                       SMS
```

### Role-Based Access

| Route | Middleware |
|-------|-----------|
| `/dashboard/admin/*` | `ProtectedRoute allowedRoles={['ADMIN']}` |
| `/dashboard/faculty/*` | `ProtectedRoute allowedRoles={['FACULTY','ADMIN']}` |
| `/dashboard/student/*` | `ProtectedRoute allowedRoles={['STUDENT']}` |
| `/dashboard/parent/*` | `ProtectedRoute allowedRoles={['PARENT']}` |
| All API routes | `authenticateRequest()` + inline role check |

---

## Development Credentials

All passwords: **`Kaushiki@123`**

| Role | Name | Phone |
|------|------|-------|
| **Admin** | Rajesh Sharma | `9175498572` |
| **Faculty** | Priya Kulkarni | `9876543210` |
| **Faculty** | Amit Desai | `9823456701` |
| **Faculty** | Sunita Joshi | `9712345678` |
| **Student** | Arjun Patil | `9900112233` |
| **Student** | Sneha Mehta | `9900223344` |
| **Student** | Rohan Kadam | `9900334455` |
| **Parent** | Suresh Patil | `9800112233` — linked to Arjun |
| **Parent** | Anita Mehta | `9800223344` — linked to Sneha |

Login at `/login` using **Password** tab with any phone + password `Kaushiki@123`.

---

## Pre-Commit Hooks

Every commit runs: `npm test` → `npx lint-staged` → `npm run type-check`. All three must pass.

```bash
# Manual pre-push verification
npm run lint && npm run type-check && npm run test && npm run build
```

---

## Codebase Map

```
├── app/                     Next.js App Router
│   ├── api/                 All API route handlers (50+ endpoints)
│   ├── dashboard/           Role-based dashboard pages
│   ├── about/ | programs/   Public pages
│   └── login/ | signup/     Auth pages
├── components/
│   ├── ui/                  Design system primitives (shadcn)
│   ├── layout/              Sidebar, TopBar, Providers
│   ├── auth/                ProtectedRoute, Google One Tap
│   └── payment/             Razorpay checkout
├── lib/
│   ├── auth/                JWT, OTP, middleware
│   ├── db/                  Prisma singleton (adapter-pg)
│   ├── sms/                 MSG91 adapter, SMS queue, mock
│   ├── validators/          Zod schemas per domain
│   └── hooks/               useRealtimeQuery
├── prisma/
│   ├── schema.prisma        16 models, 10 enums
│   └── seed.ts              Development seed data
├── workers/
│   └── sms-worker.ts        Standalone Redis SMS worker
├── __tests__/               Jest test suites (60 tests, 10 suites)
└── e2e/                     Playwright E2E specs
```

---

## Seed Data Overview

`prisma db seed` creates realistic demo data for all 16 models:

| Model | Records | Notes |
|-------|---------|-------|
| Users | 9 | 1 admin, 3 faculty, 3 students, 2 parents |
| Tracks | 4 | Classes 1–5 through CA Foundation |
| Subjects | 11 | Mapped to tracks |
| Batches | 4 | Math, Science, Accountancy, CA Foundation |
| Enrollments | 5 | 3 students across batches |
| Payments | 5 | 4 SUCCEEDED, 1 FAILED |
| Attendance | 40 | 10 sessions × 5 student-batch combos |
| Test Scores | 11 | Realistic scores with remarks |
| Doubts | 4 | 2 ANSWERED, 2 OPEN |
| Inquiries | 5 | Mixed statuses |
| SMS Logs | 5 | DELIVERED, SENT, FAILED |
| Notifications | 12 | Doubt answers, payments, enrollments, link approvals, inquiries |
| Parent Links | 2 | Suresh↔Arjun, Anita↔Sneha |

---

## API Endpoints Summary

### Auth
`POST /api/auth/send-otp` | `POST /api/auth/verify-otp` | `POST /api/auth/signup` | `POST /api/auth/login` | `POST /api/auth/google` | `POST /api/auth/refresh` | `POST /api/auth/logout`

### Batches
`GET/POST /api/batches` | `PATCH /api/batches/[id]` | `GET /api/batches/[id]/roster` | `GET /api/batches/my`

### Enrollment & Payments
`POST /api/enrollments` | `GET /api/enrollments/me` | `POST /api/payments/create-order` | `POST /api/payments/webhook` | `POST /api/payments/[id]/refund`

### Operations
`GET/POST /api/attendance` | `POST /api/attendance/bulk` | `GET/POST /api/scores` | `POST/GET /api/doubts` | `PATCH /api/doubts/[id]/respond`

### Notifications
`GET /api/notifications` | `GET /api/notifications/unread-count` | `POST /api/notifications/read-all` | `PATCH /api/notifications/[id]/read`

### Admin
`GET/POST/PATCH /api/admin/stats` | `/revenue-trend` | `/enrollment-trend` | `/track-distribution` | `/batch-fill-rates` | `/student-risks` | `/activity-feed` | `/admin/students` | `/admin/faculty` | `/admin/schedule` | `/admin/reports/*` (4 reports, CSV export)

### Admin Config
`GET /api/settings` | `PATCH /api/settings` | `GET/POST /api/sms-logs`

### Public
`GET /api/tracks` | `GET /api/tracks/[id]/batches` | `POST /api/inquiries` | `GET /api/health`

---

## License

MIT — see [LICENSE](./LICENSE).
