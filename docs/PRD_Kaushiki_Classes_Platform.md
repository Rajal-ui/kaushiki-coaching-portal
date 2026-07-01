# Product Requirements Document: Kaushiki Classes — Learning Management & Enrollment Platform

**Version:** 1.0 (MVP Blueprint)
**Status:** Draft for Engineering Handoff
**Client/Tenant:** Kaushiki Classes (powered by KLN Business Solutions)
**Author:** Principal PM
**Last Updated:** June 2026

---

## 0. Source-of-Truth Reference (Verified from Brand Collateral)

This PRD is aligned to the institution's existing print marketing material (admissions flyer). The following facts are treated as binding product requirements, not creative suggestions:

| Field | Value |
|---|---|
| Brand name | Kaushiki Classes |
| Tagline | "Learn. Grow. Excel." |
| Parent entity | KLN Business Solutions |
| Admissions cycle | 2026–27 |
| Contact phone | 9175498572 |
| Email | kaushikiclasses@klnbs.in |
| Web (parent co.) | www.klnbs.in |
| Physical address | Survey No. 36 S, Jambhulwadi Road, Shani Nagar, Ambegaon Khurd, Pune – 411046 |
| Academic tracks offered | Classes 1–10 (CBSE / ICSE / State Board), Classes 11–12 (Commerce only), CA Foundation & Intermediate Prep |
| Core pillars (marketed) | Concept-Based Learning, Regular Tests & Assessments, Individual Attention, Performance Tracking, Doubt Clearing Sessions, Result Oriented |
| Trust factors (marketed) | Experienced & caring faculty, small batch size, disciplined & supportive environment, personalised attention, regular parent feedback |

**Single-tenant clarification:** This is a single-institution build, not a multi-school SaaS. Multi-tenancy is noted only as a future-proofing consideration (Section 6), not an active requirement. "Admin" = Kaushiki's own staff; "Instructor" = Kaushiki faculty.

---

## 1. Executive Summary & Product Vision

### 1.1 Value Proposition

A web platform for Kaushiki Classes (Pune) that converts their print/walk-in admissions model into a digital admissions + learning management system, covering four academic tracks: **Classes 1–5, Classes 6–10, Classes 11–12 Commerce, and CA Foundation/Intermediate**. The platform must mirror the institution's marketed promise — small batches, individual attention, regular parent feedback, doubt-clearing — as real product features, not just website copy.

- **For Students:** Browse programs by class/track, enroll, pay fees online, access learning material, view test performance.
- **For Parents:** Visibility into their child's attendance, test performance, and fee status — this is a marketed trust factor ("Regular Parent Feedback"), so it must be a real, working feature, not implied only.
- **For Kaushiki Staff (Admin/Faculty):** Manage batches (small-batch enforcement), track admissions inquiries (replacing the phone-call/walk-in funnel), record test results, and reconcile fee payments — without manual register-keeping.

### 1.2 Friction Points Targeted

| Persona | Current Friction (Pre-Digital) | How Platform Solves It |
|---|---|---|
| **Student** | No online way to see test scores, syllabus progress, or fee due dates | Dashboard with progress, test results, fee status |
| **Parent** | Feedback currently informal (phone calls/in-person) — no self-serve visibility | Parent-facing view of attendance, performance, fee status — fulfils the "Regular Parent Feedback" promise digitally |
| **Faculty** | Manual register for attendance/test marks per batch | Digital batch roster, test-marks entry, doubt-query inbox |
| **Admin (Kaushiki staff)** | Admissions inquiries via phone only, fee collection manual/cash-register, no batch-capacity tracking | Structured inquiry pipeline, online fee payment reconciliation, batch seat-limit enforcement (small-batch promise becomes enforced, not just claimed) |

### 1.3 In Scope vs. Out of Scope

**In scope (MVP):**
- Public website: Home/About, Programs (4 tracks as marketed), Admissions Inquiry form, Contact.
- Student + Parent portal (linked accounts).
- Admin panel for Kaushiki staff: batch management, inquiry pipeline, fee/payment tracking, test-score entry.
- Online fee payment (Razorpay — INR, Pune-based institution, no multi-currency need).
- SMS notifications: admission confirmation, fee due/paid, test result published, doubt-query response.
- Doubt-clearing query feature (lightweight — student/parent submits a query tied to a subject/batch, faculty responds; this directly maps to the flyer's "Doubt Clearing Sessions" pillar).

**Out of scope (MVP):**
- Live video classes (in-center/hybrid model per flyer's physical address — not a pure-online provider like Vedantu; live class tooling deferred).
- Multi-branch/multi-center support (single Pune location per flyer — add only if Kaushiki opens a second center).
- Native mobile apps (responsive web only).
- Multi-tenancy / multi-institution white-labeling (KLN Business Solutions may want this later for other "Uniqu...Business Solutions" branded ventures — flagged in Section 6 only).

---

## 2. User Personas & Permissions Matrix

Flyer's "small batch, individual attention, parent feedback" promises directly drive the addition of a **Parent** persona (absent from a generic Vedantu-style model where parents are usually just the payer, not a portal user).

| Capability | **Student** | **Parent** | **Faculty (Instructor)** | **Admin (Kaushiki Staff)** |
|---|---|---|---|---|
| **Primary Objective** | Access content, view own results/attendance, raise doubts | Monitor child's progress/fees, receive updates | Manage assigned batch(es), enter test marks/attendance, answer doubt queries | Run admissions, batches, fees, full oversight |
| View programs/tracks (public) | ✅ | ✅ | ✅ | ✅ |
| Submit admissions inquiry | ✅ | ✅ | ❌ | ✅ (manual entry on behalf of walk-in) |
| Enroll & pay fees | ✅ (self) | ✅ (on behalf of child) | ❌ | ✅ (on behalf, audit-logged) |
| View own/child's dashboard (attendance, test scores, fee status) | ✅ (self) | ✅ (linked child only) | ❌ | N/A |
| Link Parent account to Student account | Requested by Student/Parent | ✅ (request/accept link) | ❌ | ✅ (approve/verify link) |
| Submit doubt query | ✅ | ❌ (visibility only, no submission) | N/A | N/A |
| Respond to doubt query | ❌ | ❌ | ✅ (own batch/subject) | ✅ (any) |
| Create/manage batches (class, track, capacity/seat limit) | ❌ | ❌ | ❌ | ✅ |
| Assign Faculty to batch | ❌ | ❌ | ❌ | ✅ |
| Enter attendance | ❌ | ❌ | ✅ (own batch) | ✅ |
| Enter/publish test scores | ❌ | ❌ | ✅ (own batch) | ✅ |
| View batch roster | ❌ | ❌ | ✅ (own batch only) | ✅ (all) |
| View fee/payment records | ❌ (own only) | ❌ (child's only) | ❌ | ✅ (full) |
| Issue refunds / fee adjustments | ❌ | ❌ | ❌ | ✅ |
| Manage admissions inquiry pipeline | ❌ | ❌ | ❌ | ✅ |
| Configure SMS templates | ❌ | ❌ | ❌ | ✅ |
| View SMS/audit logs | ❌ | ❌ | ❌ | ✅ |
| Manage payment gateway config | ❌ | ❌ | ❌ | ✅ |

**Enforcement principle (unchanged):** All role checks server-side. Batch-capacity limit is enforced at the database/application layer at enrollment time — this is the literal technical implementation of the marketed "small batch size" promise, so it cannot be a soft UI-only limit.

---

## 3. Detailed Feature Breakdown & Acceptance Criteria

### 3.1 User Management, Auth & Parent-Student Linking

**Functional Requirements:**
- Roles: `student`, `parent`, `faculty`, `admin`.
- Email or phone-based signup (phone-first is realistic for this user base — Pune K-12/CA-prep demographic; support OTP-based phone verification as primary, email optional).
- Parent-Student linking: either side can initiate a link request (e.g., Parent enters Student's enrollment ID/phone), other side or Admin approves. Prevents unauthorized people from viewing a child's data.
- Account states: `pending_verification`, `active`, `suspended`.

**Edge Cases:**
- Parent attempts to link to a Student already linked to another Parent account → blocked, flagged to Admin for manual resolution (avoid silent data leakage to wrong guardian).
- Student is a minor without independent phone/email → Admin can create the Student account on intake and issue credentials directly (common for younger Classes 1–5 enrollees who won't self-register).

**Acceptance Criteria:**
- **Given** a Parent submits a link request with a valid Student enrollment ID, **when** the Student (or Admin, for younger students) approves it, **then** the Parent gains read-only access to that Student's attendance, test scores, and fee status.
- **Given** an unverified phone number, **when** the user attempts to log in, **then** they are blocked and prompted to complete OTP verification.
- **Given** Admin creates a Student account directly (intake desk scenario), **when** the account is created, **then** credentials (or an SMS with a setup link) are sent to the contact phone number provided at intake.

---

### 3.2 Program/Batch Structure (Replaces Generic "Course CMS")

This is the most significant deviation from a generic course platform — Kaushiki sells **batches within tracks**, not self-paced on-demand courses.

**Functional Requirements:**
- Hierarchy: `Track` (fixed set: Classes 1–5, Classes 6–10, Classes 11–12 Commerce, CA Foundation/Intermediate) → `Subject` (e.g., Mathematics, Accountancy) → `Batch` (a specific running group: e.g., "Class 10 Math — Batch A, Mon/Wed/Fri 4pm").
- Each `Batch` has a **hard seat-capacity limit** set by Admin — enforces the "small batch size" trust factor. Enrollment is blocked once capacity is hit (waitlist optional, not MVP-blocking).
- Subjects per track follow the flyer exactly:
  - Classes 1–5: All Subjects (generic, not subject-split)
  - Classes 6–10: Mathematics, Science, English, Social Studies
  - Classes 11–12 Commerce: Accountancy, Business Studies, Economics, Mathematics/SP/IP
  - CA Foundation & Intermediate: structured as exam-oriented modules, not weekly subjects (faculty-defined syllabus units)
- Faculty assigned per Batch (not per Track) — one faculty member can teach multiple batches.
- Content per Batch: syllabus/topic list, study material (document upload), and recorded doubt-session notes if applicable — no requirement for a full video-streaming lesson platform (in-center teaching model, per flyer's physical-address focus).

**Edge Cases:**
- Batch reaches capacity mid-admissions-cycle → new inquiries for that batch auto-suggest alternative batch (same subject, different timing) rather than dead-ending.
- Admin needs to split an oversubscribed batch into two → manual batch-split action moves a defined subset of enrolled students, preserves their attendance/test history under the new batch reference.

**Acceptance Criteria:**
- **Given** a Batch has `capacity = 15` and 15 active enrollments, **when** a 16th enrollment attempt is made, **then** the system blocks it and surfaces "Batch full" with a link to alternate batches in the same Subject/Track.
- **Given** Admin creates a new Batch, **when** they assign a Faculty member, **then** that Faculty member's dashboard immediately reflects the new Batch in their roster list.
- **Given** a Track is "CA Foundation & Intermediate," **when** Admin structures its content, **then** the system allows exam-module-based content units rather than forcing a weekly-subject structure (track-type-aware content model).

---

### 3.3 Admissions Inquiry & Lead Pipeline

**Functional Requirements:**
- Public inquiry form fields: Name, Parent/Student contact phone, email (optional), Class/Track of interest (dropdown matching the 4 marketed tracks), message.
- Every submission → `Inquiry` record, status: `new`, `contacted`, `enrolled`, `closed`.
- Admin assigns inquiries to specific intake staff for follow-up (replicates the current phone-call-driven process, but trackable).
- SMS/email acknowledgment sent to inquirer automatically (async, non-blocking) confirming receipt with the institution's contact number (9175498572) for urgent follow-up.

**Edge Cases:**
- Inquiry for a Track/Class not currently offering an open batch (e.g., off-cycle) → still captured, flagged "no current batch" so Admin can follow up when next batch opens, rather than lost.
- Spam/bot submissions → honeypot + rate-limit per IP, silent reject.

**Acceptance Criteria:**
- **Given** a visitor submits the inquiry form selecting "Classes 11–12 Commerce," **when** the submission completes, **then** an `Inquiry` record is created with that track tag and an async SMS acknowledgment is enqueued.
- **Given** Admin marks an Inquiry as `enrolled`, **when** the corresponding Enrollment record is created, **then** it stores a back-reference to the originating `inquiry_id` for conversion-rate reporting (useful since this funnel directly replaces phone-based admissions tracking).

---

### 3.4 Fee Payment (Razorpay) — Webhooks, Failure Handling, Idempotency

**Functional Requirements:**
- Gateway: **Razorpay** (INR-only; Pune-based institution, no foreign-currency need — Stripe dropped from this build unless Kaushiki later needs international students).
- Fee structure: per-Batch fee (can be one-time or installment-based — confirm with Admin whether Kaushiki charges termly/annually; default to one-time per-enrollment fee for MVP, installments as a fast-follow if needed).
- Checkout creates `Payment` record in `pending` before redirect.
- **Webhook is sole source of truth** for payment confirmation — same as generic model: signature verification mandatory, idempotency via unique `gateway_event_id`, atomic DB transaction updates `Payment` + `Enrollment` together.
- Failed payment → Student/Parent notified via SMS, retry-checkout link offered, seat is held for a configurable grace window (e.g., 24h) before being released back to batch capacity — important because batches have hard seat limits (3.2), so a failed payment must not permanently occupy a scarce seat.

**Edge Cases:**
- Payment succeeds but the batch filled up in the interim (race condition between checkout start and webhook confirmation) → Admin alerted to manually resolve (offer alternate batch or waitlist); this is rare but must not silently overbook or silently fail the family that paid.
- Refund requested (e.g., withdrawal before batch starts) → Admin-initiated refund via Razorpay API, cascades to `Enrollment.status = revoked`, seat released back to batch capacity pool.

**Acceptance Criteria:**
- **Given** a Razorpay webhook event arrives, **when** signature verification fails, **then** it's rejected (400) and logged as a security event, never processed.
- **Given** a `payment.captured` webhook is received for the first time, **when** processed, **then** `Payment` and `Enrollment` update atomically in one transaction, and the Batch's available-seat count decrements.
- **Given** the same webhook event is delivered twice (gateway retry), **when** the second copy arrives, **then** it's recognized via `gateway_event_id` and short-circuited as a no-op (200, no duplicate seat decrement, no duplicate SMS).
- **Given** a payment fails, **when** the failure webhook is received, **then** the held seat remains reserved for the grace window before release, and an SMS with a retry link is enqueued.

---

### 3.5 Doubt-Clearing Query System

Directly implements the flyer's "Doubt Clearing Sessions" pillar as a real feature rather than an in-person-only offering.

**Functional Requirements:**
- Student submits a query: linked to their enrolled Batch/Subject, free-text question, optional photo attachment (e.g., photographed textbook problem — common for math/accountancy doubts).
- Query routed to the assigned Faculty for that Batch.
- Faculty responds via text (and/or marks "discuss in next class" if better suited to in-person).
- Parent can view query/response thread (read-only) for their linked child — ties into the "Regular Parent Feedback" promise.

**Edge Cases:**
- Faculty member is on leave/unavailable → Admin can reassign pending queries to a substitute or themselves.
- Query submitted for a Subject the Student isn't enrolled in → blocked at submission (must be tied to an active enrollment).

**Acceptance Criteria:**
- **Given** a Student submits a doubt query for an enrolled Batch, **when** submitted, **then** it appears in that Batch's assigned Faculty's query inbox within the same request cycle (no async delay needed for this — not a notification-heavy flow like SMS).
- **Given** Faculty responds to a query, **when** the response is saved, **then** the Student and linked Parent both gain read access to the thread, and (if SMS enabled for this trigger) the Student is notified.

---

### 3.6 Asynchronous SMS Notifications & Audit Logs

**Functional Requirements (unchanged core mechanism, Kaushiki-specific triggers):**
- Triggers: inquiry acknowledgment, enrollment/admission confirmed, fee payment success/failure, fee-due reminder (scheduled, e.g., before installment date if installments adopted), test result published, doubt-query response (optional toggle).
- All dispatch via Redis-backed job queue (e.g., BullMQ) — never synchronous in request/webhook path.
- `SMS_Logs`: every attempt logged with status `queued`/`sent`/`delivered`/`failed`, retry up to 3x exponential backoff for transient failures.
- Worker process independent of web server (separate scaling).

**Acceptance Criteria:**
- **Given** a fee payment is confirmed via webhook, **when** the DB transaction commits, **then** an SMS job is enqueued separately and the webhook responds 200 without waiting on SMS delivery.
- **Given** an SMS dispatch attempt of any outcome, **when** the worker processes it, **then** exactly one `SMS_Logs` row is created with template, recipient, trigger event, and final status.
- **Given** Admin filters SMS logs by `status = failed`, **when** viewed, **then** a manual resend action is available per record.

---

## 4. Page-by-Page Functional Architecture

### 4.1 Public Pages

#### Home / About
- **Layout:** Hero with tagline "Learn. Grow. Excel.", admissions-open banner (2026–27, dynamically editable by Admin per cycle — not hardcoded), the 6 core-pillars grid (Concept-Based Learning, Regular Tests & Assessments, Individual Attention, Performance Tracking, Doubt Clearing Sessions, Result Oriented), "Why Parents Trust Us" trust-factor strip, contact/location block.
- **States:** Mostly static; admissions-banner cycle text pulled from a single Admin-editable config field (so Admin updates "2026-27" → "2027-28" next year without a code deploy).
- **Data fields:** Admissions cycle label, contact phone/email/address (editable by Admin, not hardcoded in frontend — avoids a repeat of this exact flyer-update problem happening in code).

#### Programs (Tracks)
- **Layout:** Four track cards exactly as marketed — Classes 1–5, Classes 6–10, Classes 11–12 (Commerce), CA Foundation & Intermediate Prep — each expandable to show subjects covered and an "Inquire Now" CTA.
- **States:** Loading skeleton per card; if a track currently has zero open batches, show "Admissions opening soon for this track" rather than hiding the track entirely (institution still wants the track marketed even between batch cycles).
- **Data fields:** Track name, subjects list, brief description, board coverage (CBSE/ICSE/State Board tag for Classes 1–10), CTA linking to inquiry form pre-filled with that track.

#### Admissions Inquiry / Contact
- **Layout:** Single combined form (per current flyer's single-funnel approach) — Name, contact phone, email (optional), Track of interest, message — plus static institution contact details and address/map.
- **States:** Inline validation, submit-loading, success confirmation (replacing form), error preserves entered data.
- **Data fields:** As defined in 3.3.

### 4.2 Authenticated Portals

#### Student Dashboard
- **Layout:** My Batch(es) (subject, faculty, schedule), Test Scores (by subject, trend over time), Attendance %, Fee Status (paid/due/next-due-date), Doubt Queries (submit + view responses).
- **States:** Independent skeletons per section; empty state for "no test scores yet" should read as normal/expected early in a term, not as an error.
- **Data fields:** Per batch — subject, faculty name, schedule, attendance %. Per test — subject, date, score, max-score, faculty remark (optional). Fee — amount due, due date, payment history, receipt download.

#### Parent Dashboard
- **Layout:** Same data categories as Student Dashboard but scoped to linked child(ren) — supports multiple linked children (sibling enrollments) via a child-selector if more than one link exists. Read-only except for fee payment (Parent can pay on child's behalf) and doubt-query thread viewing.
- **States:** If no child linked yet, show clear "Link your child's account" flow rather than an empty dashboard.
- **Data fields:** Mirrors Student Dashboard per linked child; fee-payment action available here too (Parents are the more likely fee-payer in this demographic).

#### Faculty Dashboard
- **Layout:** My Batches (roster per batch), Attendance entry (per session), Test-marks entry (per test, per batch), Doubt Query inbox (assigned to them).
- **States:** Empty roster (newly assigned batch, no students yet) shown distinctly from a load failure.
- **Data fields:** Batch list, student roster per batch, attendance grid (date x student), test-marks entry grid, query inbox list with status (open/answered).

#### Admin Command Center
- **Layout:** Left nav — Inquiries, Batches, Enrollments, Fees/Payments, Faculty, SMS Logs, Settings (admissions-cycle label, contact info, fee structure). Summary cards: open inquiries, active batches, fee collection this month, batches near/at capacity.
- **States:** Independent skeletons per summary card and per table; positive empty states (e.g., "No overdue fees — all current").
- **Data fields:** Inquiries table (name, contact, track, status, assignee, date), Batches table (track, subject, faculty, capacity/filled, schedule), Payments table (student, amount, status, gateway ref, date, refund action), Faculty table (name, assigned batches, contact), SMS Logs (as in 3.6).

---

## 5. Critical Non-Functional Requirements (NFRs)

### 5.1 Performance Targets

| Metric | Target |
|---|---|
| TTFB (public pages — Home, Programs) | < 200ms |
| TTFB (authenticated dashboards) | < 500ms |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| Webhook processing (receipt → DB commit) | < 1s p95 |
| SMS job pickup (enqueue → worker pickup) | < 5s p95 |

### 5.2 Security Mandates

- JWT: 15-min access token, 7-day rotated refresh token, server-revocable.
- TLS 1.2+ enforced site-wide, HSTS on.
- Encryption at rest for PII columns (phone, email, address).
- Webhook signature validation mandatory on Razorpay endpoint — reject and log on failure, never process unsigned events.
- Rate limiting on auth, inquiry form, and OTP-request endpoints (OTP abuse is a realistic risk for phone-first auth).
- Admin audit trail on all sensitive actions: refunds, account suspension, manual enrollment, parent-child link approval.

### 5.3 Compliance & Data Integrity

- Financial atomicity: Payment + Enrollment + seat-count decrement happen in a single DB transaction — no state where a seat is held without a matching successful payment, or vice versa.
- Idempotent webhook processing (unique `gateway_event_id` constraint at DB level).
- Soft-delete for Students/Batches/Faculty — preserves historical attendance/test/fee records for dispute resolution and academic record continuity (a Student's full history shouldn't vanish if they leave mid-year).
- PII minimization: collect only what's needed for enrollment/communication; no raw card data stored (Razorpay-hosted checkout/tokenization handles PCI scope).
- **Minor-data handling:** Since most Students are minors (Classes 1–12), Parent-linking and consent flow (3.1) function as the de facto guardian-consent mechanism for data access — Admin approval step is the safeguard against unauthorized linking.

---

## 6. Architectural Outlines & API Contract Foundation

### 6.1 High-Level Data Model

```
Users (id, name, phone, email nullable, password_hash, role[student|parent|faculty|admin], status, phone_verified, created_at)
   |
   |--< Parent_Student_Links (id, parent_id FK→Users, student_id FK→Users, status[pending|approved], approved_by FK→Users nullable)
   |
   |--< Tracks (id, name['Classes 1-5'|'Classes 6-10'|'Classes 11-12 Commerce'|'CA Foundation & Intermediate'], board_coverage nullable)
   |        |
   |        |--< Subjects (id, track_id FK, name)
   |                |
   |                |--< Batches (id, subject_id FK, faculty_id FK→Users, capacity, seats_filled, schedule, status[active|completed|archived])
   |
   |--< Enrollments (id, student_id FK→Users, batch_id FK→Batches, status[pending|active|completed|revoked], inquiry_id FK nullable, enrolled_at)
   |        |
   |        |--< Payments (id, enrollment_id FK, payer_id FK→Users, amount, currency['INR'], gateway['razorpay'], gateway_event_id UNIQUE, status[pending|succeeded|failed|refunded], created_at)
   |
   |--< Inquiries (id, name, phone, email nullable, track_id FK, message, status[new|contacted|enrolled|closed], assignee_id FK→Users nullable, created_at)
   |
   |--< Doubt_Queries (id, student_id FK→Users, batch_id FK→Batches, question_text, attachment_url nullable, status[open|answered], response_text nullable, responded_by FK→Users nullable)
   |
   |--< Attendance (id, batch_id FK, student_id FK, session_date, present boolean)
   |
   |--< Test_Scores (id, batch_id FK, student_id FK, test_name, score, max_score, test_date, remark nullable)
   |
   |--< SMS_Logs (id, user_id FK nullable, phone, template_used, trigger_event, status[queued|sent|delivered|failed], retry_count, created_at)
```

**Key integrity rules:**
- `Batches.seats_filled` increments/decrements only inside the same transaction as `Enrollment`/`Payment` state changes — this is the literal enforcement of the "small batch size" marketed promise.
- `Payments.gateway_event_id` UNIQUE — idempotency enforced at DB level.
- `Parent_Student_Links.status` requires `approved` before any read-access query joins Parent to Student data — enforced at the query/authorization layer, not just UI hiding.

### 6.2 Frontend-First Workflow Bridge

Unchanged in mechanism from the general engineering plan already delivered:
1. OpenAPI contract defined first (now reflecting Kaushiki's actual entities: Tracks/Subjects/Batches, not generic Courses/Modules/Lessons).
2. MSW mocks built from that contract — frontend (Programs page, dashboards) builds fully against mocked Track/Batch/Inquiry data before backend exists.
3. Contract tests validate real endpoints against the OpenAPI spec as they come online.
4. Per-endpoint feature-flagged cutover from mock to live, incremental per sprint.

### 6.3 Webhook-to-Notification Pipeline

Same zero-loss pattern as the general plan (verify signature → idempotency check → atomic DB transaction → enqueue SMS as a separate non-blocking step → return 200 to Razorpay regardless of SMS outcome). The only Kaushiki-specific addition: the atomic transaction in this build also decrements `Batches.seats_filled`, since seat capacity is a hard product constraint here that didn't exist in a generic self-paced-course model.

### 6.4 Upstream Dependencies

| Dependency | Risk if Unavailable | Mitigation |
|---|---|---|
| Razorpay | Cannot process new fee payments | Maintenance banner on checkout; existing enrollments/data unaffected |
| Redis | SMS queue can't accept new jobs | Webhook/API requests still succeed; alert fires; backlog processes on recovery |
| SMS Provider | Notifications delayed | Retry policy; never blocks payment or enrollment state |
| PostgreSQL | Full outage | Standard HA/replica failover (infra-level) |

### 6.5 Future Multi-Tenancy Note (Not Active Scope)

If KLN Business Solutions later wants to replicate this platform for other ventures under their umbrella, add a `tenant_id` column across all core tables now while the schema is still young — cheap insurance, zero functional impact on this single-tenant Kaushiki build, avoids a painful retrofit later. This is a recommendation, not an MVP requirement.

---

## 7. Engineering Handoff Notes

**Confirm with Kaushiki Admin before Sprint 1:**
- Fee model: one-time per-enrollment, or term/installment-based? (Affects `Payments`/`Enrollments` cardinality — current model assumes one-time; installments are a fast-follow schema change if needed.)
- Batch seat-capacity default numbers per track (drives the literal "small batch" enforcement — needs a real number, not a placeholder).
- Whether CA Foundation/Intermediate content should be structured as exam-syllabus modules (per 3.2) — confirm with whoever teaches that track, since it's structurally different from the weekly-subject tracks.
- SMS provider choice (Twilio vs. MSG91 vs. local Indian SMS gateway — MSG91/Indian provider likely better for Pune-local delivery rates and DLT-template compliance, which is mandatory for transactional SMS to Indian numbers under TRAI regulations — flag this explicitly to Engineering, it affects template registration lead time).
- Confirm whether "About" page needs the KLN Business Solutions parent-brand presence/link, per the flyer's co-branding.
