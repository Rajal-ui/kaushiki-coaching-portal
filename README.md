# Kaushiki Coaching Portal

[![Build Status](https://img.shields.io/github/actions/workflow/status/Rajal-ui/kaushiki-coaching-portal/main.yml?branch=main)](https://github.com/Rajal-ui/kaushiki-coaching-portal/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Streamlining educational operations and coaching center management through a unified portal ecosystem.

---

## 1. Executive Summary
The **Kaushiki Coaching Portal** is a high-performance EdTech SaaS platform developed for **Kaushiki Classes / KLN Business Solutions**. The system digitizes educational workflow administration by providing four distinct, role-based dashboards:
*   **Admin Dashboard:** Comprehensive course planning, cohort assignments, attendance auditing, and financial ledgers.
*   **Faculty Portal:** Batch tracking, schedule management, mark entries, and direct student evaluation tools.
*   **Student Hub:** Interactive learning metrics, schedules, course progress tracking, and doubt forums.
*   **Parent Portal:** Visual learning progression metrics, attendance history, and fee receipt ledgers.

---

## 2. New Contributor Roadmap
To begin working on the codebase, follow this sequence:
1.  **Read the Architecture Blueprint:** Review [docs/ARCHITECTURE.md](file:///d:/Projects/Kaushiki/docs/ARCHITECTURE.md) to understand the portal groups and feature isolation strategies.
2.  **Understand Coding Standards:** Review [docs/CONTRIBUTING.md](file:///d:/Projects/Kaushiki/docs/CONTRIBUTING.md) for branch formatting, code conventions, and pull request requirements.
3.  **Sync with Active Sprints:** Cross-reference local code changes with active task listings in the current sprint board before modifying shared logic.

---

## 3. Implementation Lifecycle

| Sprint | Goal / Focus Area | Status | Deliverables |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | Infrastructure & Design System | ✅ Completed | Base config, Tailwind themes, core UI primitives, pre-commit hooks, CI. |
| **Sprint 1** | Course Management Module | 🚀 In Progress | Admin Course CRUD, Prisma Course Schema, TypeScript interfaces, MSW API mocks. |
| **Sprint 2** | Authentication & Database Integration | 📅 Planned | Database migration, role-based OTP authentication system. |
| **Sprint 3** | Batch Management & Scheduling | 📅 Planned | Batch controls, class schedule grid, faculty allocation. |
| **Sprint 4** | Ledger Systems & Communication | 📅 Planned | Fee schedules, transaction logs, automated notification alerts. |

---

## 4. Codebase Structure
```text
kaushiki-coaching-portal/
├── .github/
│   └── workflows/          # GitHub Actions CI definitions
├── .husky/                 # Pre-commit git hook controllers
├── __mocks__/             # Global test mocking layers (e.g. styleMock)
├── __tests__/             # Unit and integration test suites
├── app/                    # Next.js App Router portal route groups
│   ├── (admin)/            # Admin-only workflows
│   ├── (auth)/             # Login and security groups
│   ├── (faculty)/          # Faculty-only operations
│   ├── (parent)/           # Parent portal monitoring
│   └── (student)/          # Student dashboard layout
├── components/
│   ├── ui/                 # Design system primitive atoms (shadcn base)
│   └── features/           # Modular domain-specific organisms grouped by role
├── docs/                   # Architectural guides and workspace rules
├── lib/                    # Shared utility helper definitions
└── types/                  # Common TypeScript interfaces and domain schemas
```

---

## 5. Codebase Architecture Flow
The codebase implements features following a strict modular pathway:
```text
[Type Definitions] ➔ [UI Components] ➔ [API Mock Isolation (MSW)] ➔ [Database Schema (Prisma)]
```
1.  **Types:** Interface definitions are declared globally under `types/` representing core domain models.
2.  **Components:** Atoms are mapped into `components/ui/`, while portal-specific functional blocks live under `components/features/{role}/`.
3.  **API Mocking:** Endpoints are mapped via `mocks/handlers.ts` using MSW to allow functional UI development independent of physical backend logic.
4.  **Data Models:** Verified data shapes are then mapped directly to PostgreSQL tables using Prisma schemas.

---

## 6. Automated Pre-Commit Guardrails

This repository enforces quality gates on **every commit** via Husky. The `.husky/pre-commit` hook automatically runs the following chain — **in this exact order** — before any commit is accepted:

| Step | Command | What it checks |
| :---: | :--- | :--- |
| 1 | `npm test` | Runs the full Jest unit test suite. Blocks commit on any test failure. |
| 2 | `npx lint-staged` | Runs ESLint on staged `.js/.ts/.tsx` files only. |
| 3 | `npm run type-check` | Runs `tsc --noEmit` across the entire workspace. |

> A commit is **only created** if all three steps pass. If any step fails, the commit is aborted and the error is printed to the terminal.

### Run Checks Manually Before Pushing

Before pushing your branch, always run the full suite manually to catch issues early:

```bash
# 1. Lint all files
npm run lint

# 2. Type-check the whole workspace
npm run type-check

# 3. Run all tests
npm run test

# 4. Verify the production build compiles cleanly
npm run build
```

---

## 7. Documentation

All detailed technical and project documentation lives in the [`docs/`](./docs) folder. Refer to these before starting any new work:

| Document | Purpose |
| :--- | :--- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Portal architecture, feature-first module pattern, and directory conventions. |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Branching rules, PR standards, code style guidelines, and local verification steps. |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Running history of notable changes per release / sprint. |
| [design.md](./docs/design.md) | Design system tokens — colours, typography, spacing, and component guidelines. |

> **Internal documents** (PRD, TRD, Implementation Plan) are kept in `docs/` for team reference and are **not** intended for public disclosure.

---

## 8. License

This project is licensed under the [MIT License](./LICENSE).

