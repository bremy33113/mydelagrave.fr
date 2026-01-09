# Context Backup - MyDelagrave

**Date de sauvegarde** : 2026-01-09
**Branche** : dev
**Version** : 2.2.4

---

## Derniers commits

```
0816daf test: Ajout tests E2E non-régression v2.2.3
46c02ae fix: Correction nom phase vs libellé sous-phase (v2.2.3)
f12aa5d feat: Planning par chantier et focus phases (v2.2.2)
7ade2bf fix: Améliorations phases et filtres utilisateurs (v2.2.1)
3cd4be0 feat: Navigation et mise en évidence des phases (v2.2.0)
```

---

## Tâche en cours

### Déploiement v2.2.3 vers main (INTERROMPU)

L'utilisateur a demandé de déployer la version dev vers main. Le processus a été interrompu avant le merge.

**Étapes restantes :**
1. `git stash` (pour les fichiers non commités)
2. `git checkout main`
3. `git pull origin main`
4. `git merge dev`
5. `git push origin main`
6. `git checkout dev && git stash pop`

---

## Fichiers non commités (WIP)

### Split de ChantierDetail.tsx

Un travail de refactoring est en cours pour diviser `ChantierDetail.tsx` en sous-composants :

**Fichiers créés (non commités) :**
- `src/components/chantiers/ChantierCompletionStatus.tsx`
- `src/components/chantiers/ChantierContactsList.tsx`
- `src/components/chantiers/ChantierCoordonnees.tsx`
- `src/components/chantiers/ChantierDetailHeader.tsx`
- `src/components/chantiers/ChantierDocumentsSection.tsx`
- `src/components/chantiers/ChantierNotesSection.tsx`
- `src/components/chantiers/ChantierReservesSection.tsx`
- `src/components/chantiers/PhotoModal.tsx`
- `src/components/chantiers/types.ts`
- `Markdown/SPLIT.md` (documentation du split)

**Fichier modifié :**
- `src/components/chantiers/ChantierDetail.tsx`

---

## Résumé des changements v2.2.3

### Corrections
- Fix: Le nom de la phase affiche maintenant le nom défini (ex: "Batiment") et non le libellé de la sous-phase (ex: "RDC")
- Fix: Correction dans PhasesModal et PlanningPage pour utiliser le placeholder (duree_heures=0) comme source du nom de phase
- Fix: Erreurs ESLint (non-null assertions) dans DroppablePoseurRow et SansPoseRow

### Améliorations
- Scroll automatique vers le formulaire "Nouvelle sous-phase" lors de son ouverture
- Placeholders mis à jour dans les formulaires (Phase: "Batiment", Sous-phase: "RDC")

### Tests E2E ajoutés
- `e2e/chantier-detail.spec.ts` - 10 tests
- `e2e/reserves.spec.ts` - 11 tests
- Tests enrichis dans `phases.spec.ts` et `planning.spec.ts`

---

## Prochaines étapes suggérées

1. **Terminer le déploiement** : Merger dev vers main
2. **Décider pour le split ChantierDetail** :
   - Option A : Commiter le refactoring
   - Option B : Annuler (`git checkout -- .` + supprimer les nouveaux fichiers)
3. **Implémenter react-rnd** : Plan existant dans `.claude/plans/idempotent-meandering-pizza.md` pour le drag & resize des phases sur le planning

---

## Notes techniques

### Structure des phases (v2.2.3)
- **Placeholder de phase** : `numero_phase: 0`, `duree_heures: 0` → contient le nom de la phase
- **Sous-phases réelles** : `numero_phase: 1, 2, 3...`, `duree_heures > 0` → contiennent le libellé

### Pour les phases existantes sans placeholder
Les utilisateurs doivent éditer la phase (icône crayon) pour créer le placeholder avec le bon nom.

---

## Déploiement

- Site production : https://mydelagrave.fr
- FTP : `admin@mydelagrave.fr` sur `node117-eu.n0c.com`
- Build : `npm run build -- --mode production`

## Comment tester

```bash
cd H:\MyDelagrave
npm run dev
```

### Tests E2E
```bash
npm run test:e2e
```
