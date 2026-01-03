---
description: Analyze code for regression risks and suggest E2E/Lint improvements
---

This workflow analyzes code changes across Git history to identify high-risk areas needing additional E2E tests and lint rules for regression prevention.

// turbo

1. **Analyze recent git changes (last 30 days)**
   ```
   git log --since="30 days ago" --pretty=format:"%h %s" --name-status | Select-Object -First 50
   ```

2. **Identify most frequently modified files**
   ```
   git log --name-only --pretty=format: --since="30 days ago" | Where-Object {$_ -ne ""} | Group-Object | Sort-Object Count -Descending | Select-Object -First 20 Name, Count
   ```

3. **Check current E2E test coverage**
   ```
   npx playwright test --list
   ```

4. **Identify files without corresponding tests**
   ```
   # List all pages
   Get-ChildItem -Path src\pages -Filter *.tsx -Recurse | Select-Object Name
   
   # List all E2E test files
   Get-ChildItem -Path e2e -Filter *.spec.ts | Select-Object Name
   ```

5. **Analyze lint warnings trends**
   ```
   npm run lint > regression_analysis_lint.txt 2>&1
   ```

6. **Generate regression risk report**
   ```
   # This step creates REGRESSION_RISKS.MD with findings
   # (Manual step: Review and create the report based on above outputs)
   ```

7. **Create missing E2E test files**
   ```
   # Based on analysis, create:
   # - e2e/contacts.spec.ts
   # - e2e/admin.spec.ts
   # - e2e/rbac.spec.ts
   # - e2e/trash.spec.ts
   ```

8. **Run all E2E tests**
   ```
   npx playwright test
   ```

9. **Analyze test failures**
   ```
   # Review test report for failures
   npx playwright show-report
   ```

10. **Fix failing tests iteratively**
    ```
    # For each failing test:
    # 1. Identify the root cause (selector, timing, logic)
    # 2. Update the test file with correct selectors/waits
    # 3. Re-run tests
    # 4. Repeat until all tests pass
    ```

11. **Generate final report**
    ```
    # Update REGRESSION_RISKS.MD with:
    # - New test count
    # - Coverage improvements
    # - Remaining warnings/issues
    ```

## Analysis Criteria

### High Risk Files (Need E2E Tests)
- **Modified >5 times in 30 days** → Critical flows changing frequently
- **Pages without E2E tests** → No automated validation
- **Components used in >3 pages** → High impact if broken
- **Files with >10 lint warnings** → Code quality issues

### Test Coverage Gaps
- **ContactsPage**: No dedicated E2E tests yet
- **AdminPage**: No RBAC E2E tests yet
- **TrashPage**: No restore/delete E2E tests

### Suggested Lint Rules
- **Enforce useEffect dependencies** → Prevent stale closures
- **Require prop-types or TypeScript** → Prevent runtime errors
- **Disallow console.log in production** → Clean production code

## Next Steps After Analysis

1. Review `regression_analysis_lint.txt`
2. Create missing E2E test files:
   - `e2e/contacts.spec.ts`
   - `e2e/admin.spec.ts`
   - `e2e/rbac.spec.ts`
   - `e2e/trash.spec.ts`
3. Update ESLint config to enforce critical rules
4. Add pre-commit hooks with Husky (optional)
