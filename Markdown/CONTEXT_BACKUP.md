# Context Backup - MyDelagrave

**Date** : 2026-01-06
**Branche** : dev
**Version** : 2.1.0

## Derniers commits

```
52ea77f feat: Vue Carte Planning Poseur avec Tournée (v2.1.0)
92f47ce chore: Migration Supabase v2.0.0 - Table pointages
06dbf31 fix: Corrections TypeScript pour build production
696c998 feat!: Application Mobile Poseur (v2.0.0)
b9821d8 test: Correction tests E2E + amélioration CLAUDE.md
```

## Tâche en cours

**Vue Carte Planning Poseur avec Tournée (v2.1.0)** - ✅ TERMINÉ

### Fonctionnalités implémentées dans cette session

| # | Tâche | Statut |
|---|-------|--------|
| 1 | Vue carte du planning mobile avec marqueurs numérotés | ✅ Terminé |
| 2 | Calcul d'itinéraire routier via OSRM API | ✅ Terminé |
| 3 | Affichage du trajet réel sur les routes | ✅ Terminé |
| 4 | Liste de tournée avec temps/distance entre étapes | ✅ Terminé |
| 5 | Géocodage automatique des adresses de livraison | ✅ Terminé |
| 6 | Carte routière ESRI (style atlas routier) | ✅ Terminé |
| 7 | Mode PWA fullscreen optimisé | ✅ Terminé |
| 8 | Correction décalage de date planning mobile | ✅ Terminé |
| 9 | Retrait du bouton + du menu mobile | ✅ Terminé |

### Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `src/components/mobile/MobilePlanningMap.tsx` | Composant carte Leaflet avec tournée numérotée |
| `src/components/mobile/MobileBottomNav.tsx` | Barre navigation bottom (FAB retiré) |
| `src/components/mobile/MobileLayout.tsx` | Layout mobile (onFabClick retiré) |
| `src/pages/mobile/MobilePlanningV2.tsx` | Planning avec vue carte intégrée |
| `src/pages/mobile/MobileChantierDetail.tsx` | Détail chantier (onFabClick retiré) |
| `src/components/chantiers/CreateChantierModal.tsx` | Géocodage automatique adresse livraison |
| `public/manifest.json` | PWA fullscreen + start_url mobile |
| `index.html` | Safe-area iOS + theme-color |
| `supabase/migrations/00009_phases_subphases_columns.sql` | Migration colonnes sous-phases |

### Corrections techniques importantes

1. **Fuseau horaire** : Utiliser `formatLocalDate()` au lieu de `toISOString().split('T')[0]`
2. **GeoJSON** : Coordonnées OSRM sont `[lon, lat]`, Leaflet attend `[lat, lon]`
3. **OSRM API** : `https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson`
4. **Carte routière** : ESRI World Street Map pour style atlas routier

### Modifications non committées

```
M src/components/mobile/MobileBottomNav.tsx    (FAB retiré)
M src/components/mobile/MobileLayout.tsx       (onFabClick retiré)
M src/pages/mobile/MobileChantierDetail.tsx    (onFabClick retiré)
M src/pages/mobile/MobilePlanningV2.tsx        (handleFabClick retiré)
```

## Déploiement

- Site production : https://mydelagrave.fr
- FTP : `admin@mydelagrave.fr` sur `node117-eu.n0c.com`
- Build : `npm run build -- --mode production`

## Prochaines étapes

1. **Committer les modifications FAB** - Retrait du bouton + (modifications en cours)
2. **Créer dashboard superviseur (ReservesPage)** - Gestion des réserves desktop
3. **Nettoyer les console.log** - Supprimer les logs de debug
4. **Tests E2E** - Ajouter des tests pour le parcours mobile carte

## Comment tester

```bash
cd H:\MyDelagrave
npm run dev
```

### Vue carte mobile

1. Accéder à `/#/m/planning`
2. Basculer sur l'onglet "Carte"
3. Voir les marqueurs numérotés + trajet routier
4. Liste de tournée avec temps/distances en dessous

### Mode PWA (plein écran)

Sur mobile :
1. **iOS** : Safari → Partager → "Sur l'écran d'accueil"
2. **Android** : Chrome → Menu → "Ajouter à l'écran d'accueil"
3. Lancer depuis l'icône = mode plein écran sans barre de navigation
