---
description: Bump patch version (x.y.Z) for bugfixes
---

This workflow increments the patch version number for bugfix releases.

// turbo-all

1. **Update version in package.json**
   ```
   npm version patch -m "Release v%s"
   ```

2. **Push changes and tags to dev branch**
   ```
   git push origin dev --follow-tags
   ```

3. **Verify the release**
   ```
   git tag -l
   ```
