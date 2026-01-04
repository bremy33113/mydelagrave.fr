# Stratégie de Déploiement MyDelagrave

Guide complet pour déployer MyDelagrave depuis une base de données Supabase vide jusqu'à la production.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DUAL MODE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DÉVELOPPEMENT (VITE_USE_MOCK=true)                            │
│   ┌─────────────────────────────────────────────┐               │
│   │  MockSupabaseClient (localStorage)          │               │
│   │  - Pas de serveur requis                    │               │
│   │  - Données persistées en local              │               │
│   │  - Reset possible via resetMockDatabase()   │               │
│   └─────────────────────────────────────────────┘               │
│                                                                  │
│   PRODUCTION (VITE_USE_MOCK=false)                              │
│   ┌─────────────────────────────────────────────┐               │
│   │  Supabase Client réel                       │               │
│   │  - PostgreSQL distant                       │               │
│   │  - Auth JWT                                 │               │
│   │  - Storage S3                               │               │
│   │  - RLS (Row Level Security)                 │               │
│   └─────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prérequis

- [ ] Compte Supabase (https://supabase.com)
- [ ] Supabase CLI installé (`npm install -g supabase`)
- [ ] Node.js 18+ et npm
- [ ] Hébergeur web (Netlify, Vercel, ou autre)

---

## Phase 0 : Configuration Supabase

### 0.1 Créer le projet

1. Aller sur https://app.supabase.com
2. Cliquer "New Project"
3. Configurer :
   - **Name** : mydelagrave-prod
   - **Database Password** : (générer un mot de passe fort)
   - **Region** : EU West (Paris) - pour la France
4. Attendre la création (~2 minutes)

### 0.2 Récupérer les credentials

Dans Settings > API :
- **Project URL** : `https://snooemomgthyvrzwqgks.supabase.co`
- **anon public** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNub29lbW9tZ3RoeXZyendxZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDQ0MzgsImV4cCI6MjA4MzEyMDQzOH0.zm7IQvdW_Q6r6alEZoKk52gnEO1XG0gpBRrzQQX36uc` (clé publique pour le client)
- **service_role** :  (clé secrète pour les migrations - NE PAS exposer)

### 0.3 Configurer l'authentification

Dans Authentication > Providers :
1. Activer **Email** (déjà activé par défaut)
2. Dans Settings :
   - **Site URL** : `https://Mydelagrave.fr`
   - **Redirect URLs** : Mydelagrave.fr
   - Désactiver "Confirm email" pour simplifier (optionnel)

### Vérification Phase 0

- [ ] Projet Supabase créé
- [ ] URL et clés notées
- [ ] Auth Email activé

---

## Phase 1 : Déploiement du Schema

### 1.1 Structure des migrations

```
supabase/
└── migrations/
    ├── 00001_initial_schema.sql      # Tables + contraintes
    ├── 00002_rls_policies.sql        # Sécurité par rôle
    ├── 00003_storage_buckets.sql     # Stockage fichiers
    └── 00004_seed_reference_data.sql # Données de référence
```

### 1.2 Appliquer les migrations

**Option A : Via Supabase CLI**
```bash
# Lier le projet
supabase link --project-ref [votre-ref]

# Appliquer toutes les migrations
supabase db push
```

**Option B : Via SQL Editor (Dashboard)**
1. Aller dans SQL Editor
2. Copier/coller chaque fichier dans l'ordre
3. Exécuter chaque migration

### 1.3 Vérifier le schema

```sql
-- Vérifier les versions appliquées
SELECT * FROM schema_version ORDER BY applied_at;

-- Doit afficher :
-- 1.0.0 | Initial schema
-- 1.0.1 | RLS policies
-- 1.0.2 | Storage buckets
-- 1.0.3 | Reference data
```

### Vérification Phase 1

- [ ] Toutes les tables créées (voir Table Editor)
- [ ] schema_version contient 4 entrées
- [ ] RLS activé sur toutes les tables
- [ ] Buckets 'documents' et 'notes-photos' créés

---

## Phase 2 : Création du premier Admin

### 2.1 Créer l'utilisateur via Auth

**Option A : Via Dashboard**
1. Authentication > Users
2. "Add User" > "Create New User"
3. Email : `admin@votre-domaine.fr`
4. Password : (mot de passe fort)
5. Cocher "Auto Confirm User"

**Option B : Via l'application**
1. Déployer l'app en mode mock d'abord
2. Se connecter et créer l'admin
3. Exporter les données

### 2.2 Attribuer le rôle admin

```sql
-- Récupérer l'ID de l'utilisateur créé
SELECT id FROM auth.users WHERE email = 'admin@votre-domaine.fr';

-- Mettre à jour son rôle
UPDATE users
SET role = 'admin'
WHERE id = '[uuid-de-auth.users]';
```

### 2.3 Vérifier les données de référence

```sql
-- Vérifier que toutes les tables ref_* sont remplies
SELECT 'ref_roles_user' as tbl, COUNT(*) FROM ref_roles_user
UNION ALL
SELECT 'ref_statuts_chantier', COUNT(*) FROM ref_statuts_chantier
UNION ALL
SELECT 'ref_categories_chantier', COUNT(*) FROM ref_categories_chantier
UNION ALL
SELECT 'ref_types_chantier', COUNT(*) FROM ref_types_chantier
UNION ALL
SELECT 'ref_clients', COUNT(*) FROM ref_clients
UNION ALL
SELECT 'ref_job', COUNT(*) FROM ref_job
UNION ALL
SELECT 'ref_types_document', COUNT(*) FROM ref_types_document;
```

### Vérification Phase 2

- [ ] Admin créé dans auth.users
- [ ] Entrée correspondante dans users avec role='admin'
- [ ] Toutes les tables ref_* ont des données

---

## Phase 3 : Déploiement de l'Application

### 3.1 Configuration des variables d'environnement

Créer `.env.production` à la racine :
```env
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...votre-clé-anon...
```

### 3.2 Build de production

```bash
# Build avec les variables de production
npm run build

# Le dossier dist/ contient l'application
```

### 3.3 Déploiement sur l'hébergeur

**Netlify :**
```bash
# Via Netlify CLI
netlify deploy --prod --dir=dist

# Ou via le dashboard : drag & drop du dossier dist/
```

**Vercel :**
```bash
vercel --prod
```

**Autre hébergeur statique :**
- Copier le contenu de `dist/` sur le serveur
- Configurer les redirections SPA (toutes les routes vers index.html)

### 3.4 Variables d'environnement sur l'hébergeur

Configurer dans le dashboard de l'hébergeur :
- `VITE_USE_MOCK` = `false`
- `VITE_SUPABASE_URL` = `https://[ref].supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJ...`

### Vérification Phase 3

- [ ] Build réussi sans erreurs
- [ ] Application déployée et accessible
- [ ] Variables d'environnement configurées
- [ ] Console affiche "Mode production (Supabase)"

---

## Phase 4 : Validation

### 4.1 Tests fonctionnels

| Test | Action | Résultat attendu |
|------|--------|------------------|
| Login | Se connecter avec admin | Dashboard affiché |
| CRUD Chantier | Créer un chantier | Chantier visible dans la liste |
| Upload Document | Uploader un PDF | Fichier visible dans Documents |
| Notes | Créer une note | Note affichée dans Informations |
| RBAC | Créer un poseur, se connecter | Accès limité confirmé |
| Soft Delete | Supprimer un chantier | Visible dans Corbeille |
| Restauration | Restaurer depuis Corbeille | Chantier réapparaît |

### 4.2 Tests de sécurité RLS

```sql
-- Tester en tant qu'utilisateur anonyme (doit échouer)
SET request.jwt.claims = '{}';
SELECT * FROM chantiers; -- Devrait retourner 0 rows

-- Tester en tant qu'admin
SET request.jwt.claims = '{"sub": "[admin-uuid]"}';
SELECT * FROM chantiers; -- Devrait retourner tous les chantiers
```

### 4.3 Monitoring

Dans Supabase Dashboard :
- **Database > Logs** : Vérifier les requêtes
- **Storage > Logs** : Vérifier les uploads
- **Auth > Logs** : Vérifier les connexions

### Vérification Phase 4

- [ ] Tous les tests fonctionnels passent
- [ ] RLS bloque les accès non autorisés
- [ ] Aucune erreur dans les logs

---

## Mises à jour Non-Destructives

### Règles d'or

| Action | Pattern SQL | Exemple |
|--------|-------------|---------|
| Nouvelle table | `CREATE TABLE IF NOT EXISTS` | Sûr |
| Nouvelle colonne | `ALTER TABLE ADD COLUMN IF NOT EXISTS` | Sûr |
| Nouvelle donnée ref | `INSERT ... ON CONFLICT DO UPDATE` | Sûr |
| Modifier colonne | `ALTER COLUMN ... TYPE` | ⚠️ Tester d'abord |
| Supprimer colonne | **INTERDIT** | Déprécier, puis supprimer après 3 versions |
| Renommer colonne | **INTERDIT** | Créer nouvelle + migrer + alias |

### Processus de mise à jour

1. **Créer une nouvelle migration** : `supabase/migrations/00005_xxx.sql`
2. **Tester sur staging** avant production
3. **Appliquer en production** via `supabase db push`
4. **Documenter** dans DEPLOY_HISTORY.md

### Exemple : Ajouter une colonne

```sql
-- 00005_add_chantier_priority.sql
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Rétrocompatibilité : la colonne a une valeur par défaut
-- Les anciennes versions de l'app ignoreront cette colonne

INSERT INTO schema_version (version, description)
VALUES ('1.1.0', 'Add priority column to chantiers')
ON CONFLICT (version) DO NOTHING;
```

---

## Rollback

### Si problème critique

1. **Revenir en mode mock** (temporaire)
   - Modifier `VITE_USE_MOCK=true` sur l'hébergeur
   - Redéployer

2. **Corriger le problème**
   - Identifier via les logs Supabase
   - Appliquer le fix en local
   - Tester

3. **Redéployer en production**
   - `VITE_USE_MOCK=false`
   - Redéployer

### Rollback de migration SQL

```sql
-- Si une migration a causé des problèmes, créer une migration inverse
-- 00006_rollback_00005.sql

ALTER TABLE chantiers DROP COLUMN IF EXISTS priority;

DELETE FROM schema_version WHERE version = '1.1.0';
```

---

## Checklist de Déploiement

### Premier déploiement

- [ ] Phase 0 : Projet Supabase créé et configuré
- [ ] Phase 1 : 4 migrations appliquées
- [ ] Phase 2 : Admin créé et configuré
- [ ] Phase 3 : App buildée et déployée
- [ ] Phase 4 : Tests validés

### Mises à jour

- [ ] Nouvelle migration créée
- [ ] Testée en local (mock)
- [ ] Appliquée sur staging (si disponible)
- [ ] Appliquée en production
- [ ] DEPLOY_HISTORY.md mis à jour
- [ ] Tests de non-régression passés

---

## Problèmes Connus et Solutions

### Erreur : "more than one relationship was found"

**Symptôme** : Erreur PostgREST lors du chargement du dashboard.

**Cause** : La table `chantiers` a deux FK vers `users` (`charge_affaire_id` et `poseur_id`). PostgREST ne sait pas laquelle utiliser.

**Solution** : Spécifier explicitement la FK dans les requêtes :
```typescript
// ❌ Incorrect
.select('*, charge_affaire:users(*)')

// ✅ Correct
.select('*, charge_affaire:users!charge_affaire_id(*)')
```

---

### Erreur : Menu Planning/Admin invisible après login

**Symptôme** : L'utilisateur se connecte mais ne voit pas tous les menus.

**Cause** : L'utilisateur existe dans `auth.users` mais pas dans `public.users` (table des rôles).

**Solution** : Appliquer la migration `00005_auth_user_sync.sql` qui :
1. Crée un trigger pour sync automatique `auth.users` → `public.users`
2. Synchronise les utilisateurs existants

```sql
-- Vérifier la sync
SELECT au.email, pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;
```

---

### Erreur : Déconnexion lors de création d'utilisateur (admin)

**Symptôme** : L'admin crée un utilisateur et se retrouve déconnecté.

**Cause** : `supabase.auth.signUp()` connecte automatiquement le nouvel utilisateur.

**Solution** : Sauvegarder et restaurer la session admin :
```typescript
// Avant signUp
const { data } = await supabase.auth.getSession();
const adminSession = data?.session;

// Après signUp
if (adminSession) {
    await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
    });
}
```

---

### Erreur : Comptes demo visibles en production

**Symptôme** : La page login affiche les comptes de démonstration en production.

**Solution** : Utiliser `isUsingMock` pour conditionner l'affichage :
```typescript
import { isUsingMock } from '../lib/supabase';

{isUsingMock && (
    <div>Comptes de démonstration...</div>
)}
```

---

## Contacts & Support

- **Supabase Documentation** : https://supabase.com/docs
- **Supabase Discord** : https://discord.supabase.com
- **Issues MyDelagrave** : Contacter l'équipe de développement
