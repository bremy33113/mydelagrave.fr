# Historique des Déploiements MyDelagrave

Ce fichier trace tous les déploiements et migrations appliqués en production.
Mettre à jour ce fichier après chaque déploiement pour maintenir un historique complet.

---

## Tableau de Bord

| Date | Version | Type | Description | Par |
|------|---------|------|-------------|-----|
| - | - | - | Aucun déploiement effectué | - |

---

## Déploiements

### [TEMPLATE] Premier Déploiement Production

**Date** : YYYY-MM-DD
**Version** : 1.0.0
**Type** : Initial
**Environnement** : Production
**Supabase Project Ref** : [à compléter]

#### Checklist Pré-déploiement

- [ ] Backup existant (N/A pour initial)
- [ ] Migrations testées en local
- [ ] Variables d'environnement prêtes
- [ ] Équipe informée

#### Migrations Appliquées

| Migration | Heure | Durée | Statut |
|-----------|-------|-------|--------|
| 00001_initial_schema.sql | HH:MM | Xs | PENDING |
| 00002_rls_policies.sql | HH:MM | Xs | PENDING |
| 00003_storage_buckets.sql | HH:MM | Xs | PENDING |
| 00004_seed_reference_data.sql | HH:MM | Xs | PENDING |

#### Vérifications Post-déploiement

- [ ] Login admin fonctionne
- [ ] Tables de référence remplies
- [ ] CRUD chantiers OK
- [ ] Upload documents OK
- [ ] RLS fonctionne (accès restreints)
- [ ] Soft delete/restauration OK

#### Problèmes Rencontrés

Aucun / Description des problèmes :
-

#### Actions de Rollback

Aucune / Description des actions :
-

#### Notes

-

---

## Templates pour Futurs Déploiements

### Template : Mise à jour Mineure (Patch)

```markdown
### [YYYY-MM-DD] vX.Y.Z - [Titre court]

**Type** : Patch
**Environnement** : Production

#### Migrations
- [ ] NNNNN_description.sql - OK

#### Vérifications
- [ ] Fonctionnalité X testée
- [ ] Pas de régression

#### Notes
-
```

### Template : Mise à jour Feature (Minor)

```markdown
### [YYYY-MM-DD] vX.Y.0 - [Nom de la feature]

**Type** : Minor (nouvelle fonctionnalité)
**Environnement** : Production

#### Nouvelles Fonctionnalités
- Feature 1
- Feature 2

#### Migrations
- [ ] NNNNN_xxx.sql - OK
- [ ] NNNNN_yyy.sql - OK

#### Vérifications
- [ ] Nouvelle feature testée
- [ ] Fonctionnalités existantes OK
- [ ] RLS mis à jour si nécessaire

#### Notes
-
```

### Template : Mise à jour Majeure (Breaking Change)

```markdown
### [YYYY-MM-DD] vX.0.0 - [Nom de la release]

**Type** : MAJOR (breaking changes)
**Environnement** : Production

#### Breaking Changes
- Description des changements qui cassent la compatibilité

#### Plan de Migration
1. Étape 1
2. Étape 2
3. Étape 3

#### Migrations
- [ ] NNNNN_xxx.sql - OK

#### Vérifications Étendues
- [ ] Test complet CRUD
- [ ] Test tous les rôles
- [ ] Test upload/download
- [ ] Test soft delete
- [ ] Performance OK

#### Communication
- [ ] Utilisateurs prévenus
- [ ] Documentation mise à jour

#### Rollback Plan
En cas de problème critique :
1. Action 1
2. Action 2
```

---

## Procédure de Documentation

Après chaque déploiement :

1. Copier le template approprié
2. Remplir toutes les sections
3. Cocher les vérifications effectuées
4. Mettre à jour le tableau de bord en haut
5. Commit le fichier mis à jour

---

## Contacts d'Urgence

| Rôle | Contact |
|------|---------|
| DBA / Supabase | [à compléter] |
| Dev Lead | [à compléter] |
| Ops | [à compléter] |
