# AGENTS.md

Instructions pour les agents IA travaillant sur ce projet.

## VERSION_ACTUELLE
**0.6.0**

## ÉTAT DU SYSTÈME
Gestion Documentaire pour Chantiers

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
| 0.6.0 | 2026-01-04 | Gestion Documentaire pour Chantiers |
| 0.5.0 | 2026-01-04 | Filtres avancés & documentation centralisée |
| 0.4.0 | 2025-01-04 | Gestionnaire de notes & sections expandables |
| 0.3.1 | 2025-01-03 | Corrections UI et support relations one-to-many |
| 0.3.0 | 2025-01-03 | Tri utilisateurs & renumérotation phases |
| 0.2.0 | 2025-01-02 | Tests E2E & data-testid |
| 0.1.1 | 2025-01-02 | Corrections initiales |
