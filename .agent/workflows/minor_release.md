---
description: Bump minor version (x.Y.0) for new features
---

This workflow increments the minor version number for new feature releases.

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
   npm version minor -m "Release v%s"
   ```

3. **Push changes and tags to dev branch**
   ```
   git push origin dev --follow-tags
   ```

4. **Verify the release**
   ```
   git tag -l
   ```
