# 🔄 Prompt de Passation - Améliorations E2E (Points 2 & 3)

## 📋 Contexte

Le projet **MyDelagrave** a maintenant une suite E2E complète avec **80 tests passants**. Cette passation concerne les **améliorations recommandées** pour rendre les tests plus robustes.

---

## ✅ État Actuel (Terminé)

```bash
npx playwright test --reporter=line
# 80 passed (25.0s), 0 skipped, 0 failed ✅
```

---

## 🎯 Mission : Améliorer la Robustesse des Tests

### Point 2 : Ajouter des `data-testid` aux éléments critiques

**Objectif** : Remplacer les sélecteurs fragiles par des `data-testid` stables.

#### Fichiers à modifier :

| Composant | Fichier | Éléments à marquer |
|-----------|---------|-------------------|
| CreateContactModal | `src/components/CreateContactModal.tsx` | Inputs (email, nom, prénom), Select (catégorie), Bouton submit |
| CreateUserModal | `src/components/ui/CreateUserModal.tsx` | Inputs (email, password, nom, prénom), Select (rôle), Bouton submit |
| ContactsPage | `src/pages/ContactsPage.tsx` | Boutons Edit/Delete, Search input, Category filter |
| AdminPage | `src/pages/AdminPage.tsx` | Boutons Edit/Suspend/Delete, User table rows |
| TrashPage | `src/pages/TrashPage.tsx` | Boutons Restore/Delete, Filter tabs |

#### Exemple d'implémentation :

```tsx
// Avant
<input placeholder="Nom de l'entreprise" />

// Après
<input data-testid="contact-nom-input" placeholder="Nom de l'entreprise" />
```

#### Mise à jour des tests correspondants :

```typescript
// Avant
await page.getByPlaceholder('Nom de l\'entreprise').fill('Test');

// Après
await page.getByTestId('contact-nom-input').fill('Test');
```

---

### Point 3 : Créer des Fixtures de Données de Test

**Objectif** : Avoir des données de test prévisibles pour les tests qui dépendent de données existantes.

#### Créer le fichier `e2e/fixtures.ts` :

```typescript
import { Page } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

export async function createTestContact(page: Page) {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /contacts/i }).click();
    await page.getByRole('button', { name: /nouveau contact/i }).click();
    
    // Remplir le formulaire
    await page.getByTestId('contact-entreprise-input').fill('Test Company E2E');
    await page.getByTestId('contact-nom-input').fill('Test Contact');
    await page.getByTestId('contact-email-input').fill('test@e2e.com');
    
    await page.getByRole('button', { name: /créer/i }).click();
    await page.waitForTimeout(500);
    
    return { nom: 'Test Contact', email: 'test@e2e.com' };
}

export async function deleteTestContact(page: Page, contactName: string) {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /contacts/i }).click();
    
    const card = page.locator('[class*="glass-card"]', { hasText: contactName });
    await card.getByTitle(/supprimer/i).click();
    await page.getByRole('button', { name: /confirmer/i }).click();
}

export async function createTestUser(page: Page) {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /administration/i }).click();
    await page.getByRole('button', { name: /nouvel utilisateur/i }).click();
    
    const timestamp = Date.now();
    await page.getByTestId('user-email-input').fill(`test-${timestamp}@e2e.com`);
    await page.getByTestId('user-prenom-input').fill('TestPrenom');
    await page.getByTestId('user-nom-input').fill('TestNom');
    await page.getByTestId('user-role-select').selectOption('poseur');
    
    await page.getByRole('button', { name: /créer/i }).click();
    
    return { email: `test-${timestamp}@e2e.com`, nom: 'TestNom' };
}
```

#### Utilisation dans les tests :

```typescript
import { createTestContact, deleteTestContact } from './fixtures';

test.describe('Contacts with fixtures', () => {
    let testContact: { nom: string; email: string };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        testContact = await createTestContact(page);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteTestContact(page, testContact.nom);
        await page.close();
    });

    test('should display test contact', async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await page.getByRole('link', { name: /contacts/i }).click();
        await expect(page.getByText(testContact.nom)).toBeVisible();
    });
});
```

---

## 📂 Fichiers à Créer/Modifier

### Nouveaux fichiers :
```
e2e/fixtures.ts          # Fonctions de création/suppression de données test
```

### Fichiers à modifier (data-testid) :
```
src/components/CreateContactModal.tsx
src/components/ui/CreateUserModal.tsx  
src/pages/ContactsPage.tsx
src/pages/AdminPage.tsx
src/pages/TrashPage.tsx
```

### Tests à mettre à jour :
```
e2e/contacts.spec.ts     # Utiliser data-testid + fixtures
e2e/admin.spec.ts        # Utiliser data-testid + fixtures
```

---

## 🚀 Commandes Utiles

```bash
# Lancer les tests après modifications
npx playwright test

# Mode debug pour vérifier les sélecteurs
npx playwright test --debug

# Générer un rapport HTML
npx playwright test --reporter=html
npx playwright show-report
```

---

## ✅ Critère de Succès

1. Tous les composants critiques ont des `data-testid`
2. Le fichier `e2e/fixtures.ts` est créé avec les helpers
3. Les tests utilisent les nouveaux sélecteurs et fixtures
4. **80 tests passent toujours** après les modifications

```bash
npx playwright test --reporter=line
# 80 passed, 0 failed ✅
```

Bonne continuation ! 🎯
