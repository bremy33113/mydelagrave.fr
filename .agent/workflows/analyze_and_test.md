---
description: Analyze modified code and add tests for regression protection
---

This workflow analyzes code changes since the last commit and suggests or generates E2E tests and lint rules to protect against regressions.

## Steps

1. **Identify modified files since last release**
   ```
   git diff --name-only HEAD~1
   ```

2. **Analyze the changes**
   Review the modified files and identify:
   - New UI components or modals
   - New user interactions (buttons, forms, modals)
   - New API calls or data fetching logic
   - Modified business logic

3. **Generate E2E tests** for new functionality:
   - For new modals: test opening/closing, form validation, submit actions
   - For new buttons: test click handlers and expected outcomes
   - For new forms: test input validation, error states, success flows
   - Add tests to `e2e/` directory following existing patterns

4. **Update ESLint rules** if needed:
   - Add custom rules for new patterns in `eslint.config.js`
   - Ensure consistent code style across new components

5. **Run the QA suite** to verify new tests work:
   ```
   // turbo
   npm run lint
   ```
   ```
   // turbo
   npx playwright test
   ```

6. **Report findings**:
   - List new tests added
   - List any lint rule changes
   - Identify any untested code paths

## Example Test Patterns

### Modal Test
```typescript
test('should open and close MyModal', async ({ page }) => {
    await page.click('[data-testid="open-modal-btn"]');
    await expect(page.locator('.modal-backdrop')).toBeVisible();
    await page.click('[data-testid="close-modal-btn"]');
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();
});
```

### Form Validation Test
```typescript
test('should show error for required field', async ({ page }) => {
    await page.click('[data-testid="submit-btn"]');
    await expect(page.locator('.error-message')).toContainText('required');
});
```

### CRUD Test
```typescript
test('should create new item', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'Test Item');
    await page.click('[data-testid="create-btn"]');
    await expect(page.locator('.item-list')).toContainText('Test Item');
});
```
