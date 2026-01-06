# AGENTS.md

Instructions pour les agents IA travaillant sur ce projet.

## VERSION_ACTUELLE
**2.1.0**

## ÉTAT DU SYSTÈME
MyDelagrave v2.1.0 - Vue Carte Planning Poseur avec Tournée

## Mode d'Exécution

| Variable | Valeur | Mode |
|----------|--------|------|
| `VITE_USE_MOCK` | `true` (défaut) | Développement (localStorage) |
| `VITE_USE_MOCK` | `false` | Production (Supabase distant) |

### Fichiers de configuration
- `.env.example` : Template des variables
- `.env.local` : Configuration locale (gitignored)
- `.env.production` : Configuration production (gitignored)

### Documentation déploiement
- `markdown/DEPLOY_STRATEGY.md` : Guide complet de déploiement
- `markdown/DEPLOY_HISTORY.md` : Historique des déploiements
- `supabase/migrations/` : Scripts SQL pour Supabase

## Instructions Générales

### Contexte du Projet
MyDelagrave est une application de gestion de chantiers pour Delagrave.
- Frontend React 19 + TypeScript + Vite
- Mock Supabase avec localStorage (migration Supabase prévue)
- Tests E2E Playwright

### Règles de Développement
1. **Langue UI** : Tout le texte visible est en français
2. **Soft Delete** : Utiliser `deleted_at: null` (pas `undefined`)
3. **Tests** : Ajouter `data-testid` pour les nouveaux composants
4. **Commits** : Format sémantique (feat/fix/chore)

### Fichiers Versionnés
Lors d'un bump de version, mettre à jour :
- `package.json`
- `markdown/AGENTS.md` (ce fichier)
- `markdown/CHANGELOG.md`

### Workflows Disponibles
- `/patch` : Correction de bugs (x.x.Z)
- `/minor` : Nouvelles fonctionnalités (x.Y.0)
- `/major` : Breaking changes (X.0.0)
- `/qa` : Analyse de régression + tests

## Historique des Versions

| Version | Date | Description |
|---------|------|-------------|
| 2.1.0 | 2026-01-06 | Vue Carte Planning Poseur avec Tournée |
| 2.0.0 | 2026-01-06 | 🚀 Application Mobile Poseur (MAJOR) |
| 1.4.0 | 2026-01-05 | Sous-phases et Suivi des Heures |
| 1.3.0 | 2026-01-05 | Utilisateurs en ligne temps réel |
| 1.2.2 | 2026-01-05 | Verrouillage poseur fourniture + Référentiels |
| 1.1.1 | 2026-01-04 | Corrections production (PostgREST, auth sync, session admin) |
| 1.1.0 | 2026-01-04 | Infrastructure Production Supabase |
| 1.0.0 | 2026-01-04 | 🚀 MyDelagrave Production Ready |
| 0.6.2 | 2026-01-04 | Vues Planning 3 Mois/Année + fenêtre externe |
| 0.6.1 | 2026-01-04 | Précision horaire des barres de phase |
| 0.6.0 | 2026-01-04 | Gestion Documentaire pour Chantiers |
| 0.5.0 | 2026-01-04 | Filtres avancés & documentation centralisée |
| 0.4.0 | 2025-01-04 | Gestionnaire de notes & sections expandables |
| 0.3.1 | 2025-01-03 | Corrections UI et support relations one-to-many |
| 0.3.0 | 2025-01-03 | Tri utilisateurs & renumérotation phases |
| 0.2.0 | 2025-01-02 | Tests E2E & data-testid |
| 0.1.1 | 2025-01-02 | Corrections initiales |
