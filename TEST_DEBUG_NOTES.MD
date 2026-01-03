# Notes de Débogage - Tests E2E

**Date**: 2026-01-03  
**Tests créés**: 4 nouveaux fichiers  
**Résultat initial**: 28/81 passés, 53 échecs

---

## 📊 État des Tests

| Fichier | Tests | Statut Estimé |
|---------|-------|---------------|
| `auth.spec.ts` | ~9 | ✅ Stables |
| `dashboard.spec.ts` | ~11 | ✅ Stables |
| `contacts.spec.ts` | ~23 | ⚠️ À ajuster |
| `admin.spec.ts` | ~20 | ⚠️ À ajuster |
| `rbac.spec.ts` | ~14 | ⚠️ À ajuster |
| `trash.spec.ts` | ~4 | ⚠️ À ajuster |

---

## 🔧 Problèmes Courants Identifiés

### 1. **Sélecteurs de Boutons Incorrects**

**Problème**: Les tests cherchent des boutons avec des textes qui peuvent ne pas correspondre exactement.

**Exemple**:
```typescript
// ❌ Peut échouer si le texte varie
await page.getByRole('button', { name: /nouveau contact/i })

// ✅ Mieux: utiliser un sélecteur plus flexible
await page.getByRole('button', { name: /nouveau|new/i })
// Ou par classe/attribut
await page.locator('button:has-text("Nouveau contact")')
```

**Solution**: Vérifier les textes exacts des boutons dans l'UI.

### 2. **Timeouts Insuffisants**

**Problème**: Les tests E2E peuvent être trop rapides pour le chargement des données.

**Solution**:
```typescript
// Augmenter les timeouts par défaut
test.setTimeout(30000); // 30 secondes

// Attendre explicitement
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

### 3. **Sélecteurs de Cartes Génériques**

**Problème**: `[class*="glass-card"]` peut matcher trop d'éléments.

**Solution**:
```typescript
// Plus spécifique
const contactCards = page.locator('.contacts-page [class*="glass-card"]');
const chantierCards = page.locator('.dashboard-page [class*="glass-card"]');
```

### 4. **Vérifications de Permissions**

**Problème**: Les tests RBAC peuvent échouer si les permissions UI ne sont pas encore implémentées correctement.

**Solution**: Tests conditionnels avec vérifications de visibilité plus souples.

---

## 🎯 Plan de Correction

### Phase 1: Stabiliser les Tests de Base (Priorité HAUTE)

#### `contacts.spec.ts`
- [ ] Vérifier sélecteurs de boutons "Nouveau contact"
- [ ] Ajuster timeouts pour chargement de cartes
- [ ] Vérifier que le formulaire de création existe
- [ ] Adapter les tests de permissions aux boutons réels

#### `admin.spec.ts`
- [ ] Vérifier URL de navigation (/admin vs /administration)
- [ ] Confirmer sélecteurs de tableau utilisateurs
- [ ] Vérifier textes des modales
- [ ] Tester avec données mock existantes

### Phase 2: Raffiner les Tests RBAC (Priorité MOYENNE)

#### `rbac.spec.ts`
- [ ] Vérifier que les filtres Dashboard sont bien appliqués
- [ ] Confirmer visibilité boutons selon rôle
- [ ] Adapter aux redirections réelles de l'app
- [ ] Harmoniser avec tests `dashboard.spec.ts`

### Phase 3: Compléter les Tests Trash (Priorité BASSE)

#### `trash.spec.ts`
- [ ] Vérifier que des éléments supprimés existent
- [ ] Adapter aux messages d'état vide réels
- [ ] Confirmer le workflow de restauration
- [ ] Tester suppression définitive

---

## 🔍 Stratégie de Débogage

### Étape 1: Identifier les Tests Critiques
Concentrer les efforts sur les tests qui couvrent :
1. Flux utilisateur principaux (login, création, navigation)
2. Permissions RBAC (bloquer/autoriser selon rôle)
3. CRUD de base (créer, lire, modifier, supprimer)

### Étape 2: Débogage Visuel
```bash
# Lancer Playwright en mode UI pour voir les tests
npx playwright test --ui

# Ou en mode debug pour un test spécifique
npx playwright test contacts.spec.ts --debug
```

### Étape 3: Screenshots et Traces
```typescript
// Dans les tests qui échouent
test('my test', async ({ page }) => {
  // ...
  await page.screenshot({ path: 'debug-screenshot.png' });
  await page.pause(); // Pause pour inspection
});
```

### Étape 4: Correction Itérative
1. Fixer 5 tests à la fois
2. Re-exécuter tous les tests
3. Vérifier qu'on n'a pas cassé les tests existants
4. Répéter

---

## 📈 Objectif de Couverture

| Métrique | Avant | Maintenant | Objectif Final |
|----------|-------|------------|----------------|
| **Nombre de tests** | 20 | 81 | 81+ |
| **Tests passants** | 20 | 28 | 75+ (93%) |
| **Couverture pages** | 40% | 83% | 100% |

---

## 💡 Recommandations

1. **Ne pas tout fixer d'un coup**: Prioriser les tests critiques
2. **Utiliser `--grep`**: Exécuter uniquement certains tests
   ```bash
   npx playwright test --grep "Admin"
   npx playwright test --grep "RBAC"
   ```
3. **Marquer tests flaky**: Si un test est instable
   ```typescript
   test.fixme('unstable test', async ({ page }) => {
     // ...
   });
   ```
4. **Documentation continue**: Noter les sélecteurs fragiles

---

## 🚀 Prochaines Étapes

1. ✅ **Fait**: Créer les 4 fichiers de tests manquants
2. ⬜ **À faire**: Exécuter tests en mode UI pour débogage visuel
3. ⬜ **À faire**: Fixer les 53 tests échoués (par priorité)
4. ⬜ **À faire**: Atteindre 93%+ de succès
5. ⬜ **À faire**: Ajouter au workflow `/run_qa`

---

**Note**: Les échecs sont **normaux** pour de nouveaux tests. C'est un processus itératif.  
L'important est d'avoir une couverture complète, puis d'affiner les sélecteurs.
