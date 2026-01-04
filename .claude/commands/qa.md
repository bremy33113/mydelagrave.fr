---
description: Analyse diff version + lint + tests E2E (no code regression)
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(git:*), Bash(npx:*)
---

# QA - Analyse de Régression

Tu es un QA Engineer Senior. Analyse les changements depuis la dernière version, positionne les tests nécessaires, et vérifie qu'il n'y a pas de régression.

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
# Inclure aussi les fichiers non commités
git status --short
```

### Résumé des commits
```bash
git log --oneline <PREVIOUS_TAG>..HEAD
```

Afficher un rapport :
```
📊 **Analyse des changements v{PREVIOUS} → HEAD**

**Commits** : N commits
**Fichiers modifiés** : N fichiers (+ N non commités)

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

Pour chaque zone, vérifier si un test E2E existe déjà en cherchant dans `e2e/*.spec.ts`.

```
🎯 **Zones à risque identifiées** :

| Zone | Fichier | Impact | Test E2E existant |
|------|---------|--------|-------------------|
| [zone] | [fichier] | [Haut/Moyen/Bas] | [Oui/Non] |
```

## Étape 4: Positionner les nouveaux tests E2E

**AVANT d'exécuter les tests**, pour chaque zone à risque NON couverte :

1. Identifier le fichier spec approprié (existant ou nouveau)
2. Ajouter les `data-testid` nécessaires dans les composants modifiés
3. Créer les tests E2E correspondants

### Ajout des data-testid dans le code source

Pour les composants modifiés sans testid, ajouter les attributs nécessaires :

```typescript
// Exemple: ajouter data-testid aux éléments interactifs
<button data-testid="btn-add-note" onClick={...}>
<section data-testid="section-informations">
<div data-testid="notes-list">
```

### Création des tests E2E

Créer ou enrichir les fichiers `e2e/*.spec.ts` :

```typescript
// e2e/[feature].spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('[Feature] - [Context]', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
    });

    test('should [action] [expected result]', async ({ page }) => {
        // Arrange
        await page.goto('/#/[route]');

        // Act
        await page.click('[data-testid="..."]');

        // Assert
        await expect(page.locator('[data-testid="..."]')).toBeVisible();
    });
});
```

## Étape 5: Vérification ESLint

```bash
npm run lint
```

Si erreurs, les corriger avant de continuer.

Rapport :
```
✅ ESLint : Pas d'erreurs
# ou
❌ ESLint : N erreurs trouvées
[liste des erreurs]
→ Correction automatique...
```

## Étape 6: Exécution des Tests E2E

```bash
# Exécuter tous les tests
npm run test:e2e
```

### Si échec, analyser et corriger :
```bash
# Voir le rapport détaillé
npx playwright show-report
```

- Si le test échoue à cause du code → corriger le code
- Si le test échoue à cause du test → corriger le test

## Étape 7: Rapport Final

```
═══════════════════════════════════════════════════════
📋 **RAPPORT QA - v{VERSION}**
═══════════════════════════════════════════════════════

## Analyse du code
- Commits analysés : N
- Fichiers modifiés : N
- Zones à risque : N

## Tests ajoutés/modifiés

| Fichier | Tests ajoutés |
|---------|---------------|
| e2e/xxx.spec.ts | N nouveaux tests |

## Vérifications

| Check | Statut | Détails |
|-------|--------|---------|
| ESLint | ✅/❌ | [détails] |
| Tests E2E | ✅/❌ | X/Y passés |
| Build | ✅/❌ | [si testé] |

## Couverture des tests

| Zone modifiée | Couverte par E2E |
|---------------|------------------|
| [composant] | ✅ |

## Actions effectuées
- [x] data-testid ajoutés dans [fichiers]
- [x] Tests E2E créés dans [fichiers]
- [x] Tous les tests passent

═══════════════════════════════════════════════════════
```

## Checklist finale

Avant de terminer le QA :

- [ ] Toutes les zones à risque sont couvertes par des tests
- [ ] ESLint passe sans erreur
- [ ] Tous les tests E2E passent
- [ ] Les nouveaux tests sont pertinents et maintenables
