# Contexte de travail - 2026-01-04

## État Git
- **Branche** : dev
- **Version** : 1.1.2
- **État** : 1 commit non pushé

## Derniers commits
```
7b675f8 feat: Ajouter skill /save-context
553f755 fix: Retirer filtre deleted_at sur clients
eba6c9c fix: Retirer deleted_at de l'insert clients
634d10e fix: Détecter rejet silencieux RLS
4950832 fix: Gestion erreurs création contact
f416414 docs: Mise à jour documentation v1.1.1
80be848 fix: Conserver session admin création utilisateur
0a94e2d feat: Sync auth.users → public.users
3f697bb fix: FK explicite users dans chantiers
d260c93 feat: LoginPage adaptatif dev/prod
```

## Session actuelle - Résumé

### Problèmes résolus aujourd'hui
1. **PostgREST "more than one relationship"** - Spécifier FK explicite `users!charge_affaire_id`
2. **Menu Planning/Admin invisible** - Sync `auth.users` → `public.users` via trigger
3. **Déconnexion admin lors création user** - Restaurer session après signUp
4. **Création contact bloquée** - Colonne `deleted_at` inexistante sur `clients`
5. **Contacts non affichés** - Filtre `deleted_at` sur table sans cette colonne

### Tables avec soft delete (deleted_at)
- ✅ `chantiers`
- ✅ `notes_chantiers`
- ✅ `documents_chantiers`

### Tables SANS soft delete
- ❌ `clients`
- ❌ `users`
- ❌ `phases_chantiers`
- ❌ `chantiers_contacts`
- ❌ Tables `ref_*`

## Tâches en attente
1. **Audit complet** - Vérifier autres utilisations de `deleted_at` sur mauvaises tables
2. **Types Supabase générés** - `npm run types:generate` pour validation compile-time
3. **Push des commits** - `git push origin dev && git push origin dev:main`

## Fichiers clés modifiés
- `src/pages/ContactsPage.tsx` - Retrait filtre deleted_at
- `src/components/chantiers/CreateContactModal.tsx` - Retrait deleted_at insert + error handling
- `src/pages/AdminPage.tsx` - Restauration session admin
- `src/pages/DashboardPage.tsx` - FK explicite users
- `supabase/migrations/00005_auth_user_sync.sql` - Trigger sync users

## Pour reprendre
```bash
# Lire ce fichier
# Puis continuer avec l'audit des colonnes deleted_at
grep -r "deleted_at" src/
```
