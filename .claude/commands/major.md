---
description: Bump major version (X.0.0) + changelog auto + commit + tag + push (project)
allowed-tools: Read, Edit, Grep, Bash(npm:*), Bash(git:*), Bash(cat:*), Bash(grep:*), Bash(rm:*), Bash(find:*)
---

# MAJOR Version Bump (X.0.0)

Tu es un Release Manager Senior. Exécute un bump de version MAJOR complet.

## Règles Sémantiques
- **MAJOR (X.0.0)** : Changements majeurs, rupture de compatibilité, refactoring massif
- Reset du MINOR et PATCH à 0

## Étape 0: Nettoyage du projet

**AVANT toute release MAJOR**, nettoyer rigoureusement les fichiers inutiles :

```bash
# Supprimer les fichiers temporaires et inutiles
find . -name "*.tmp" -delete 2>/dev/null
find . -name "*.bak" -delete 2>/dev/null
find . -name "*.log" -not -path "./node_modules/*" -delete 2>/dev/null
find . -name ".DS_Store" -delete 2>/dev/null
find . -name "Thumbs.db" -delete 2>/dev/null

# Supprimer les images orphelines à la racine (copies, doublons)
find . -maxdepth 1 -name "*.png" -delete 2>/dev/null
find . -maxdepth 1 -name "*.jpg" -delete 2>/dev/null
find . -maxdepth 1 -name "*.jpeg" -delete 2>/dev/null

# Supprimer les dossiers de résultats de tests
rm -rf test-results 2>/dev/null
rm -rf playwright-report 2>/dev/null

# Supprimer les fichiers null ou vides
find . -name "null" -delete 2>/dev/null
find . -type f -empty -not -path "./node_modules/*" -delete 2>/dev/null

# Nettoyage supplémentaire pour MAJOR
rm -rf .cache 2>/dev/null
rm -rf dist 2>/dev/null
```

Afficher un rapport :
```
🧹 Nettoyage effectué :
- Fichiers temporaires supprimés : N
- Images orphelines supprimées : N
- Dossiers de tests nettoyés : ✓
- Cache et dist nettoyés : ✓
```

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
2. `markdown/AGENTS.md` - VERSION_ACTUELLE + ÉTAT DU SYSTÈME + historique

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

**markdown/AGENTS.md** : Mettre à jour VERSION_ACTUELLE, ÉTAT DU SYSTÈME et historique.

**Changelogs** :
- `markdown/CHANGELOG.md` : Nouvelle entrée MAJOR avec breaking changes

## Étape 6: Commit, Tag et Push

```bash
git add -A
git commit -m "feat!: [nom] (vX.0.0)

🚀 MAJOR RELEASE - Breaking changes

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git tag -a vX.0.0 -m "Release vX.0.0 - [nom]"
git push
git push origin vX.0.0
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
