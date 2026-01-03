---
description: Bump patch version (x.x.Z) + changelog auto + commit + push
allowed-tools: Read, Edit, Grep, Bash(npm:*), Bash(git:*), Bash(cat:*), Bash(grep:*)
---

# PATCH Version Bump (x.x.Z)

Tu es un Release Manager Senior. Exécute un bump de version PATCH complet.

## Règles Sémantiques
- **PATCH (x.x.Z)** : Corrections de bugs uniquement, pas de nouvelle fonctionnalité visible

## Étape 1: Lire la version actuelle

Extraire la version de `package.json` et calculer la nouvelle version PATCH.

## Étape 2: Scan Dynamique des Fichiers Versionnés

**CRITIQUE** : Scanner TOUS les fichiers contenant la version actuelle pour auto-maintenance.

```bash
# Trouver tous les fichiers avec la version actuelle (ex: 4.12.5 ou v4.12.5)
grep -r "X.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
grep -r "vX.Y.Z" --include="*.json" --include="*.md" --include="*.tsx" --include="*.ts" -l .
```

**Fichiers obligatoires** (toujours présents) :
1. `package.json` - `"version": "X.Y.Z"`
2. `public/manifest.json` - `"version": "X.Y.Z"`
3. `AGENTS.md` - VERSION_ACTUELLE
4. `CLAUDE.md` - Footer avec date et version

**Fichiers dynamiques** (découverts par scan) :
- Tout fichier `.tsx`/`.ts` contenant `vX.Y.Z` (ex: sidebars, footers)
- Tout fichier `.md` contenant la version

Afficher la liste découverte à l'utilisateur :
```
📂 Fichiers versionnés détectés :
- package.json
- public/manifest.json
- AGENTS.md
- CLAUDE.md
- admin/components/layout/Sidebar.tsx
- admin/components/user/UserSidebar.tsx
- [autres fichiers découverts...]

Total : N fichiers
```

## Étape 3: Analyse Intelligente du Changelog

### Si contexte disponible dans la conversation
Utilise les informations de la session (fichiers modifiés, bugs corrigés) pour générer le changelog.

### Si nouvelle conversation
```bash
git diff --stat HEAD~5
git log --oneline -10
```

Propose un changelog auto-généré :
```
📋 Changelog proposé pour vX.Y.Z :

**Titre** : [titre déduit]
**Corrections** :
- 🐛 [correction 1]

Ça te convient ? (oui / modifie : ...)
```

## Étape 4: Mise à jour de TOUS les fichiers détectés

Pour chaque fichier trouvé, remplacer l'ancienne version par la nouvelle.

**Changelogs** :
- `CHANGELOG.md` : Nouvelle entrée
- `CHANGELOG_LITE.md` : Nouvelle ligne sous le bloc courant

## Étape 5: Commit et Push

```bash
git add -A
git commit -m "fix: [titre] (vX.Y.Z)

🐛 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Étape 6: Compte-rendu

```
✅ **Version X.Y.Z-1 → X.Y.Z** (PATCH)

| Fichier | Statut |
|---------|--------|
| package.json | ✓ |
| public/manifest.json | ✓ |
| [tous les fichiers découverts...] | ✓ |

**N fichiers mis à jour**, commit créé et pushé.
```

## Auto-Maintenance

Si tu découvres un nouveau fichier versionné qui n'était pas dans les précédentes releases :
1. L'inclure dans la mise à jour
2. Mentionner dans le compte-rendu : "⚠️ Nouveau fichier versionné détecté : [path]"

Cela garantit que la liste reste à jour automatiquement.
