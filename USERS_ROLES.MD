# Rôles et Permissions Utilisateurs

Ce document détaille les règles d'accès et les permissions pour chaque rôle utilisateur dans l'application MyDelagrave.

## Synthèse des Permissions

| Role | Niveau | Chantiers (Dashboard) | Contacts | Administration |
|------|--------|-----------------------|----------|----------------|
| **Admin** | 100 | **Voir tout** <br> Créer, Modifier, Supprimer | **Voir tout** <br> Créer, Modifier, Supprimer tout | Gestion des utilisateurs (Tous les rôles) |
| **Superviseur** | 80 | **Voir tout** <br> (Mode supervision) <br> Créer, Modifier | **Voir tout** <br> Créer, Modifier, Supprimer tout | Gestion des utilisateurs (**Uniquement les Poseurs**) |
| **Chargé d'Affaires** | 50 | **Restreint** <br> Uniquement les chantiers assignés <br> Créer, Modifier | **Voir tout** <br> Créer <br> Modifier/Supprimer : **Uniquement ses propres créations** | - |
| **Poseur** | 10 | **Restreint** <br> Uniquement chantiers assignés <br> **Pas de création** | Lecture seule | - |

## Détails techniques

### Règles spécifiques implémentées

#### 1. Visibilité des Chantiers
*   **Admin / Superviseur** : Aucune restriction, accès à la liste complète.
*   **Chargé d'Affaires / Poseur** : Filtrage automatique sur le Dashboard.
    *   Condition : `current_user.id == chantier.charge_affaire_id OR current_user.id == chantier.poseur_id`

#### 2. Gestion des Contacts
*   **Admin / Superviseur** : Accès complet (Lecture, Création, Modification, Suppression de tous les contacts).
*   **Chargé d'Affaires** :
    *   **Lecture** : Voir tous les contacts.
    *   **Création** : Autorisé.
    *   **Modification / Suppression** : Uniquement sur les contacts qu'il a créés (`client.created_by == current_user.id`).
*   **Poseur** : Lecture seule uniquement.

#### 3. Administration
*   **Admin** : Accès complet à la gestion des utilisateurs (création, suspension, modification de tous les rôles).
*   **Superviseur** : Accès à l'administration.
    *   **Gestion** : Peut créer, modifier et suspendre uniquement les **Poseurs**.
    *   **Lecture** : Peut voir les **Chargés d'Affaires** dans la liste (lecture seule).
    *   **Restriction** : Ne voit pas et ne peut pas gérer les Admins.
