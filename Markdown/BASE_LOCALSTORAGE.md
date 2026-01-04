# Documentation de la Base de Données Locale (Local Storage)

Ce document décrit la structure de la base de données simulée (Mock Database) stockée dans le `localStorage` du navigateur. Cette base de données imite la structure de la base Supabase de production.

> **Note :** Ce fichier doit être mis à jour manuellement ou par l'assistant IA si la structure des données change.

## Vue d'ensemble

Le système utilise une implémentation mock (`src/lib/supabase.ts`) qui intercepte les requêtes Supabase et lit/écrit dans le `localStorage` sous le préfixe `mock_db_`.

## Tables

### `users` (Utilisateurs)

Stocke les utilisateurs de l'application.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique de l'utilisateur |
| `email` | String | Email de connexion |
| `first_name` | String | Prénom |
| `last_name` | String | Nom |
| `role` | String | Code du rôle (lié à `ref_roles_user`) |
| `suspended` | Boolean | Si le compte est suspendu |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `clients` (Contacts / Clients)

Stocke les fiches contacts (clients, architectes, etc.).

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `nom` | String | Nom du contact |
| `entreprise` | String | Nom de l'entreprise |
| `email` | String | Email de contact |
| `telephone` | String | Numéro de téléphone |
| `adresse` | String | Adresse postale |
| `batiment` | String | **[NOUVEAU]** Complément d'adresse (Bâtiment, étage...) - *Supporté uniquement en LocalStorage pour l'instant* |
| `job` | String | Code fonction (lié à `ref_job`) |
| `client_categorie` | String | Code catégorie (lié à `ref_clients`) |
| `created_by` | UUID | Lien vers `users` (Créateur du contact) |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `chantiers` (Chantiers)

Stocke les informations principales des chantiers.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `reference` | String | Référence interne (ex: CHU-2026-001) |
| `nom` | String | Nom du chantier |
| `statut` | String | Code statut (lié à `ref_statuts_chantier`) |
| `client_id` | UUID | Lien vers `clients` (Client principal) |
| `charge_affaire_id` | UUID | Lien vers `users` (Chargé d'affaires) |
| `poseur_id` | UUID | Lien vers `users` (Poseur principal) |
| `adresse_livraison` | String | Adresse du chantier |
| `adresse_livraison_latitude` | Number | Latitude GPS |
| `adresse_livraison_longitude` | Number | Longitude GPS |
| `categorie` | String | Code catégorie (lié à `ref_categories_chantier`) |
| `type` | String | Code type (lié à `ref_types_chantier`) |
| `date_debut` | Date (YYYY-MM-DD) | Date de début prévisionnelle |
| `date_fin` | Date (YYYY-MM-DD) | Date de fin prévisionnelle |
| `reserves_levees` | Boolean | État des réserves |
| `doe_fourni` | Boolean | État du DOE |
| `deleted_at` | ISO Date | Date de suppression (Soft delete) |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `phases_chantiers` (Phases / Interventions)

Détaille les phases d'un chantier.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `chantier_id` | UUID | Lien vers `chantiers` |
| `numero_phase` | Number | Ordre de la phase |
| `libelle` | String | Nom de la phase |
| `date_debut` | Date | Date de début |
| `date_fin` | Date | Date de fin |
| `heure_debut` | Time | Heure de début |
| `heure_fin` | Time | Heure de fin |
| `duree_heures` | Number | Durée estimée en heures |
| `poseur_id` | UUID | Lien vers `users` (Poseur assigné à la phase) |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `notes_chantiers` (Notes / Commentaires)

Commentaires et photos liés aux chantiers.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `chantier_id` | UUID | Lien vers `chantiers` |
| `contenu` | Text | Texte de la note |
| `photo_1_url` | String (URL) | URL photo 1 |
| `photo_2_url` | String (URL) | URL photo 2 |
| `created_by` | UUID | Lien vers `users` (Auteur) |
| `deleted_at` | ISO Date | Date de suppression |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `chantiers_contacts` (Contacts secondaires)

Table de liaison pour associer plusieurs contacts à un chantier.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `chantier_id` | UUID | Lien vers `chantiers` |
| `client_id` | UUID | Lien vers `clients` |
| `role` | String | Rôle spécifique sur ce chantier |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

### `documents_chantiers` (Documents)

Documents uploadés liés aux chantiers (ajouté en v0.6.0).

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique |
| `chantier_id` | UUID | Lien vers `chantiers` |
| `type` | String | Code type (lié à `ref_types_document`) |
| `nom` | String | Nom du fichier affiché |
| `description` | Text | Description optionnelle |
| `storage_path` | String | Chemin dans le bucket storage |
| `file_size` | Number | Taille en octets |
| `mime_type` | String | Type MIME (image/jpeg, application/pdf...) |
| `uploaded_by` | UUID | Lien vers `users` (Auteur de l'upload) |
| `deleted_at` | ISO Date | Date de suppression (Soft delete) |
| `created_at` | ISO Date | Date de création |
| `updated_at` | ISO Date | Date de dernière modification |

## Tables de Référence (Enums)

Ces tables définissent les listes de choix dans l'application.

*   **`ref_roles_user`** : Rôles utilisateurs (`admin`, `superviseur`, `charge_affaire`, `poseur`).
*   **`ref_statuts_chantier`** : Statuts de chantier (`nouveau`, `en_cours`, `planifie`, `termine`, etc.).
*   **`ref_categories_chantier`** : Typologie (`labo`, `en`, `hospitalier`, `autres`).
*   **`ref_types_chantier`** : Type de prestation (`fourniture`, `fourniture_pose`).
*   **`ref_clients`** : Catégories de contacts (`contact_client`, `architecte`, `maitre_ouvrage`, etc.).
*   **`ref_job`** : Fonctions/Métiers (`directeur`, `commercial`, `architecte`, etc.).
*   **`ref_types_document`** : Types de documents (`plan`, `devis`, `rapport`, `reserve`).

### `ref_types_document` (Types de documents)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Code unique (plan, devis, rapport, reserve) |
| `libelle` | String | Libellé affiché |
| `icon` | String | Emoji icône |
| `ordre` | Number | Ordre d'affichage |

Valeurs :
| Code | Libellé | Icône |
| :--- | :--- | :--- |
| `plan` | Plan | 📐 |
| `devis` | Devis | 💰 |
| `rapport` | Rapport | 📄 |
| `reserve` | Liste réserves | 📋 |
