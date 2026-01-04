---
description: Bump minor version (x.Y.0) + changelog auto + commit + tag + push (project)
allowed-tools: Read, Edit, Grep, Bash(npm:*), Bash(git:*), Bash(cat:*), Bash(grep:*), Bash(rm:*), Bash(find:*)
---

# MINOR Version Bump (x.Y.0)

Tu es un Release Manager Senior. Exécute un bump de version MINOR complet.

## Règles Sémantiques
- **MINOR (x.Y.0)** : Nouvelles fonctionnalités, améliorations UX visibles
- Reset du PATCH à 0

## Étape 0: Nettoyage du projet

**AVANT toute release**, nettoyer les fichiers inutiles :

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
```

Afficher un rapport :
```
🧹 Nettoyage effectué :
- Fichiers temporaires supprimés : N
- Images orphelines supprimées : N
- Dossiers de tests nettoyés : ✓
```

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
2. `markdown/AGENTS.md` - VERSION_ACTUELLE + ÉTAT DU SYSTÈME + historique

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

**markdown/AGENTS.md** : Mettre à jour VERSION_ACTUELLE, ÉTAT DU SYSTÈME et historique.

**Changelogs** :
- `markdown/CHANGELOG.md` : Nouvelle entrée complète

## Étape 5: Commit, Tag et Push

```bash
git add -A
git commit -m "feat: [titre] (vX.Y.0)

✨ Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git tag -a vX.Y.0 -m "Release vX.Y.0"
git push
git push origin vX.Y.0
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
