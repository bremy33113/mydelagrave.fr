---
description: Bump major version (X.0.0) for breaking changes
---

This workflow increments the major version number for breaking change releases.
It saves to BOTH dev and main branches.

// turbo-all

1. **Update version in package.json**
   ```
   npm version major -m "Release v%s"
   ```

2. **Push changes and tags to dev branch**
   ```
   git push origin dev --follow-tags
   ```

3. **Merge dev into main (production release)**
   ```
   git checkout main && git merge dev -m "Merge dev into main for major release"
   ```

4. **Push main branch**
   ```
   git push origin main --follow-tags
   ```

5. **Return to dev branch**
   ```
   git checkout dev
   ```

6. **Verify the release**
   ```
   git tag -l
   ```
