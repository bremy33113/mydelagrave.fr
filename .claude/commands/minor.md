---
description: Bump minor version (x.Y.0) + changelog auto + commit + push
allowed-tools: Read, Edit, Grep, Bash(npm:*), Bash(git:*), Bash(cat:*), Bash(grep:*)
---

# MINOR Version Bump (x.Y.0)

Tu es un Release Manager Senior. Exécute un bump de version MINOR complet.

## Règles Sémantiques
- **MINOR (x.Y.0)** : Nouvelles fonctionnalités, améliorations UX visibles
- Reset du PATCH à 0

## Étape 1: Lire la version actuelle

Extraire la version de `package.json` et calculer la nouvelle version MINOR.

## Étape 2: Scan Dynamique des Fichiers Versionnés

**CRITIQUE** : Scanner TOUS les fichiers contenant la version actuelle pour auto-maintenance.

```bash
# Trouver tous les fichiers avec la version actuelle (ex: 4.12.5 ou v4.12.5)
grep -r "X.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
grep -r "vX.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
```

**Fichiers obligatoires** (toujours présents) :
1. `package.json` - `"version": "X.Y.0"`
2. `public/manifest.json` - `"version": "X.Y.0"`
3. `AGENTS.md` - VERSION_ACTUELLE + ÉTAT DU SYSTÈME
4. `CLAUDE.md` - Footer avec date et version

**Fichiers dynamiques** (découverts par scan) :
- Tout fichier `.tsx`/`.ts` contenant `vX.Y.Z` (ex: sidebars, footers)
- Tout fichier `.md` contenant la version

Afficher la liste découverte :
```
📂 Fichiers versionnés détectés :
- package.json
- public/manifest.json
- AGENTS.md
- CLAUDE.md
- [fichiers découverts dynamiquement...]

Total : N fichiers
```

## Étape 3: Analyse Intelligente du Changelog

### Si contexte disponible
Utilise les infos de la session pour générer le changelog.

### Si nouvelle conversation
```bash
git diff --stat HEAD~10
git log --oneline -15
```

Propose :
```
📋 Changelog proposé pour vX.Y.0 :

**Titre de release** : [titre déduit]
**Nouvelles Fonctionnalités** :
- ✨ [feature 1]
**Améliorations** :
- ⚡ [amélioration 1]

Ça te convient ? (oui / modifie : ...)
```

## Étape 4: Mise à jour de TOUS les fichiers détectés

Pour chaque fichier trouvé, remplacer l'ancienne version par la nouvelle.

**AGENTS.md** : Mettre à jour ÉTAT DU SYSTÈME avec le titre de release.

**Changelogs** :
- `CHANGELOG.md` : Nouvelle entrée complète
- `CHANGELOG_LITE.md` : Nouveau bloc de version

## Étape 5: Commit et Push

```bash
git add -A
git commit -m "feat: [titre] (vX.Y.0)

✨ Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Étape 6: Compte-rendu

```
✅ **Version X.Y-1.Z → X.Y.0** (MINOR RELEASE)

| Fichier | Statut |
|---------|--------|
| [tous les fichiers découverts...] | ✓ |

**N fichiers mis à jour**, commit créé et pushé.

⚠️ Nouveaux fichiers versionnés détectés : [si applicable]
```

## Auto-Maintenance

Tout nouveau fichier versionné découvert est automatiquement inclus.
Mentionner les nouveaux fichiers dans le compte-rendu pour traçabilité.
