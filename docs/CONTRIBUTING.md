# Contributing to Kaushiki Coaching Portal

First off, thank you for considering contributing to the Kaushiki Coaching Portal! We welcome contributions from everyone—whether it's a bug fix, new feature, or documentation improvement. Your time and effort help make this platform better for coaching centers and students alike.

## Setup Workflow

To get started with local development, please follow these steps:

1. **Fork and Clone**
   Fork the repository to your own GitHub account and clone it to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kaushiki.git
   cd kaushiki
   ```

2. **Configure Environment Variables**
   Set up your local `.env` file based on the provided template:
   ```bash
   cp .env.example .env
   ```
   *Ensure you update connection strings for PostgreSQL and Redis appropriately.*

3. **Install Dependencies**
   Install all required Node.js packages:
   ```bash
   npm install
   ```

## The 'How-To'

### Branching Strategy
We maintain a strict branching model to keep our `main` branch clean and deployable.
- `main`: Production-ready, stable code.
- `dev`: Active development integration branch.
- **Features:** `feat/your-feature-name` (e.g., `feat/attendance-dashboard`)
- **Bug Fixes:** `fix/issue-description` (e.g., `fix/sidebar-overflow`)

Always branch off of `dev` when starting new work.

### Code Style Standards
We strive for a highly consistent and clean codebase.
- **ESLint & Prettier:** We use standard Next.js ESLint and Prettier configurations.
- **Type Safety:** Ensure all new code uses strict TypeScript typings. Avoid `any` wherever possible.
- **Format Before Committing:** Run `npm run lint` and `npm run format` (if available) before committing. Husky and lint-staged are configured to run automatically on pre-commit.

### Pull Request Requirements
When you are ready to submit your changes, open a Pull Request (PR) against the `dev` branch.
1. **Description:** Clearly explain the problem you are solving and how your changes address it.
2. **Visuals:** If your PR includes UI changes, **please attach screenshots or a short screen recording** in the PR description.
3. **Self-Review:** Review your own code to ensure it meets our styling guidelines and doesn't introduce console errors.

## Testing and Verification
Before committing or pushing your branch, please verify that everything works as expected by running the following checks locally:

1. **Run the Test Suite (Jest)**:
   ```bash
   npm run test
   ```
2. **Run the Linter (ESLint)**:
   ```bash
   npm run lint
   ```
3. **Run TypeScript Compiler Check**:
   ```bash
   npm run type-check
   ```

Ensure all tests, linting, and type checks pass successfully locally.

We look forward to collaborating with you!
