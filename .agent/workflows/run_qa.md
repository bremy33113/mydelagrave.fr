---
description: Run E2E tests and Lint checks to ensure non-regression
---

This workflow runs the full Quality Assurance suite for the application.

1. **Run ESLint** to check for code quality issues and potential bugs.
   ```
   npm run lint
   ```

2. **Run Playwright E2E Tests** to verify critical user flows (Authentication, Dashboard, CRUD).
   ```
   // turbo
   npx playwright test
   ```

3. **Check Test Report** (if tests fail)
   ```
   npx playwright show-report
   ```
