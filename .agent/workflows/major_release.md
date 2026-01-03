---
description: Bump major version (X.0.0) for breaking changes
---

This workflow increments the major version number for breaking change releases.

// turbo-all

1. **Update version in package.json**
   ```
   npm version major -m "Release v%s"
   ```

2. **Push changes and tags to GitHub**
   ```
   git push origin main --follow-tags
   ```

3. **Verify the release**
   ```
   git tag -l
   ```
