# Prochaines Étapes MyDelagrave

**Date** : 2026-01-06
**Version** : 2.2.0
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

## 2. Dashboard Superviseur - ReservesPage 📋 ✅ Fait

**Implémenté** :
- Section expandable "Réserves" dans ChantierDetail.tsx
- Page dédiée `src/pages/ReservesPage.tsx`
- Route `/reserves` dans App.tsx
- Lien Sidebar (visible pour non-poseurs)

**Fonctionnalités** :
- Liste globale des réserves avec filtres (statut, chantier, recherche)
- Actions : Traiter → En cours → Lever/Rejeter
- Vignettes photos cliquables
- Lien vers le chantier concerné

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
| 1 | Commit modifications FAB | ⚡ HAUTE | ✅ Fait |
| 2 | Dashboard ReservesPage | 📋 MOYENNE | ✅ Fait |
| 3 | Nettoyer console.log | 🧹 BASSE | ⏳ À faire |
| 4 | Tests E2E mobile | 🧪 BASSE | ⏳ À faire |
