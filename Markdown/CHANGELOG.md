# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

## [2.2.2] - 2026-01-08

### Planning par chantier et focus phases

### Améliorations
- 🎨 Réorganisation du planning : une ligne par chantier avec N° AR
- ➕ Ajout chevron expandable pour réduire/développer les chantiers par poseur
- 🔢 Pastille orange avec nombre de chantiers à droite du nom poseur
- ✨ Focus et glowing sur les phases cliquées depuis "À attribuer"
- 🎯 Scroll automatique pour centrer la phase focusée à l'écran

---

## [2.2.1] - 2026-01-06

### Améliorations phases et filtres utilisateurs

### Corrections
- 🐛 Correction du filtre utilisateurs suspendus (utilise `suspended` au lieu de `deleted_at`)
- ✨ Renumérotation chronologique automatique des sous-phases à la fermeture du modal

### Tests
- 🧪 Ajout des `data-testid` pour les tests E2E des phases
- 🧪 Nouveau fichier de test E2E `e2e/phases.spec.ts`

---

## [2.2.0] - 2026-01-06

### Navigation et mise en évidence des phases

### Nouvelles fonctionnalités
- ✨ Navigation entre phases du même chantier avec flèches (◀ ▶)
- ✨ Mise en évidence au clic sur une phase (highlight chantier + focus phase)
- ✨ Double niveau de highlight : phase focalisée (ring-4) vs phases du chantier (ring-2)

### Améliorations
- ⚡ Double-clic pour éditer une phase (remplace le chevron)
- ⚡ Flèches de navigation visibles en vue Hebdo et 3 Semaines
- 🐛 Correction ESLint : non-null assertions dans DraggablePhase et ReservesPage

### Fix
- 🔧 Retrait du bouton FAB du menu mobile

---

## [2.1.0] - 2026-01-06

### Vue Carte Planning Poseur avec Tournée

### Nouvelles fonctionnalités
- ✨ Vue carte du planning mobile avec marqueurs numérotés
- ✨ Calcul d'itinéraire routier via OSRM API
- ✨ Affichage du trajet réel sur les routes (pas en ligne droite)
- ✨ Liste de tournée avec temps/distance entre étapes
- ✨ Géocodage automatique des adresses de livraison

### Améliorations
- ⚡ Carte routière ESRI (style atlas routier)
- ⚡ Mode PWA fullscreen optimisé avec safe-area iOS
- 🐛 Correction décalage de date planning mobile (timezone UTC)

---

## [2.0.0] - 2026-01-06

### 🚀 Application Mobile Poseur (MAJOR RELEASE)

### ⚠️ Breaking Changes
- 🚀 Nouvelle architecture mobile complète avec routes `/m/*` dédiées
- 🚀 Nouvelle table `pointages` pour le suivi temps des poseurs
- 🚀 Extension du type `notes_chantiers` (réserves, rapports journaliers)

### Nouvelles fonctionnalités
- ✨ **9 pages mobiles** : Planning V2, Chantier détail, Pointage, Profil, Réserves, Rapports
- ✨ **5 composants mobiles** : BottomNav, GlassCard, StatusBadge, TimePicker, Layout
- ✨ **Système de pointage** : Chronomètre/manuel, trajets, périodes matin/après-midi
- ✨ **Gestion des réserves** : Création, suivi, résolution depuis mobile
- ✨ **Rapports journaliers** : Saisie terrain avec photos
- ✨ Dossier `public/` pour assets statiques (favicon, icons)

### Technique
- 🔧 Extension `database.types.ts` avec types pointages et notes étendues
- 🔧 Extension `mockData.ts` avec données de démo mobile
- 🔧 Extension `supabase.ts` avec méthodes CRUD pointages
- 🔧 Amélioration CLAUDE.md avec liste tests E2E et documentation ref_tables
- 🔧 Ajout data-testid sur KPICard et ChantierDetail

### Tests
- 🧪 139 tests E2E passent (corrections sélecteurs dashboard, rbac, documents)

---

## [1.4.0] - 2026-01-05

### Sous-phases et Suivi des Heures

### Nouvelles fonctionnalités
- ✨ Système de sous-phases (1.1, 1.2, 1.3...) pour découper les phases principales
- ✨ Budget heures par phase avec jauge de progression (vert/hachuré rouge)
- ✨ Jauge globale chantier = Σ heures sous-phases / Σ budgets phases
- ✨ Affichage arborescent des sous-phases dans panneau "À attribuer"
- ✨ Pages mobiles (pmca/pmpo) pour utilisateurs terrain
- ✨ Simulateur mobile Galaxy (360x800) en mode développement

### Améliorations
- ⚡ Numérotation X.Y sur les phases du planning calendrier
- ⚡ Filtre des phases placeholder (0h) dans le planning
- ⚡ Refonte du modal "Gestion des phases" avec groupes et jauges
- ⚡ Champ "Budget heures" en lecture seule (calculé depuis les phases)

### Technique
- 🔧 Nouveaux champs DB: `groupe_phase`, `heures_budget` (phases_chantiers)
- 🔧 Composants: `PhaseGauge.tsx`, `PhaseGroup.tsx`
- 🔧 Hook: `useMobileMode.ts` pour détection mobile
- 🔧 Layout mobile: `MobileLayout.tsx`

---

## [1.3.0] - 2026-01-05

### Utilisateurs en ligne temps réel

### Nouvelles fonctionnalités
- ✨ Affichage des utilisateurs connectés en temps réel dans la sidebar
- ✨ Badges colorés par rôle (rouge=admin, violet=superviseur, bleu=chargé d'affaires, vert=poseur)
- ✨ Supabase Realtime Presence pour synchronisation multi-appareils (production)
- ✨ BroadcastChannel + localStorage pour synchronisation multi-onglets (dev)
- ✨ Visible uniquement pour superviseurs et admins

### Technique
- 🔧 Hook `usePresence` pour gestion de présence
- 🔧 Composant `OnlineUsers` dans la sidebar
- 🔧 Heartbeat toutes les 10s, timeout 30s

---

## [1.2.2] - 2026-01-05

### Formulaire chantier + Référentiel Rôles

### Améliorations
- 🔧 Champ "Poseur" verrouillé si type = "Fourniture seule"
- 🔧 Table "Rôles" ajoutée dans l'onglet Référentiels (Administration)

---

## [1.2.1] - 2026-01-05

### Ligne "Sans pose" sur le Planning

### Nouvelles fonctionnalités
- ✨ Ligne "Sans pose" (🚚) affiche les chantiers fourniture seule
- ✨ Style orange hachuré distinctif pour les phases fourniture
- ✨ Icône camion sur les phases fourniture seule

### Améliorations
- 🔧 Phases fourniture exclues du panel "À attribuer"

---

## [1.2.0] - 2026-01-05

### Vue Tournée Poseur

### Nouvelles fonctionnalités
- ✨ Clic sur nom poseur ouvre modal tournée hebdomadaire
- ✨ Carte Leaflet avec marqueurs numérotés par ordre chronologique
- ✨ Itinéraires routiers réels via API OSRM
- ✨ Liste étapes avec temps de trajet estimés entre chantiers
- ✨ Sélecteur semaine courante / semaine suivante

### Tests
- ✅ 4 nouveaux tests E2E pour la tournée poseur

---

## [1.1.9] - 2026-01-05

### Fix suppression contacts superviseur

### Corrections
- 🐛 Les superviseurs peuvent maintenant supprimer définitivement les contacts (RLS policy fix)
- 🐛 Amélioration gestion erreurs dans la corbeille

---

## [1.1.8] - 2026-01-05

### Intégration référentiels dans Administration

### Améliorations
- 🔧 Référentiels intégrés dans la page Administration (onglets Utilisateurs/Référentiels)
- 🔧 Suppression de la page RefTablesPage séparée
- 🔧 Déplacement du skill save_context vers .claude/commands/
- 📝 Mise à jour CLAUDE.md avec le nouveau skill

---

## [1.1.7] - 2026-01-05

### Ajout liste contacts chantier expandable

### Nouvelles fonctionnalités
- ✨ Section "Contacts chantier" expandable dans les coordonnées
- ✨ Affichage nom, entreprise, fonction (icône/couleur)
- ✨ Téléphone et email visibles avec icônes

---

## [1.1.6] - 2026-01-05

### Fix KPI Non planifiés

### Corrections
- 🐛 KPI "Non planifiés" compte maintenant les chantiers sans phases (au lieu de vérifier date_debut)

---

## [1.1.5] - 2026-01-05

### Drag & drop images et qualité adaptative

### Nouvelles fonctionnalités
- ✨ Drag & drop pour ajouter des images aux notes
- ✨ Copier/coller (Ctrl+V) pour ajouter des images aux notes
- ✨ Qualité photos adaptative selon l'environnement (Dev: 300px/50%, Prod: 800px/80%)

---

## [1.1.4] - 2026-01-05

### Fix bucket storage Supabase

### Corrections
- 🐛 Corriger casse du bucket 'documents' (minuscule)

---

## [1.1.3] - 2026-01-05

### Améliorations UI et fix storage Supabase

### Corrections
- 🐛 AddressSelectorModal: Touche Entrée pour valider + bouton recherche focus carte
- 🐛 ChantierDetail: Boutons Phases/Contacts déplacés dans header, badge catégorie
- 🐛 Storage: Utiliser createSignedUrl pour buckets privés Supabase
- 🐛 KPI "Non attribués": Filtrer sur poseur_id au lieu de charge_affaire_id

---

## [1.1.2] - 2026-01-05

### Corrections UI - Section Coordonnées Chantier

### Corrections
- 🐛 Ajouter affichage de l'adresse du client principal
- 🐛 Afficher icône Google Maps même sans coordonnées GPS (fallback sur adresse textuelle)

---

## [1.1.1] - 2026-01-04

### Corrections Production Supabase

### Corrections
- 🐛 Fix erreur PostgREST "more than one relationship" (spécifier FK explicite `users!charge_affaire_id`)
- 🐛 Fix sync automatique `auth.users` → `public.users` (trigger + migration initiale)
- 🐛 Fix déconnexion admin lors de création d'utilisateur (restauration session)
- 🐛 LoginPage adaptatif : masquer comptes demo en production

### Migrations
- 📦 `00005_auth_user_sync.sql` : Trigger de synchronisation utilisateurs

---

## [1.1.0] - 2026-01-04

### Infrastructure Production Supabase

### Nouvelles Fonctionnalités
- ✨ Support dual environment (Mock localStorage / Supabase distant)
- ✨ Client factory pour basculer entre dev et production (`VITE_USE_MOCK`)
- ✨ Migrations SQL complètes pour Supabase

### Documentation
- 📚 `DEPLOY_STRATEGY.md` : Guide de déploiement en 4 phases
- 📚 `DEPLOY_HISTORY.md` : Template de suivi des déploiements
- 📚 `.env.example` : Configuration des variables d'environnement

### Technique
- 🔧 Ajout de `@supabase/supabase-js` comme dépendance
- 🔧 4 migrations SQL : schema, RLS, storage buckets, seed data
- 🔧 Politiques RLS par rôle (admin, superviseur, charge_affaire, poseur)
- 🔧 Buckets storage pour documents et photos

---

## [1.0.0] - 2026-01-04 🚀 MAJOR RELEASE

### MyDelagrave Production Ready

Première version stable de production avec toutes les fonctionnalités majeures.

### Fonctionnalités Majeures
- ✨ **Planning complet** avec 5 modes de vue (Hebdo, 3 Sem, Mois, 3 Mois, Année)
- ✨ **Fenêtre Planning externe** multi-écrans sans sidebar
- ✨ **Gestion documentaire** complète (upload, prévisualisation, corbeille)
- ✨ **Système de notes** avec photos et compression automatique
- ✨ **Filtres avancés** Dashboard (Chargé d'affaire, Statut, Poseur)
- ✨ **RBAC complet** (Admin, Superviseur, Chargé d'Affaires, Poseur)
- ✨ **Corbeille** avec soft delete et restauration

### Couverture Tests
- 🧪 117 tests E2E couvrant toutes les fonctionnalités

---

## [0.6.2] - 2026-01-04

### Nouvelles Fonctionnalités
- ✨ Vues Planning 3 Mois et Année ajoutées
- ✨ Bouton pour ouvrir le Planning sur un écran externe (sans sidebar)
- ✨ Affichage de l'année au-dessus des semaines/mois dans l'en-tête Planning

### Corrections
- 🐛 Fix transparence du formulaire d'édition inline des phases

## [0.6.1] - 2026-01-04

### Corrections
- 🐛 Les barres de phase du planning reflètent maintenant précisément les heures de début/fin (ex: 8h-14h = 75% de la colonne au lieu de 100%)

## [0.6.0] - 2026-01-04

### Nouvelles Fonctionnalités
- ✨ Section Documents dans le détail chantier (upload, liste, prévisualisation)
- ✨ Modal d'upload avec drag & drop, 4 types de documents (Plan, Devis, Rapport, Liste réserves)
- ✨ Prévisualisation des images dans une modal dédiée
- ✨ Téléchargement et suppression des documents
- ✨ Intégration des documents dans la corbeille (soft delete + restauration)

### Corrections
- 🐛 Fix parsing des relations Supabase avec virgules dans les parenthèses (uploader name)

### Tests
- 🧪 11 tests E2E pour les documents (107 tests total)

## [0.5.0] - 2026-01-04

### Nouvelles Fonctionnalités
- ✨ Filtres dropdown (Chargé d'affaire, Statut, Poseur) pour admin/superviseur
- ✨ Création `markdown/AGENTS.md` pour instructions agents IA

### Améliorations
- ⚡ Compteur de notes déplacé à côté du titre "(X)"
- ⚡ Centralisation de la documentation dans `markdown/`
- ⚡ Ajout étape de nettoyage aux skills de release
- ⚡ 8 nouveaux tests E2E pour les filtres (96 tests total)

## [0.4.0] - 2026-01-04

### Nouvelles Fonctionnalités
- ✨ Section Informations expandable avec chevron
- ✨ Gestionnaire de notes CRUD (création, édition, suppression)
- ✨ Upload de photos dans les notes (compression automatique)
- ✨ Modale d'affichage des photos en grand
- ✨ Affichage de l'ID chantier dans les cartes

### Améliorations
- ⚡ Workflow QA amélioré avec création automatique de tests E2E
- ⚡ 8 nouveaux tests E2E pour les notes (e2e/notes.spec.ts)
- ⚡ Notes de migration Supabase documentées dans CLAUDE.md

### Corrections
- 🐛 Fix soft delete (`deleted_at: null` vs `undefined`)
- 🐛 Fix relation `creator:users` dans le mock Supabase

## [0.3.1] - 2026-01-04

### Corrections
- Fix affichage loupe dans la barre de recherche contacts
- Support des relations one-to-many dans le mock Supabase (phases_chantiers)
- Ajout bouton "Créer un contact" quand aucun résultat trouvé

### Améliorations
- ChantierCard compact avec badges semaines des phases (S12, S13...)
- Regroupement "Coordonnées chantier" (client + adresse) dans le détail

## [0.3.0] - 2026-01-03

### Nouvelles Fonctionnalités
- Tri des utilisateurs par nom ou rôle dans la page Admin
- Renumérotation automatique des phases par ordre chronologique

## [0.2.0] - 2026-01-03

### Nouvelles Fonctionnalités
- Ajout des attributs data-testid aux composants UI pour les tests E2E
- Correction des warnings ESLint

## [0.1.1] - 2026-01-02

### Corrections
- Corrections mineures

## [0.1.0] - 2026-01-02

### Nouvelles Fonctionnalités
- Implémentation du RBAC (filtrage Dashboard, gestion Contacts restreinte, accès Admin Superviseur)

## [0.0.2] - 2026-01-01

### Améliorations
- Améliorations UI : icônes inline, corrections modales, mises à jour formulaire contact
