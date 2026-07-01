<div align="center">
  <h1>Kaushiki Coaching Portal</h1>
  <p><em>Streamlining educational management, one class at a time.</em></p>

  <!-- Placeholders for badges -->
  [![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/kaushiki/main.yml?branch=main)](https://github.com/your-org/kaushiki/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

## Table of Contents
- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

## About
The **Kaushiki Coaching Portal** is a comprehensive EdTech SaaS platform built to streamline the complex operations of coaching centers. It provides dedicated, feature-rich portals for Administrators, Faculty, Students, and Parents. By automating attendance, course progress tracking, and communications, it allows educators to focus on what matters most—teaching.

## Tech Stack
| Tier | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 | React framework with App Router, SSR, and Route Groups. |
| **Backend** | Node.js / Next.js API | Serverless architecture powered by Next.js API Routes. |
| **Database** | PostgreSQL | Relational database managed via Prisma ORM. |
| **Styling** | Tailwind CSS | Utility-first styling with shadcn/ui primitives. |
| **Jobs** | BullMQ & Redis | Background task processing (e.g., SMS notifications). |

## Project Structure
```text
kaushiki/
├── app/
│   ├── (auth)/         # Authentication flow
│   ├── (admin)/        # Administrator portal
│   ├── (faculty)/      # Teacher and staff portal
│   ├── (student)/      # Student learning interface
│   └── (parent)/       # Parent monitoring portal
├── components/
│   ├── ui/             # Reusable primitive UI components
│   └── features/       # Domain-specific components by role
├── docs/               # Project documentation and specifications
├── lib/                # Shared utilities and core logic
└── types/              # Global TypeScript interfaces
```

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally or via Docker)
- [Redis](https://redis.io/) (for background tasks)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/kaushiki.git
   cd kaushiki
   ```

2. **Environment Setup:**
   Copy the example environment file and configure your local variables.
   ```bash
   cp .env.example .env
   ```
   *Note: Update the `DATABASE_URL` and `REDIS_URL` in your `.env` file to match your local setup.*

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Seed the Database:**
   Push the schema to your database and generate the Prisma client.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *Your portal will now be available at [http://localhost:3000](http://localhost:3000).*

### Verifying Checks Locally
Before committing or pushing your changes, run these verification commands locally to ensure they pass the CI/CD pipeline:

- **Lint Check**: Run ESLint checks.
  ```bash
  npm run lint
  ```
- **Type Check**: Run TypeScript compiler checks.
  ```bash
  npm run type-check
  ```
- **Run Tests**: Execute Jest unit tests.
  ```bash
  npm run test
  ```

## Contributing
We welcome contributions to the Kaushiki Coaching Portal! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details on our branching strategy, pull requests, and coding standards.

## License
This project is licensed under the [MIT License](LICENSE).
