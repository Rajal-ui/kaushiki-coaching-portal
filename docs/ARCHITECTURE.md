# Architecture Overview

## Feature-First Modular Architecture
The Kaushiki Classes platform uses a feature-first architecture pattern to ensure scalability and maintainability.

### Portal Separation
`(auth)` is a Next.js App Router Route Group for login and authentication flows. The dashboard uses explicit routes with role-specific layouts:
- `/dashboard/admin`: Administrative dashboard and management.
- `/dashboard/student`: Student learning interface.
- `/dashboard/faculty`: Teacher and staff portal.
- `/dashboard/parent`: Parent monitoring portal.

### Component Structure
- `/components/ui`: Primitive components (buttons, inputs) acting as our design system foundation.
- `/components/features/{role}`: Domain-specific components tailored for a specific portal, keeping logic encapsulated (e.g., `AttendanceDashboard` in `admin`).
