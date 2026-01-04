# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

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
