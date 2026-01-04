# E2E Tests - Documentation

## État Actuel (v0.6.0)

```bash
npx playwright test
# 107 passed, 0 skipped, 0 failed
```

### Fichiers de Tests E2E

| Fichier | Tests | Description |
|---------|-------|-------------|
| `e2e/auth.spec.ts` | 9 | Authentification (login, logout, session) |
| `e2e/dashboard.spec.ts` | 19 | Dashboard, KPI, filtres, navigation |
| `e2e/rbac.spec.ts` | 20 | Permissions par rôle |
| `e2e/trash.spec.ts` | 12 | Corbeille (soft delete, restore) |
| `e2e/admin.spec.ts` | 16 | Page admin, gestion utilisateurs |
| `e2e/contacts.spec.ts` | 13 | Contacts CRUD, permissions |
| `e2e/notes.spec.ts` | 8 | Notes chantier, photos |
| `e2e/documents.spec.ts` | 11 | Documents (upload, delete, preview) |

---

## Comptes de Test

```typescript
// e2e/helpers.ts
ACCOUNTS = {
    admin: { email: 'admin@delagrave.fr', password: 'admin123' },
    superviseur: { email: 'marie.martin@delagrave.fr', password: 'password123' },
    chargeAffaire: { email: 'jean.dupont@delagrave.fr', password: 'password123' },
    poseur: { email: 'pierre.durand@delagrave.fr', password: 'poseur123' }
}
```

---

## Commandes Utiles

```bash
# Lancer tous les tests
npm run test:e2e

# Lancer un fichier spécifique
npx playwright test documents.spec.ts

# Mode debug (voir le navigateur)
npx playwright test --debug

# Mode UI (interface graphique)
npx playwright test --ui

# Un seul test
npx playwright test -g "should upload a document"

# Voir le rapport après échec
npx playwright show-report
```

---

## Conventions

### data-testid

Tous les éléments interactifs doivent avoir un `data-testid` :

```tsx
// Boutons
data-testid="btn-add-document"
data-testid="btn-delete-document-{id}"

// Sections
data-testid="section-documents"
data-testid="documents-list"

// Formulaires
data-testid="document-type-select"
data-testid="document-name-input"
```

### Gestion des dialogues confirm()

```typescript
// Avant de cliquer sur un bouton qui déclenche confirm()
page.on('dialog', dialog => dialog.accept());
await page.locator('[data-testid="btn-delete"]').click();
```

### Upload de fichiers

```typescript
const buffer = Buffer.from('contenu du fichier');
await page.locator('[data-testid="file-input"]').setInputFiles({
    name: 'test.pdf',
    mimeType: 'application/pdf',
    buffer
});
```

---

## Structure Mock Supabase

Le projet utilise un mock Supabase (`src/lib/supabase.ts`) avec localStorage :
- Les données sont réinitialisées à chaque reload si `mock_db_initialized` est supprimé
- Les relations fonctionnent avec la syntaxe : `alias:table!foreign_key(columns)`

---

## Ajouter un nouveau test

1. Créer le fichier `e2e/[feature].spec.ts`
2. Importer les helpers : `import { login, ACCOUNTS } from './helpers';`
3. Utiliser `test.beforeEach` pour le setup (login, navigation)
4. Ajouter les `data-testid` nécessaires dans les composants
5. Exécuter : `npx playwright test [feature].spec.ts`
