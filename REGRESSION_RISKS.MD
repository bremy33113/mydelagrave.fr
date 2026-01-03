# Analyse des Risques de Régression

**Date de l'analyse**: 2026-01-03  
**Version**: v0.1.1  
**Agent**: `/analyze_regression_risks`

---

## 📊 Résumé Exécutif

### Couverture de Tests Actuelle

| Type | Nombre | Statut |
|------|--------|--------|
| **Tests E2E** | 20 tests | ✅ Passants |
| **Tests Unitaires** | 0 | ❌ Absents |
| **Couverture Pages** | 40% (2/5 pages) | ⚠️ Partiel |

### Zones à Risque Identifiées

| Zone | Risque | Tests E2E | Action |
|------|--------|-----------|--------|
| **ContactsPage** | 🔴 Élevé | ❌ Manquants | Créer `contacts.spec.ts` |
| **AdminPage** | 🔴 Élevé | ❌ Manquants | Créer `admin.spec.ts` |
| **TrashPage** | 🟡 Moyen | ❌ Manquants | Créer `trash.spec.ts` |
| **RBAC Logic** | 🔴 Critique | ❌ Manquants | Créer `rbac.spec.ts` |
| **Dashboard** | 🟢 Faible | ✅ Couverts | - |
| **Authentication** | 🟢 Faible | ✅ Couverts | - |

---

## 🔥 Fichiers à Haut Risque

### Selon l'Historique Git

Fichiers modifiés récemment (30 derniers jours) :

1. **`src/pages/AdminPage.tsx`** - Modifié pour RBAC
   - ❌ Pas de tests E2E dédiés
   - ⚠️ Logique complexe (gestion utilisateurs + filtres)
   - **Action**: Créer `e2e/admin.spec.ts`

2. **`src/pages/ContactsPage.tsx`** - Modifié pour RBAC
   - ❌ Pas de tests E2E dédiés
   - ⚠️ Permissions conditionnelles
   - **Action**: Créer `e2e/contacts.spec.ts`

3. **`src/hooks/useUserRole.ts`** - Hook RBAC central
   - ❌ Pas de tests unitaires
   - 🔴 Critique : utilisé partout
   - **Action**: Créer tests unitaires + E2E RBAC

4. **`src/lib/supabase.ts`** - Mock localStorage
   - ❌ Pas de tests unitaires
   - ⚠️ 665 lignes de code
   - **Action**: Tests unitaires pour les helpers

5. **`src/components/chantiers/CreateContactModal.tsx`**
   - ⚠️ Lint warning (@ts-expect-error)
   - **Action**: Fixer le warning ou justifier

---

## 📝 Tests E2E Manquants

### Priorité HAUTE 🔴

#### 1. **`e2e/contacts.spec.ts`**

**Scénarios critiques** :
```typescript
- Affichage de la liste des contacts
- Recherche et filtres
- Création d'un contact (Admin/CA)
- Édition d'un contact (Admin/CA propriétaire)
- Suppression d'un contact (Admin/CA propriétaire)
- Vérification permissions Poseur (lecture seule)
- Vérification permissions Superviseur (CRUD complet)
```

#### 2. **`e2e/admin.spec.ts`**

**Scénarios critiques** :
```typescript
- Admin : voir tous les utilisateurs
- Admin : créer utilisateur (tous rôles)
- Superviseur : voir Poseurs + CA
- Superviseur : créer uniquement Poseur
- Superviseur : modifier uniquement Poseur
- Superviseur : NE PAS voir boutons Edit/Delete pour CA
- Superviseur : NE PAS voir Admin
- CA/Poseur : NE PAS accéder à /admin
```

#### 3. **`e2e/rbac.spec.ts`**

**Scénarios critiques** :
```typescript
describe('RBAC - Dashboard Filtering', () => {
  - Admin voit tous les chantiers
  - Superviseur voit tous les chantiers
  - CA voit uniquement ses chantiers assignés
  - Poseur voit uniquement ses chantiers assignés
});

describe('RBAC - Button Visibility', () => {
  - Poseur ne voit PAS "Nouveau chantier"
  - Poseur ne voit PAS "Modifier" / "Supprimer"
  - CA voit "Nouveau contact"
  - Poseur ne voit PAS "Nouveau contact"
});
```

### Priorité MOYENNE 🟡

#### 4. **`e2e/trash.spec.ts`**

**Scénarios** :
```typescript
- Affichage des éléments supprimés
- Restauration d'un chantier
- Suppression définitive avec confirmation
- Filtrage par type (chantiers/notes/clients)
```

---

## 🧹 Amélioration des Règles Lint

### Warnings Actuels

**État**: 11 warnings, 0 erreur

#### Warnings Récurrents

1. **`react-hooks/exhaustive-deps`** (7 occurrences)
   ```
   Fichiers concernés :
   - AddContactModal.tsx
   - CreateChantierModal.tsx
   - NotesSection.tsx
   - PhasesModal.tsx
   - AdminPage.tsx
   - DashboardPage.tsx
   ```
   
   **Impact** : Risque de stale closures → bugs subtils
   
   **Action recommandée** :
   ```javascript
   // Dans eslint.config.js
   rules: {
     'react-hooks/exhaustive-deps': 'error' // au lieu de 'warn'
   }
   ```

2. **`no-console`** (2 occurrences)
   ```
   Fichiers :
   - src/lib/supabase.ts (ligne 95, 665)
   ```
   
   **Action** : Remplacer par un logger configurable

3. **`@typescript-eslint/no-explicit-any`** (2 occurrences)
   ```
   Fichier : CreateContactModal.tsx (lignes 190, 202)
   ```
   
   **Action** : Typer correctement les événements

### Règles Lint Recommandées

Ajouter dans `eslint.config.js` :

```javascript
export default [
  // ... config existante
  {
    rules: {
      // Forcer la résolution des deps useEffect
      'react-hooks/exhaustive-deps': 'error',
      
      // Interdire any (sauf cas justifiés avec @ts-expect-error)
      '@typescript-eslint/no-explicit-any': 'error',
      
      // Interdire console.log en production
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      
      // Forcer les PropTypes ou TypeScript
      'react/prop-types': 'off', // On utilise TypeScript
      
      // Interdire les variables non utilisées
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
];
```

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : Tests E2E Critiques (Priorité Immédiate)

**Estimation** : 4-6 heures

1. ✅ **Créer `e2e/contacts.spec.ts`**
   - Tester CRUD complet
   - Tester permissions par rôle
   - Duration: ~1.5h

2. ✅ **Créer `e2e/admin.spec.ts`**
   - Tester gestion utilisateurs
   - Tester filtres Superviseur
   - Duration: ~2h

3. ✅ **Créer `e2e/rbac.spec.ts`**
   - Tester filtrage Dashboard
   - Tester visibilité boutons
   - Duration: ~1.5h

4. ✅ **Créer `e2e/trash.spec.ts`**
   - Tester restauration
   - Tester suppression définitive
   - Duration: ~1h

### Phase 2 : Renforcement Lint (Priorité Haute)

**Estimation** : 2-3 heures

1. ✅ **Passer `react-hooks/exhaustive-deps` en erreur**
   - Fixer les 7 warnings existants
   - Duration: ~1.5h

2. ✅ **Fixer `no-console` warnings**
   - Créer un logger helper
   - Remplacer console.log
   - Duration: ~30min

3. ✅ **Fixer `@typescript-eslint/no-explicit-any`**
   - Typer correctement les événements
   - Duration: ~30min

### Phase 3 : Tests Unitaires (Priorité Moyenne)

**Estimation** : 4-6 heures

1. ⬜ **Créer tests unitaires pour `useUserRole`**
   - Tester toutes les combinaisons de rôles
   - Duration: ~1.5h

2. ⬜ **Créer tests unitaires pour `supabase.ts` helpers**
   - Tester generateUUID, getTable, setTable
   - Duration: ~2h

3. ⬜ **Créer tests unitaires pour composants critiques**
   - ChantierCard
   - ConfirmModal
   - Duration: ~2h

---

## 📈 Métriques de Régression

### Before vs After

| Métrique | Avant | Cible | Amélioration |
|----------|-------|-------|--------------|
| **Tests E2E** | 20 | 40+ | +100% |
| **Couverture Pages** | 40% | 100% | +60% |
| **Lint Errors** | 0 | 0 | = |
| **Lint Warnings** | 11 | 0 | -100% |
| **Tests Unitaires** | 0 | 15+ | +∞ |

### Indicateurs de Qualité

- **Code Complexity** : Moyenne (acceptable)
- **Technical Debt** : Faible (principalement warnings)
- **Test Coverage** : Partielle (à améliorer)
- **Security** : Bonne (RBAC implémenté)

---

## 🚨 Risques Résiduels

Même après amélioration, les risques suivants persisteront :

1. **Pas de tests de performance** → Risque de dégradation UX
2. **Pas de tests d'accessibilité** → Risque de non-conformité
3. **Pas de tests de sécurité** → Risque de failles (injection, XSS)
4. **Pas de tests de compatibilité navigateurs** → Risque de bugs spécifiques

**Recommandation** : Planifier Phase 4 pour ces aspects.

---

## 📚 Ressources

### Outils Recommandés

- **Playwright** : E2E tests (déjà installé)
- **Vitest** : Tests unitaires (à installer)
- **React Testing Library** : Tests composants (à installer)
- **Husky** : Pre-commit hooks (optionnel)
- **Lighthouse CI** : Performance tests (optionnel)

### Documentation

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [React Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [ESLint React Hooks Rules](https://react.dev/learn/react-compiler#eslint-plugin-react-compiler)

---

**Rapport généré par `/analyze_regression_risks` workflow**  
*Pour exécuter : `@[/analyze_regression_risks]`*
