# Project Scope: Kaushiki Coaching Portal

Kaushiki Coaching Portal is a single-institution educational portal for **Kaushiki Classes** (Pune, under parent entity **KLN Business Solutions**). It digitizes admissions, batch rosters, doubt-clearing sessions, fee collections, and student performance tracking.

## Core Scope (MVP)

### 1. User Roles & Capabilities
*   **Students**: View batch rosters, submit doubt queries, view attendance, review test scores, pay fees.
*   **Parents**: Linked to student accounts; read-only access to progress dashboards (attendance, test marks), fee payment capabilities on behalf of child.
*   **Faculty (Instructors)**: Manage assigned batches, mark attendance, enter test scores, resolve doubt queries.
*   **Admins (Kaushiki Staff)**: Manage student enrollments, batches (enforce small batch limits), handle admissions inquiry pipelines, view SMS dispatch logs, configure portals.

### 2. Core Pillars & Features (Marketed Trust Factors)
*   **Concept-Based Learning & Assessments**: Digital entry of performance marks with analytics curves.
*   **Individual Attention (Small Batch Enforcements)**: System-enforced capacity limits on batch checkouts.
*   **Regular Parent Feedback**: Portals mapping linked children's stats to active parents.
*   **Doubt Clearing Sessions**: A structured messaging workflow connecting students with batch faculty.

### 3. Integrations
*   **Payments**: Razorpay gateway (INR-only, transaction status webhook is sole source of truth).
*   **SMS Gateway**: MSG91 with pre-registered TRAI DLT templates for transactional SMS notifications.

---

## Out of Scope (MVP)
*   Multi-branch / Multi-center coordination (enforces single location: Ambegaon Khurd, Pune).
*   Native iOS/Android applications (responsive web portal only).
*   In-platform video live streaming (Hybrid physical class model; video hosting deferred).
*   Multi-tenant SaaS white-labeling (KLN Business Solutions brand-tunnels to single database).

---

## Sprint Roadmap (Sprint 0 - Sprint 7)

*   **Sprint 0: Project Foundation & UI System (Current)**
    *   Setup folder structure, Tailwind styling config, and typography.
    *   Scaffold core building blocks (`Button`, `Input`, `Card`, `Sidebar`, `DataTable`).
*   **Sprint 1: Public Shell & MSW**
    *   Implement header, footer, hero pages, program catalogue, and contact page mock.
*   **Sprint 2: Database & Authentication**
    *   Build Prisma DB tables and implement phone OTP authentication flow.
*   **Sprint 3: Batch Management & Admin panel**
    *   Create batch configurations and admissions inquiry pipelines.
*   **Sprint 4: Enrollments & Razorpay Webhooks**
    *   Process client-side order checkouts and webhook reconciliations.
*   **Sprint 5: SMS Notifications & Doubt Inbox**
    *   Link MSG91 queues and doubt routing interfaces.
*   **Sprint 6: Quality Assurance & Performance Tuning**
    *   Write E2E tests, audit security parameters, and verify Lighthouse metrics.
*   **Sprint 7: Production Launch & Operations Handover**
    *   Deploy live environments and transfer credentials/manual logs to client.
