---
description: Bump major version (X.0.0) + changelog auto + commit + push
allowed-tools: Read, Edit, Grep, Bash(npm:*), Bash(git:*), Bash(cat:*), Bash(grep:*)
---

# MAJOR Version Bump (X.0.0)

Tu es un Release Manager Senior. Exécute un bump de version MAJOR complet.

## Règles Sémantiques
- **MAJOR (X.0.0)** : Changements majeurs, rupture de compatibilité, refactoring massif
- Reset du MINOR et PATCH à 0

## Étape 1: Lire la version actuelle

Extraire la version de `package.json` et calculer la nouvelle version MAJOR.

## Étape 2: Scan Dynamique des Fichiers Versionnés

**CRITIQUE** : Scanner TOUS les fichiers contenant la version actuelle pour auto-maintenance.

```bash
# Trouver tous les fichiers avec la version actuelle
grep -r "X.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
grep -r "vX.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
```

**Fichiers obligatoires** :
1. `package.json` - `"version": "X.0.0"`
2. `public/manifest.json` - `"version": "X.0.0"`
3. `AGENTS.md` - VERSION_ACTUELLE + ÉTAT DU SYSTÈME
4. `CLAUDE.md` - Footer avec date et version

**Fichiers dynamiques** (auto-découverts) :
- Sidebars, footers, tout composant avec version affichée
- Fichiers markdown avec références à la version

Afficher la liste :
```
📂 Fichiers versionnés détectés :
[liste complète]
Total : N fichiers
```

## Étape 3: Analyse Intelligente du Changelog

### Si contexte disponible
Utilise les infos de la session pour identifier breaking changes.

### Si nouvelle conversation
```bash
git diff --stat HEAD~20
git log --oneline -20
```

Propose :
```
📋 Changelog proposé pour vX.0.0 :

**Nom de release** : [nom déduit]
**⚠️ Breaking Changes** :
- 🚀 [breaking change 1]
**Nouvelles Fonctionnalités** :
- ✨ [feature majeure]
**Migration** :
- 📚 [note si applicable]

Ça te convient ? (oui / modifie : ...)
```

## Étape 4: Confirmation OBLIGATOIRE

⚠️ **MAJOR RELEASE** - Demander confirmation explicite :
```
Tu es sur le point de passer en version X.0.0 ([Nom]).
N fichiers seront modifiés.
Confirmes-tu ? (oui/non)
```

NE PAS procéder sans "oui" explicite.

## Étape 5: Mise à jour de TOUS les fichiers détectés

Pour chaque fichier trouvé, remplacer l'ancienne version par la nouvelle.

**AGENTS.md** : Mettre à jour ÉTAT DU SYSTÈME avec le nom de release.

**Changelogs** :
- `CHANGELOG.md` : Nouvelle entrée MAJOR avec breaking changes
- `CHANGELOG_LITE.md` : Nouveau bloc MAJOR

## Étape 6: Commit et Push

```bash
git add -A
git commit -m "feat!: [nom] (vX.0.0)

🚀 MAJOR RELEASE - Breaking changes

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Étape 7: Compte-rendu

```
✅ **Version X-1.Y.Z → X.0.0** (🚀 MAJOR RELEASE)

| Fichier | Statut |
|---------|--------|
| [tous les fichiers...] | ✓ |

**N fichiers mis à jour**, commit créé et pushé.

⚠️ MAJOR RELEASE - Communiquer les breaking changes aux utilisateurs.
⚠️ Nouveaux fichiers versionnés détectés : [si applicable]
```

## Auto-Maintenance

La liste de fichiers versionnés est dynamique.
Tout nouveau fichier découvert est automatiquement inclus et signalé.
