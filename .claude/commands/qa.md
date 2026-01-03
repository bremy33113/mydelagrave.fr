---
description: Analyse diff version + lint + tests E2E (no code regression)
allowed-tools: Read, Glob, Grep, Bash(npm:*), Bash(git:*), Bash(npx:*)
---

# QA - Analyse de Régression

Tu es un QA Engineer Senior. Analyse les changements depuis la dernière version et vérifie qu'il n'y a pas de régression.

## Étape 1: Identifier la version précédente

```bash
# Récupérer le dernier tag
git describe --tags --abbrev=0
# Lister les 3 derniers tags
git tag --sort=-creatordate | head -3
```

## Étape 2: Analyse du Diff

### Fichiers modifiés depuis le dernier tag
```bash
git diff --stat <PREVIOUS_TAG>..HEAD
git diff --name-only <PREVIOUS_TAG>..HEAD
```

### Résumé des commits
```bash
git log --oneline <PREVIOUS_TAG>..HEAD
```

Afficher un rapport :
```
📊 **Analyse des changements v{PREVIOUS} → v{CURRENT}**

**Commits** : N commits
**Fichiers modifiés** : N fichiers

| Catégorie | Fichiers |
|-----------|----------|
| Components | X |
| Pages | X |
| Hooks | X |
| Lib/Utils | X |
| Tests E2E | X |
| Config | X |
```

## Étape 3: Identifier les zones à risque

Analyser les fichiers modifiés et identifier :

1. **Composants UI modifiés** → Tests E2E visuels potentiels
2. **Logique métier modifiée** → Tests fonctionnels
3. **Hooks/State modifiés** → Tests d'intégration
4. **Routes modifiées** → Tests de navigation

```
🎯 **Zones à risque identifiées** :

| Zone | Fichier | Impact | Test E2E existant |
|------|---------|--------|-------------------|
| [zone] | [fichier] | [Haut/Moyen/Bas] | [Oui/Non] |
```

## Étape 4: Vérification ESLint

```bash
npm run lint
```

Rapport :
```
✅ ESLint : Pas d'erreurs
# ou
❌ ESLint : N erreurs trouvées
[liste des erreurs]
```

## Étape 5: Exécution des Tests E2E

### Tests existants
```bash
# Lister les tests disponibles
ls e2e/*.spec.ts

# Exécuter tous les tests
npm run test:e2e
```

### Si échec, analyser :
```bash
# Voir le rapport détaillé
npx playwright show-report
```

## Étape 6: Rapport Final

```
═══════════════════════════════════════════════════════
📋 **RAPPORT QA - v{VERSION}**
═══════════════════════════════════════════════════════

## Analyse du code
- Commits analysés : N
- Fichiers modifiés : N
- Zones à risque : N

## Vérifications

| Check | Statut | Détails |
|-------|--------|---------|
| ESLint | ✅/❌ | [détails] |
| Tests E2E | ✅/❌ | X/Y passés |
| Build | ✅/❌ | [si testé] |

## Couverture des tests

| Zone modifiée | Couverte par E2E |
|---------------|------------------|
| [composant] | ✅/❌ |

## Recommandations

### Tests E2E manquants (si applicable)
- [ ] [Description du test à ajouter]
- [ ] [fichier.spec.ts] : [cas de test]

### Actions requises
- [ ] [action 1]
- [ ] [action 2]

═══════════════════════════════════════════════════════
```

## Étape 7: Proposition de nouveaux tests E2E (si nécessaire)

Si des zones modifiées ne sont pas couvertes par les tests existants, proposer :

```typescript
// Exemple de test à ajouter dans e2e/[feature].spec.ts
test('should [description]', async ({ page }) => {
    // Setup
    await page.goto('/#/[route]');

    // Action
    await page.click('[data-testid="..."]');

    // Assertion
    await expect(page.locator('...')).toBeVisible();
});
```

**IMPORTANT** : Ne pas créer les tests automatiquement. Proposer le code et demander validation avant création.
