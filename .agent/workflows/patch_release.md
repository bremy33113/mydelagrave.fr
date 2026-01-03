---
description: Bump patch version (x.y.Z) for bugfixes
---

This workflow increments the patch version number for bugfix releases.

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
   npm version patch -m "Release v%s"
   ```

3. **Push changes and tags to dev branch**
   ```
   git push origin dev --follow-tags
   ```

4. **Verify the release**
   ```
   git tag -l
   ```
