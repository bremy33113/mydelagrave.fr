# Prochaines Étapes MyDelagrave

**Date** : 2026-01-06
**Version** : 2.1.0
**Branche** : dev

---

## 1. Committer les modifications FAB ⚡ HAUTE

**Objectif** : Finaliser le retrait du bouton + du menu mobile

**Fichiers modifiés (non committés)** :
- `src/components/mobile/MobileBottomNav.tsx` - FAB retiré
- `src/components/mobile/MobileLayout.tsx` - prop onFabClick retirée
- `src/pages/mobile/MobileChantierDetail.tsx` - onFabClick retiré
- `src/pages/mobile/MobilePlanningV2.tsx` - handleFabClick retiré

**Actions** :
```bash
git add -A
git commit -m "fix: Retrait du bouton FAB du menu mobile"
git push
```

---

## 2. Dashboard Superviseur - ReservesPage 📋 MOYENNE

**Objectif** : Créer une page desktop pour gérer les réserves signalées par les poseurs

**Fichier à créer** :
- `src/pages/ReservesPage.tsx`

**Fonctionnalités** :
- Liste des réserves par chantier (tableau)
- Filtres : statut (en attente, en cours, levée), chantier, poseur
- Actions : Marquer comme "en cours", "levée"
- Lien vers le chantier concerné

**Route à ajouter** :
- `/reserves` dans `App.tsx`
- Lien dans la Sidebar pour superviseurs/admins

---

## 3. Nettoyer les console.log 🧹 BASSE

**Objectif** : Supprimer les logs de debug avant mise en production

**Commande de recherche** :
```bash
grep -r "console.log" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```

**Fichiers concernés** :
- `src/pages/mobile/MobilePlanningV2.tsx` - logs de debug phases
- Autres fichiers mobiles potentiellement

---

## 4. Tests E2E Mobile 🧪 BASSE

**Objectif** : Ajouter des tests Playwright pour le parcours mobile

**Fichier à créer** :
- `e2e/mobile.spec.ts`

**Scénarios à tester** :
- Accès au planning mobile `/m/planning`
- Navigation jour/semaine
- Toggle liste/carte
- Clic sur un chantier → détail
- Retour arrière

---

## Ordre d'exécution recommandé

| # | Tâche | Priorité | Statut |
|---|-------|----------|--------|
| 1 | Commit modifications FAB | ⚡ HAUTE | ⏳ À faire |
| 2 | Dashboard ReservesPage | 📋 MOYENNE | ⏳ À faire |
| 3 | Nettoyer console.log | 🧹 BASSE | ⏳ À faire |
| 4 | Tests E2E mobile | 🧪 BASSE | ⏳ À faire |
