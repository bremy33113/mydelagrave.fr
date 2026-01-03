# 🔄 Prompt de Passation - Correction des Tests E2E Skippés

## 📋 Contexte

Tu reprends le travail sur le projet **MyDelagrave** (application de gestion de chantiers). La suite de tests E2E Playwright a été stabilisée avec **68 tests passants** et **12 tests temporairement skippés**. 

Ta mission : **Corriger les 12 tests skippés** pour qu'ils passent tous.

---

## 🎯 État Actuel

```bash
# Résultat actuel des tests
npx playwright test --reporter=line
# 68 passed, 12 skipped, 0 failed (exit code: 0)
```

### Fichiers de Tests E2E
- `e2e/auth.spec.ts` - ✅ 9/9 passent
- `e2e/dashboard.spec.ts` - ✅ 11/11 passent
- `e2e/rbac.spec.ts` - ✅ 20/20 passent
- `e2e/trash.spec.ts` - ✅ 13/13 passent
- `e2e/admin.spec.ts` - ⚠️ 11/14 passent, **3 skippés**
- `e2e/contacts.spec.ts` - ⚠️ 4/13 passent, **9 skippés**

---

## 🔧 Tests à Corriger (12)

### admin.spec.ts (3 tests)

1. **`should create a new user`** (ligne ~24)
   - **Problème**: Les sélecteurs `getByLabel(/nom/i)`, `getByLabel(/prénom/i)` ne fonctionnent pas
   - **Solution**: Inspecter le CreateUserModal pour trouver les bons sélecteurs (placeholder, name attribute, etc.)

2. **`should only create Poseur users`** (ligne ~77)
   - **Problème**: `page.locator('select[name="role"]')` ne trouve pas le select
   - **Solution**: Vérifier l'attribut name réel du select dans le modal

3. **`should suspend a user`** (ligne ~43)
   - **Problème**: `getByTitle(/suspendre|activer/i)` ne trouve pas les boutons
   - **Solution**: Inspecter les boutons suspend/activate dans le tableau utilisateurs

### contacts.spec.ts (9 tests)

4. **`should display contact cards`** (ligne ~18)
   - **Problème**: `locator('[class*="glass-card"]')` timeout car pas de contacts
   - **Solution**: Créer un contact d'abord OU rendre le test conditionnel

5. **`should filter contacts by search`** (ligne ~25)
   - **Problème**: Timing/chargement
   - **Solution**: Ajouter un waitFor avant le test

6. **`should filter contacts by category`** (ligne ~32)
   - **Problème**: `page.locator('select').first()` peut ne pas être le bon select
   - **Solution**: Utiliser un sélecteur plus spécifique

7. **`should create a new contact`** (ligne ~52)
   - **Problème**: `getByLabel(/nom/i)` ne fonctionne pas
   - **Solution**: Inspecter CreateContactModal - le champ s'appelle peut-être "Entreprise" pas "Nom"

8. **`should edit a contact`** (ligne ~67)
   - **Problème**: Dépend de contacts existants
   - **Solution**: Créer un contact d'abord ou utiliser beforeEach

9. **`should delete a contact with confirmation`** (ligne ~80)
   - **Problème**: Dépend de contacts existants
   - **Solution**: Idem

10. **`should only edit/delete own contacts`** (ligne ~107)
    - **Problème**: Dépend de contacts avec ownership
    - **Solution**: Créer des données de test appropriées

11. **`should NOT see edit buttons`** (ligne ~134)
    - **Problème**: `waitFor({ state: 'visible' })` timeout car pas de contacts
    - **Solution**: Rendre conditionnel ou créer des données

12. **`should NOT see delete buttons`** (ligne ~143)
    - **Problème**: Idem
    - **Solution**: Idem

---

## 📂 Fichiers Clés à Inspecter

### UI Components
```
src/pages/AdminPage.tsx          # Page admin avec table users
src/pages/ContactsPage.tsx       # Page contacts (déjà un title ajouté au bouton Edit)
src/components/ui/CreateUserModal.tsx    # Modal création utilisateur (si existe)
src/components/CreateContactModal.tsx    # Modal création contact
```

### Helpers E2E
```
e2e/helpers.ts                   # login(), clearAuth(), ACCOUNTS
```

### Test Files
```
e2e/admin.spec.ts                # 3 tests skippés
e2e/contacts.spec.ts             # 9 tests skippés
```

---

## 🛠️ Stratégie de Correction

### Étape 1: Inspecter les Modales
```typescript
// Utilise le browser_subagent pour inspecter
// 1. Navigue vers la page
// 2. Ouvre le modal
// 3. Exécute JavaScript pour lister tous les inputs:
document.querySelectorAll('input, select, textarea').forEach(el => {
    console.log({
        tagName: el.tagName,
        name: el.name,
        placeholder: el.placeholder,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className
    });
});
```

### Étape 2: Mettre à jour les sélecteurs
Remplace les `getByLabel()` par des sélecteurs qui fonctionnent:
- `getByPlaceholder('...')`
- `locator('input[name="..."]')`
- `getByRole('textbox', { name: /.../ })`

### Étape 3: Gérer les données manquantes
Pour les tests qui dépendent de données:
```typescript
test.beforeAll(async ({ page }) => {
    // Créer un contact de test
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    // ... créer le contact
});

test.afterAll(async ({ page }) => {
    // Nettoyer les données de test
});
```

### Étape 4: Retirer les .skip()
Une fois corrigé, remplace `test.skip(...)` par `test(...)`.

---

## 🔑 Comptes de Test (dans helpers.ts)

```typescript
ACCOUNTS = {
    admin: { email: 'admin@delagrave.fr', password: 'admin123' },
    superviseur: { email: 'superviseur@delagrave.fr', password: 'superviseur123' },
    chargeAffaire: { email: 'ridou@delagrave.fr', password: 'ridou123' },
    poseur: { email: 'poseur@delagrave.fr', password: 'poseur123' }
}
```

---

## 🚀 Commandes Utiles

```bash
# Lancer tous les tests
npx playwright test

# Lancer un fichier spécifique
npx playwright test admin.spec.ts

# Mode debug (pour voir le navigateur)
npx playwright test --debug

# Mode UI (interface graphique)
npx playwright test --ui

# Un seul test
npx playwright test -g "should create a new user"
```

---

## ✅ Critère de Succès

```bash
npx playwright test --reporter=line
# 80 passed, 0 skipped, 0 failed (exit code: 0)
```

Bonne chance ! 🎯
