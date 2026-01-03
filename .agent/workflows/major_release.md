---
description: Bump major version (X.0.0) for breaking changes
---

This workflow increments the major version number for breaking change releases.
It saves to BOTH dev and main branches.

// turbo-all

1. **Clean up workspace**
   ```
   if (Test-Path lint_output.txt) { Remove-Item lint_output.txt }
   if (Test-Path playwright-report) { Remove-Item playwright-report -Recurse -Force }
   if (Test-Path test-results) { Remove-Item test-results -Recurse -Force }
   cmd /c "if exist nul del \\.\%CD%\nul"
   ```

2. **Update version in package.json**
   ```
   npm version major -m "Release v%s"
   ```

3. **Push changes and tags to dev branch**
   ```
   git push origin dev --follow-tags
   ```

4. **Merge dev into main (production release)**
   ```
   git checkout main && git merge dev -m "Merge dev into main for major release"
   ```

5. **Push main branch**
   ```
   git push origin main --follow-tags
   ```

6. **Return to dev branch**
   ```
   git checkout dev
   ```

7. **Verify the release**
   ```
   git tag -l
   ```
