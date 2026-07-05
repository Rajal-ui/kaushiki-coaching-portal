# Changelog

All notable changes to this project are documented in this file.

## [Sprint 8] — 2026-07-05

### Added
- Comprehensive seed data: 9 users, 4 batches, 5 enrollments, 5 payments, 40 attendance records, 11 test scores, 4 doubt queries, 5 inquiries, 5 SMS logs
- Admin portal: 17 API routes (stats, revenue-trend, enrollment-trend, track-distribution, batch-fill-rates, student-risks, activity-feed, students CRUD, faculty CRUD, schedule CRUD, 4 report types with CSV export)
- Admin UI: 10 pages (dashboard with Recharts charts, inquiries pipeline, batches CRUD, students search/profile, faculty management, schedule calendar, 4 reports with CSV download, SMS logs with retry)
- DashboardSidebar (role-aware), TopBar, useRealtimeQuery hook
- Student dashboard: 5 tabs (Batches, Scores w/ Recharts, Attendance, Doubts, Fees)
- Parent dashboard: child selector with summary cards and linked monitoring
- Faculty dashboard: batch cards + attendance entry + score entry + doubt inbox
- Public pages: `/about`, `/programs/[slug]`
- `@tanstack/react-query`, `recharts`, `csv-stringify` dependencies
- Prisma models: `ClassSession`, `SystemConfig`
- React Query `Providers` wrapper in root layout

### Changed
- Admin layout: migrated to shared DashboardSidebar + TopBar

### Fixed
- Build error: Suspense boundary for `useSearchParams()` in faculty doubts page
- `useRealtimeQuery` hook: type-safe options with `Omit<UseQueryOptions, 'queryKey' | 'queryFn'>`

## [Sprint 7] — 2026-07-05

### Added
- In-memory Redis fallback (`redis-fallback.ts`) — Map-based store implements `get/set/del/incr/expire/ttl/rpush/blpop`
- Auto-fallback: background Redis connect attempt, seamless switch to in-memory when unavailable
- Docker-free development: only PostgreSQL required

## [Sprint 6] — 2026-07-05

### Added
- `/api/health` endpoint (DB + Redis connectivity check)
- `SiteSetting` model + migration for configurable platform settings
- Admin settings page (`/dashboard/admin/settings`) — edit institution info, MSG91 template IDs
- Security integration tests: auth enforcement, RBAC, webhook HMAC rejection
- Playwright E2E config + 3 spec files (auth, enrollment, health)
- Landing page inquiry form wired to `/api/inquiries` with honeypot spam protection

### Security
- Webhook: verified raw body parsing (`req.text()`) before HMAC verification
- All 30 protected routes have authorization checks — no unprotected endpoints
- Rate limiting: OTP (5/hr/phone) and inquiries (5/hr/IP)

## [Sprint 4–5] — 2026-07-05

### Added
- Enrollment + Razorpay payment flow (atomic transaction, capacity check, webhook-driven seat activation)
- Parent-student linking API (request → admin approval)
- Attendance + Test Scores API (faculty bulk entry, role-scoped reads)
- MSG91 SMS integration (Flow API adapter, Redis queue worker)
- SMS logs admin UI with manual retry
- Doubt queries (student submit → faculty respond → SMS notification)
- RazorpayCheckout component, QueriesSection component
- Faculty dashboard with attendance entry grid and score entry table

## [Sprint 3] — 2026-07-05

### Added
- Batch CRUD API (tracks, batches, roster, my-batches)
- Inquiry API (public POST with rate-limit + honeypot, admin GET/PATCH)
- Password login (email/phone + bcrypt), Google OAuth
- Role selector on signup, tabs on login page
- Admin/Faculty dashboards

## [Sprint 2] — 2026-07-05

### Added
- Prisma schema (14 models, 10 enums)
- Auth library (OTP, JWT, middleware, Redis, SMS mock)
- Auth API routes (send-otp, verify-otp, signup, refresh, logout)
- Auth UI (login, signup, ProtectedRoute)
- Role-based dashboard pages

## [Sprint 0–1] — 2026-07-05

### Added
- Next.js 16 project structure with Turbopack
- Tailwind CSS with custom design tokens
- Core UI primitives (Button, Input, Card, Sidebar, DataTable)
- Husky pre-commit hooks + lint-staged
- GitHub Actions CI workflow
- MSW test mocking infrastructure
