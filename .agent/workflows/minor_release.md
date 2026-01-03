---
description: Bump minor version (x.Y.0) for new features
---

This workflow increments the minor version number for new feature releases.

// turbo-all

1. **Update version in package.json**
   ```
   npm version minor -m "Release v%s"
   ```

2. **Push changes and tags to GitHub**
   ```
   git push origin main --follow-tags
   ```

3. **Verify the release**
   ```
   git tag -l
   ```
