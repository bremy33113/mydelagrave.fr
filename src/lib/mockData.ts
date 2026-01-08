// Données initiales pour le système de mock
// Ces données sont chargées au premier lancement de l'application

import type { Tables } from './database.types';

// ============ TABLES DE RÉFÉRENCE ============

export const ref_roles_user: Tables<'ref_roles_user'>[] = [
    { code: 'admin', label: 'Administrateur', level: 100, description: 'Accès complet à toutes les fonctionnalités' },
    { code: 'superviseur', label: 'Superviseur', level: 80, description: 'Supervision des chantiers et poseurs' },
    { code: 'charge_affaire', label: "Chargé d'Affaires", level: 50, description: 'Gestion de ses propres chantiers' },
    { code: 'poseur', label: 'Poseur', level: 10, description: 'Consultation des phases assignées' },
];

export const ref_statuts_chantier: Tables<'ref_statuts_chantier'>[] = [
    { code: 'nouveau', label: 'Nouveau', icon: '🆕', color: '#3B82F6' },
    { code: 'en_cours', label: 'En cours', icon: '🔄', color: '#F59E0B' },
    { code: 'planifie', label: 'Planifié', icon: '📅', color: '#8B5CF6' },
    { code: 'pose_en_cours', label: 'Pose en cours', icon: '🔨', color: '#EC4899' },
    { code: 'a_terminer', label: 'À terminer', icon: '⏳', color: '#F97316' },
    { code: 'termine', label: 'Terminé', icon: '✅', color: '#10B981' },
];

export const ref_categories_chantier: Tables<'ref_categories_chantier'>[] = [
    { code: 'labo', label: 'Laboratoire', icon: '🔬' },
    { code: 'en', label: 'Enseignement', icon: '🎓' },
    { code: 'hospitalier', label: 'Hospitalier', icon: '🏥' },
    { code: 'autres', label: 'Autres', icon: '📦' },
];

export const ref_types_chantier: Tables<'ref_types_chantier'>[] = [
    { code: 'fourniture', label: 'Fourniture seule' },
    { code: 'fourniture_pose', label: 'Fourniture et pose' },
];

export const ref_clients: Tables<'ref_clients'>[] = [
    { code: 'contact_client', label: 'Contact client', icon: '👤', color: '#3B82F6' },
    { code: 'contact_chantier', label: 'Contact chantier', icon: '🏗️', color: '#10B981' },
    { code: 'architecte', label: 'Architecte', icon: '📐', color: '#8B5CF6' },
    { code: 'maitre_ouvrage', label: "Maître d'ouvrage", icon: '🏛️', color: '#F59E0B' },
    { code: 'entreprise_generale', label: 'Entreprise générale', icon: '🏢', color: '#EC4899' },
];

export const ref_job: Tables<'ref_job'>[] = [
    { code: 'directeur', label: 'Directeur', icon: '👔', color: '#1E40AF' },
    { code: 'commercial', label: 'Commercial', icon: '💼', color: '#047857' },
    { code: 'conducteur_travaux', label: 'Conducteur de travaux', icon: '👷', color: '#B45309' },
    { code: 'architecte', label: 'Architecte', icon: '📐', color: '#7C3AED' },
    { code: 'technicien', label: 'Technicien', icon: '🔧', color: '#0891B2' },
    { code: 'responsable_achats', label: 'Responsable achats', icon: '📋', color: '#BE185D' },
    { code: 'autre', label: 'Autre', icon: '👤', color: '#64748B' },
];

export const ref_types_document: Tables<'ref_types_document'>[] = [
    { id: 'plan', libelle: 'Plan', icon: '📐', ordre: 1 },
    { id: 'devis', libelle: 'Devis', icon: '💰', ordre: 2 },
    { id: 'rapport', libelle: 'Rapport', icon: '📄', ordre: 3 },
    { id: 'reserve', libelle: 'Liste réserves', icon: '📋', ordre: 4 },
    { id: 'feuille_pointage', libelle: 'Feuille de pointage', icon: '⏱️', ordre: 5 },
];

// ============ DONNÉES DE DÉMO ============

// Mots de passe en clair pour le mock (en prod, hashés par Supabase)
export const mockPasswords: Record<string, string> = {
    'admin@delagrave.fr': 'admin123',
    'jean.dupont@delagrave.fr': 'password123',
    'marie.martin@delagrave.fr': 'password123',
    'pierre.durand@delagrave.fr': 'password123',
};

export const initial_users: Tables<'users'>[] = [
    {
        id: 'admin-uuid-001',
        email: 'admin@delagrave.fr',
        first_name: 'Admin',
        last_name: 'Système',
        role: 'admin',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'ca-uuid-001',
        email: 'jean.dupont@delagrave.fr',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'charge_affaire',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'ca-uuid-002',
        email: 'sophie.lambert@delagrave.fr',
        first_name: 'Sophie',
        last_name: 'Lambert',
        role: 'charge_affaire',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'sup-uuid-001',
        email: 'marie.martin@delagrave.fr',
        first_name: 'Marie',
        last_name: 'Martin',
        role: 'superviseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'poseur-uuid-001',
        email: 'pierre.durand@delagrave.fr',
        first_name: 'Pierre',
        last_name: 'Durand',
        role: 'poseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'poseur-uuid-002',
        email: 'lucas.bernard@delagrave.fr',
        first_name: 'Lucas',
        last_name: 'Bernard',
        role: 'poseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'poseur-uuid-003',
        email: 'thomas.petit@delagrave.fr',
        first_name: 'Thomas',
        last_name: 'Petit',
        role: 'poseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'poseur-uuid-004',
        email: 'antoine.moreau@delagrave.fr',
        first_name: 'Antoine',
        last_name: 'Moreau',
        role: 'poseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 'poseur-uuid-005',
        email: 'nicolas.roux@delagrave.fr',
        first_name: 'Nicolas',
        last_name: 'Roux',
        role: 'poseur',
        suspended: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
];

// Mots de passe additionnels
Object.assign(mockPasswords, {
    'sophie.lambert@delagrave.fr': 'password123',
    'lucas.bernard@delagrave.fr': 'password123',
    'thomas.petit@delagrave.fr': 'password123',
    'antoine.moreau@delagrave.fr': 'password123',
    'nicolas.roux@delagrave.fr': 'password123',
});

export const initial_clients: Tables<'clients'>[] = [
    {
        id: 'client-001',
        nom: 'Dr. Sophie Bernard',
        email: 'sophie.bernard@chu-nantes.fr',
        telephone: '02 40 08 33 33',
        adresse: '1 Place Alexis-Ricordeau, 44093 Nantes',
        batiment: null,
        entreprise: 'CHU de Nantes',
        job: 'directeur',
        client_categorie: 'contact_client',
        created_by: null,
        deleted_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
    },
    {
        id: 'client-002',
        nom: 'Marc Lefevre',
        email: 'marc.lefevre@archistudio.fr',
        telephone: '02 41 22 33 44',
        adresse: '15 Rue de la Paix, 49000 Angers',
        batiment: null,
        entreprise: 'ArchiStudio',
        job: 'architecte',
        client_categorie: 'architecte',
        created_by: null,
        deleted_at: null,
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-01T09:00:00Z',
    },
    {
        id: 'client-003',
        nom: 'Antoine Moreau',
        email: 'a.moreau@batipro.fr',
        telephone: '02 51 44 55 66',
        adresse: '8 Boulevard des Industries, 44600 Saint-Nazaire',
        batiment: null,
        entreprise: 'BatiPro',
        job: 'conducteur_travaux',
        client_categorie: 'entreprise_generale',
        created_by: null,
        deleted_at: null,
        created_at: '2024-02-10T14:00:00Z',
        updated_at: '2024-02-10T14:00:00Z',
    },
];

export const initial_chantiers: Tables<'chantiers'>[] = [
    {
        id: 'chantier-001',
        reference: 'CHU-2026-001',
        nom: 'Laboratoire CHU Nantes',
        adresse_livraison: '1 Place Alexis-Ricordeau, 44093 Nantes',
        adresse_livraison_latitude: 47.2184,
        adresse_livraison_longitude: -1.5536,
        client_id: 'client-001',
        charge_affaire_id: 'ca-uuid-001',
        poseur_id: 'poseur-uuid-001',
        statut: 'en_cours',
        categorie: 'labo',
        type: 'fourniture_pose',
        date_debut: '2026-01-05',
        date_fin: '2026-02-28',
        reserves_levees: false,
        doe_fourni: false,
        heures_allouees: 140,
        budget_heures: 160,
        deleted_at: null,
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z',
    },
    {
        id: 'chantier-002',
        reference: 'UNIV-2026-002',
        nom: 'Extension Université Angers',
        adresse_livraison: '2 Boulevard Lavoisier, 49045 Angers',
        adresse_livraison_latitude: 47.4784,
        adresse_livraison_longitude: -0.5632,
        client_id: 'client-002',
        charge_affaire_id: 'ca-uuid-001',
        poseur_id: null,
        statut: 'nouveau',
        categorie: 'en',
        type: 'fourniture_pose',
        date_debut: null,
        date_fin: null,
        reserves_levees: false,
        doe_fourni: false,
        heures_allouees: null,
        budget_heures: null,
        deleted_at: null,
        created_at: '2024-12-20T11:00:00Z',
        updated_at: '2024-12-20T11:00:00Z',
    },
    {
        id: 'chantier-003',
        reference: 'BATI-2026-003',
        nom: 'Rénovation Clinique Saint-Nazaire',
        adresse_livraison: '8 Boulevard des Industries, 44600 Saint-Nazaire',
        adresse_livraison_latitude: 47.2737,
        adresse_livraison_longitude: -2.2139,
        client_id: 'client-003',
        charge_affaire_id: null,
        poseur_id: null,
        statut: 'nouveau',
        categorie: 'hospitalier',
        type: 'fourniture',
        date_debut: null,
        date_fin: null,
        reserves_levees: false,
        doe_fourni: false,
        heures_allouees: null,
        budget_heures: null,
        deleted_at: null,
        created_at: '2024-12-25T09:00:00Z',
        updated_at: '2024-12-25T09:00:00Z',
    },
    {
        id: 'chantier-004',
        reference: 'TECH-2025-010',
        nom: 'Laboratoire Recherche Rennes',
        adresse_livraison: '263 Avenue du Général Leclerc, 35042 Rennes',
        adresse_livraison_latitude: 48.1173,
        adresse_livraison_longitude: -1.6778,
        client_id: 'client-001',
        charge_affaire_id: 'ca-uuid-001',
        poseur_id: 'poseur-uuid-001',
        statut: 'termine',
        categorie: 'labo',
        type: 'fourniture_pose',
        date_debut: '2025-06-01',
        date_fin: '2025-09-30',
        reserves_levees: true,
        doe_fourni: true,
        heures_allouees: 80,
        budget_heures: 100,
        deleted_at: null,
        created_at: '2025-03-01T10:00:00Z',
        updated_at: '2025-10-15T16:00:00Z',
    },
];

export const initial_phases_chantiers: Tables<'phases_chantiers'>[] = [
    {
        id: 'phase-000',
        chantier_id: 'chantier-001',
        groupe_phase: 1,
        numero_phase: 1,
        libelle: 'Réception matériel',
        heures_budget: 20,
        date_debut: '2026-01-05',
        date_fin: '2026-01-05',
        heure_debut: '08:00:00',
        duree_heures: 4,
        heure_fin: '12:00:00',
        poseur_id: 'poseur-uuid-001',
        created_at: '2024-12-15T14:00:00Z',
        updated_at: '2024-12-15T14:00:00Z',
    },
    {
        id: 'phase-001',
        chantier_id: 'chantier-001',
        groupe_phase: 1,
        numero_phase: 2,
        libelle: 'Préparation du site',
        heures_budget: 120,
        date_debut: '2026-01-06',
        date_fin: '2026-01-06',
        heure_debut: '08:00:00',
        duree_heures: 8,
        heure_fin: '17:00:00',
        poseur_id: 'poseur-uuid-001',
        created_at: '2024-12-15T14:00:00Z',
        updated_at: '2024-12-15T14:00:00Z',
    },
    {
        id: 'phase-001b',
        chantier_id: 'chantier-001',
        groupe_phase: 1,
        numero_phase: 2,
        libelle: 'Préparation suite',
        heures_budget: null,
        date_debut: '2026-01-07',
        date_fin: '2026-01-07',
        heure_debut: '08:00:00',
        duree_heures: 8,
        heure_fin: '17:00:00',
        poseur_id: 'poseur-uuid-001',
        created_at: '2024-12-15T14:00:00Z',
        updated_at: '2024-12-15T14:00:00Z',
    },
    {
        id: 'phase-002',
        chantier_id: 'chantier-001',
        groupe_phase: 2,
        numero_phase: 1,
        libelle: 'Installation mobilier',
        heures_budget: 40,
        date_debut: '2026-01-08',
        date_fin: '2026-01-10',
        heure_debut: '08:00:00',
        duree_heures: 24,
        heure_fin: '17:00:00',
        poseur_id: 'poseur-uuid-001',
        created_at: '2024-12-15T14:30:00Z',
        updated_at: '2024-12-15T14:30:00Z',
    },
    {
        id: 'phase-003',
        chantier_id: 'chantier-001',
        groupe_phase: 2,
        numero_phase: 1,
        libelle: 'Finitions et nettoyage',
        heures_budget: 20,
        date_debut: '2026-02-01',
        date_fin: '2026-02-03',
        heure_debut: '08:00:00',
        duree_heures: 16,
        heure_fin: '17:00:00',
        poseur_id: null,
        created_at: '2024-12-15T15:00:00Z',
        updated_at: '2024-12-15T15:00:00Z',
    },
];

export const initial_notes_chantiers: Tables<'notes_chantiers'>[] = [
    // Notes standard
    {
        id: 'note-001',
        chantier_id: 'chantier-001',
        type: 'note',
        contenu: 'Première visite effectuée. RDV prévu avec le client pour valider les plans finaux le 10/01.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        localisation: null,
        statut_reserve: null,
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2024-12-10T09:00:00Z',
        updated_at: '2024-12-10T09:00:00Z',
    },
    {
        id: 'note-002',
        chantier_id: 'chantier-001',
        type: 'note',
        contenu: 'Plans validés par le client. Commande des matériaux lancée.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        localisation: null,
        statut_reserve: null,
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2024-12-12T14:00:00Z',
        updated_at: '2024-12-12T14:00:00Z',
    },
    // Réserves - Chantier 001 (CHU Nantes)
    {
        id: 'reserve-001',
        chantier_id: 'chantier-001',
        type: 'reserve',
        contenu: 'Rayure visible sur le comptoir arrière gauche. Semble provenir du déplacement du mobilier.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Accueil',
        statut_reserve: 'ouverte',
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-05T15:30:00Z',
        updated_at: '2026-01-05T15:30:00Z',
    },
    {
        id: 'reserve-002',
        chantier_id: 'chantier-001',
        type: 'reserve',
        contenu: 'Manque cache goulotte électrique sous le bureau principal.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Bureau 102',
        statut_reserve: 'ouverte',
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-05T16:00:00Z',
        updated_at: '2026-01-05T16:00:00Z',
    },
    {
        id: 'reserve-003',
        chantier_id: 'chantier-001',
        type: 'reserve',
        contenu: 'Éclat sur le plan de travail côté fenêtre. Impact visible de 2cm.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Laboratoire principal',
        statut_reserve: 'en_cours',
        traite_par: 'sup-uuid-001',
        date_traitement: '2026-01-06T09:00:00Z',
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-05T16:30:00Z',
        updated_at: '2026-01-06T09:00:00Z',
    },
    {
        id: 'reserve-004',
        chantier_id: 'chantier-001',
        type: 'reserve',
        contenu: 'Tiroir du meuble bas bloqué. Problème de glissière.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Salle de préparation',
        statut_reserve: 'levee',
        traite_par: 'ca-uuid-001',
        date_traitement: '2026-01-04T14:00:00Z',
        date_resolution: '2026-01-05T10:00:00Z',
        commentaire_resolution: 'Glissière remplacée.',
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-04T11:00:00Z',
        updated_at: '2026-01-05T10:00:00Z',
    },
    // Réserves - Chantier 002 (Université Angers)
    {
        id: 'reserve-005',
        chantier_id: 'chantier-002',
        type: 'reserve',
        contenu: 'Panneau latéral légèrement voilé sur le bureau professeur.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        localisation: 'Amphithéâtre A',
        statut_reserve: 'ouverte',
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-04T10:00:00Z',
        updated_at: '2026-01-04T10:00:00Z',
    },
    {
        id: 'reserve-006',
        chantier_id: 'chantier-002',
        type: 'reserve',
        contenu: 'Différence de teinte entre les étagères livrées.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        localisation: 'Bibliothèque',
        statut_reserve: 'rejetee',
        traite_par: 'sup-uuid-001',
        date_traitement: '2026-01-03T11:00:00Z',
        date_resolution: '2026-01-03T14:00:00Z',
        commentaire_resolution: 'Variation normale du bois naturel, conforme aux échantillons validés.',
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-02T16:00:00Z',
        updated_at: '2026-01-03T14:00:00Z',
    },
    // Réserves - Chantier 003 (Clinique Saint-Nazaire)
    {
        id: 'reserve-007',
        chantier_id: 'chantier-003',
        type: 'reserve',
        contenu: 'Poignée de porte desserrée sur le meuble pharmacie.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Pharmacie centrale',
        statut_reserve: 'en_cours',
        traite_par: 'ca-uuid-001',
        date_traitement: '2026-01-05T15:00:00Z',
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-05T09:00:00Z',
        updated_at: '2026-01-05T15:00:00Z',
    },
    {
        id: 'reserve-008',
        chantier_id: 'chantier-003',
        type: 'reserve',
        contenu: 'Éclairage LED du meuble vitrine ne fonctionne pas.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Hall d\'accueil',
        statut_reserve: 'ouverte',
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2026-01-06T08:30:00Z',
        updated_at: '2026-01-06T08:30:00Z',
    },
    // Réserves - Chantier 004 (Laboratoire Rennes - terminé)
    {
        id: 'reserve-009',
        chantier_id: 'chantier-004',
        type: 'reserve',
        contenu: 'Porte du local technique mal ajustée.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        localisation: 'Local technique',
        statut_reserve: 'levee',
        traite_par: 'sup-uuid-001',
        date_traitement: '2025-09-20T10:00:00Z',
        date_resolution: '2025-09-25T14:00:00Z',
        commentaire_resolution: 'Porte réajustée par le menuisier.',
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2025-09-15T11:00:00Z',
        updated_at: '2025-09-25T14:00:00Z',
    },
    {
        id: 'reserve-010',
        chantier_id: 'chantier-004',
        type: 'reserve',
        contenu: 'Trou de fixation mal positionné sur le plan de travail.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: 'Salle d\'analyse',
        statut_reserve: 'levee',
        traite_par: 'ca-uuid-001',
        date_traitement: '2025-09-18T09:00:00Z',
        date_resolution: '2025-09-22T16:00:00Z',
        commentaire_resolution: 'Nouveau plan de travail posé.',
        phase_id: null,
        heure_arrivee: null,
        heure_depart: null,
        deleted_at: null,
        created_at: '2025-09-17T14:00:00Z',
        updated_at: '2025-09-22T16:00:00Z',
    },
    // Rapports journaliers
    {
        id: 'rapport-001',
        chantier_id: 'chantier-001',
        type: 'rapport',
        contenu: 'Installation des paillasses du laboratoire principal. Raccordement fluides en cours.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'poseur-uuid-001',
        localisation: null,
        statut_reserve: null,
        traite_par: null,
        date_traitement: null,
        date_resolution: null,
        commentaire_resolution: null,
        phase_id: 'phase-001',
        heure_arrivee: '08:00',
        heure_depart: '17:00',
        deleted_at: null,
        created_at: '2026-01-05T17:30:00Z',
        updated_at: '2026-01-05T17:30:00Z',
    },
];

export const initial_chantiers_contacts: Tables<'chantiers_contacts'>[] = [
    {
        id: 'cc-001',
        chantier_id: 'chantier-001',
        client_id: 'client-001',
        role: 'Client principal',
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-01T10:00:00Z',
    },
    {
        id: 'cc-002',
        chantier_id: 'chantier-002',
        client_id: 'client-002',
        role: 'Architecte',
        created_at: '2024-12-20T11:00:00Z',
        updated_at: '2024-12-20T11:00:00Z',
    },
];

export const initial_documents_chantiers: Tables<'documents_chantiers'>[] = [];

export const initial_pointages: Tables<'pointages'>[] = [
    // Lundi 6 janvier 2026 - Pierre Durand
    {
        id: 'pointage-001',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-06',
        periode: 'matin',
        type: 'trajet',
        heure_debut: '07:15',
        heure_fin: '08:00',
        duree_minutes: 45,
        mode_saisie: 'chrono',
        type_trajet: 'domicile_chantier',
        created_at: '2026-01-06T08:00:00Z',
        updated_at: '2026-01-06T08:00:00Z',
    },
    {
        id: 'pointage-002',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-06',
        periode: 'matin',
        type: 'travail',
        heure_debut: '08:00',
        heure_fin: '12:00',
        duree_minutes: 240,
        mode_saisie: 'chrono',
        type_trajet: null,
        created_at: '2026-01-06T12:00:00Z',
        updated_at: '2026-01-06T12:00:00Z',
    },
    {
        id: 'pointage-003',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-06',
        periode: 'apres_midi',
        type: 'travail',
        heure_debut: '13:00',
        heure_fin: '17:00',
        duree_minutes: 240,
        mode_saisie: 'chrono',
        type_trajet: null,
        created_at: '2026-01-06T17:00:00Z',
        updated_at: '2026-01-06T17:00:00Z',
    },
    {
        id: 'pointage-004',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-06',
        periode: 'apres_midi',
        type: 'trajet',
        heure_debut: '17:00',
        heure_fin: '17:45',
        duree_minutes: 45,
        mode_saisie: 'chrono',
        type_trajet: 'chantier_domicile',
        created_at: '2026-01-06T17:45:00Z',
        updated_at: '2026-01-06T17:45:00Z',
    },
    // Mardi 7 janvier 2026 - Pierre Durand (2 chantiers)
    {
        id: 'pointage-005',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-07',
        periode: 'matin',
        type: 'trajet',
        heure_debut: '07:00',
        heure_fin: '07:45',
        duree_minutes: 45,
        mode_saisie: 'manuel',
        type_trajet: 'domicile_chantier',
        created_at: '2026-01-07T18:00:00Z',
        updated_at: '2026-01-07T18:00:00Z',
    },
    {
        id: 'pointage-006',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-001',
        date: '2026-01-07',
        periode: 'matin',
        type: 'travail',
        heure_debut: '08:00',
        heure_fin: '12:00',
        duree_minutes: 240,
        mode_saisie: 'manuel',
        type_trajet: null,
        created_at: '2026-01-07T18:00:00Z',
        updated_at: '2026-01-07T18:00:00Z',
    },
    {
        id: 'pointage-007',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-004',
        date: '2026-01-07',
        periode: 'apres_midi',
        type: 'trajet',
        heure_debut: '12:30',
        heure_fin: '13:00',
        duree_minutes: 30,
        mode_saisie: 'manuel',
        type_trajet: 'entre_chantiers',
        created_at: '2026-01-07T18:00:00Z',
        updated_at: '2026-01-07T18:00:00Z',
    },
    {
        id: 'pointage-008',
        poseur_id: 'poseur-uuid-001',
        chantier_id: 'chantier-004',
        date: '2026-01-07',
        periode: 'apres_midi',
        type: 'travail',
        heure_debut: '13:00',
        heure_fin: '17:30',
        duree_minutes: 270,
        mode_saisie: 'manuel',
        type_trajet: null,
        created_at: '2026-01-07T18:00:00Z',
        updated_at: '2026-01-07T18:00:00Z',
    },
];

// ============ GÉNÉRATEUR DE DONNÉES EN MASSE ============

// Villes avec coordonnées GPS
const VILLES = [
    { nom: 'Nantes', lat: 47.2184, lon: -1.5536, cp: '44000' },
    { nom: 'Angers', lat: 47.4784, lon: -0.5632, cp: '49000' },
    { nom: 'Rennes', lat: 48.1173, lon: -1.6778, cp: '35000' },
    { nom: 'Le Mans', lat: 47.9960, lon: 0.1996, cp: '72000' },
    { nom: 'Saint-Nazaire', lat: 47.2737, lon: -2.2139, cp: '44600' },
    { nom: 'Laval', lat: 48.0734, lon: -0.7699, cp: '53000' },
    { nom: 'Cholet', lat: 47.0598, lon: -0.8791, cp: '49300' },
    { nom: 'La Roche-sur-Yon', lat: 46.6705, lon: -1.4266, cp: '85000' },
    { nom: 'Saint-Brieuc', lat: 48.5141, lon: -2.7574, cp: '22000' },
    { nom: 'Vannes', lat: 47.6559, lon: -2.7603, cp: '56000' },
    { nom: 'Lorient', lat: 47.7500, lon: -3.3667, cp: '56100' },
    { nom: 'Quimper', lat: 47.9960, lon: -4.1000, cp: '29000' },
    { nom: 'Brest', lat: 48.3904, lon: -4.4861, cp: '29200' },
    { nom: 'Tours', lat: 47.3941, lon: 0.6848, cp: '37000' },
    { nom: 'Orléans', lat: 47.9029, lon: 1.9039, cp: '45000' },
];

const TYPES_ETABLISSEMENT = [
    'CHU', 'Clinique', 'Hôpital', 'Centre Médical', 'Laboratoire',
    'Université', 'Lycée', 'Collège', 'École', 'Institut',
    'Mairie', 'Préfecture', 'Centre Administratif', 'Médiathèque',
    'Centre de Recherche', 'Pôle Santé', 'EHPAD', 'Crèche'
];

const NOMS_ETABLISSEMENT = [
    'Saint-Jacques', 'Pasteur', 'Curie', 'Bretagne', 'Atlantique',
    'Victor Hugo', 'Jean Moulin', 'De Gaulle', 'Mendès France',
    'Les Musiciens', 'Les Arts', 'Kennedy', 'Bel Air', 'La Fontaine',
    'Jules Verne', 'Montaigne', 'Rabelais', 'Descartes', 'Lavoisier'
];

const LOCALISATIONS_RESERVE = [
    'Accueil', 'Hall principal', 'Bureau 101', 'Bureau 102', 'Bureau 201',
    'Salle de réunion', 'Laboratoire A', 'Laboratoire B', 'Salle d\'attente',
    'Couloir RDC', 'Couloir 1er étage', 'Local technique', 'Salle de pause',
    'Amphithéâtre', 'Bibliothèque', 'Cafétéria', 'Infirmerie', 'Pharmacie',
    'Bloc opératoire', 'Chambre 12', 'Chambre 24', 'Réception', 'Secrétariat'
];

const PROBLEMES_RESERVE = [
    'Rayure visible sur le plan de travail',
    'Éclat sur le comptoir',
    'Porte mal ajustée',
    'Tiroir bloqué',
    'Poignée desserrée',
    'Différence de teinte sur les panneaux',
    'Joint de finition manquant',
    'Éclairage LED défaillant',
    'Charnière grince',
    'Panneau légèrement voilé',
    'Vis apparente à masquer',
    'Trace de colle à nettoyer',
    'Plinthe décollée',
    'Goulotte non fixée',
    'Cache prise manquant',
    'Fissure sur le stratifié',
    'Décalage entre deux éléments',
    'Trou de fixation mal positionné'
];

const PHASES_TYPES = [
    { libelle: 'Réception matériel', duree: 4, groupe: 1 },
    { libelle: 'Préparation du site', duree: 8, groupe: 1 },
    { libelle: 'Montage structure', duree: 8, groupe: 2 },
    { libelle: 'Installation mobilier', duree: 8, groupe: 2 },
    { libelle: 'Pose plans de travail', duree: 8, groupe: 2 },
    { libelle: 'Raccordements', duree: 4, groupe: 3 },
    { libelle: 'Finitions', duree: 4, groupe: 3 },
    { libelle: 'Nettoyage', duree: 4, groupe: 3 },
    { libelle: 'Réception client', duree: 2, groupe: 4 },
];

// Helpers
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;

// Générer une date entre deux bornes
const randomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Formater une date en YYYY-MM-DD
const formatDate = (d: Date): string => d.toISOString().split('T')[0];

// Ajouter des jours à une date
const addDays = (d: Date, days: number): Date => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
};

// Générer 150 chantiers
const generateChantiers = (): Tables<'chantiers'>[] => {
    const chantiers: Tables<'chantiers'>[] = [];
    const statuts = ['nouveau', 'en_cours', 'planifie', 'pose_en_cours', 'a_terminer', 'termine'];
    const categories = ['labo', 'en', 'hospitalier', 'autres'];
    const types = ['fourniture', 'fourniture_pose'];
    const chargesAffaire = ['ca-uuid-001', 'ca-uuid-002', null];
    const poseurs = ['poseur-uuid-001', 'poseur-uuid-002', 'poseur-uuid-003', 'poseur-uuid-004', 'poseur-uuid-005', null];
    const clients = ['client-001', 'client-002', 'client-003'];

    for (let i = 5; i <= 154; i++) {
        const ville = randomItem(VILLES);
        const typeEtab = randomItem(TYPES_ETABLISSEMENT);
        const nomEtab = randomItem(NOMS_ETABLISSEMENT);
        const statut = randomItem(statuts);
        const categorie = randomItem(categories);
        const type = randomItem(types);
        const chargeAffaire = randomItem(chargesAffaire);
        const poseur = randomBool(0.7) ? randomItem(poseurs.filter(p => p !== null)) : null;

        // Dates : entre le 6 janvier et le 15 février 2026
        const dateDebut = randomDate(new Date('2026-01-06'), new Date('2026-02-10'));
        const dureeJours = randomInt(3, 20);
        const dateFin = addDays(dateDebut, dureeJours);

        // Variation des coordonnées GPS
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lonOffset = (Math.random() - 0.5) * 0.05;

        chantiers.push({
            id: `chantier-${i.toString().padStart(3, '0')}`,
            reference: `${categorie.toUpperCase().slice(0, 3)}-2026-${i.toString().padStart(3, '0')}`,
            nom: `${typeEtab} ${nomEtab} ${ville.nom}`,
            adresse_livraison: `${randomInt(1, 150)} ${randomItem(['Rue', 'Avenue', 'Boulevard'])} ${randomItem(['de la République', 'du Général Leclerc', 'Jean Jaurès', 'Victor Hugo', 'de la Liberté', 'des Alliés'])}, ${ville.cp} ${ville.nom}`,
            adresse_livraison_latitude: ville.lat + latOffset,
            adresse_livraison_longitude: ville.lon + lonOffset,
            client_id: randomItem(clients),
            charge_affaire_id: chargeAffaire,
            poseur_id: poseur,
            statut: statut,
            categorie: categorie,
            type: type,
            date_debut: statut !== 'nouveau' ? formatDate(dateDebut) : null,
            date_fin: statut !== 'nouveau' ? formatDate(dateFin) : null,
            reserves_levees: statut === 'termine' ? randomBool(0.8) : false,
            doe_fourni: statut === 'termine' ? randomBool(0.7) : false,
            heures_allouees: randomBool(0.6) ? randomInt(20, 200) : null,
            budget_heures: randomBool(0.7) ? randomInt(30, 250) : null,
            deleted_at: null,
            created_at: '2024-12-01T10:00:00Z',
            updated_at: '2025-01-05T10:00:00Z',
        });
    }

    return chantiers;
};

// Générer les phases pour les chantiers
const generatePhases = (chantiers: Tables<'chantiers'>[]): Tables<'phases_chantiers'>[] => {
    const phases: Tables<'phases_chantiers'>[] = [];
    const poseurs = ['poseur-uuid-001', 'poseur-uuid-002', 'poseur-uuid-003', 'poseur-uuid-004', 'poseur-uuid-005'];
    let phaseCounter = 100;

    chantiers.forEach(chantier => {
        // Ne générer des phases que pour les chantiers "fourniture_pose" planifiés ou en cours
        // Les chantiers "fourniture" seule n'ont PAS de phases
        if (!chantier.date_debut || chantier.statut === 'nouveau' || chantier.type === 'fourniture') return;

        const startDate = new Date(chantier.date_debut);
        let currentDate = new Date(startDate);

        // Nombre de phases : 2 à 5
        const numPhases = randomInt(2, 5);
        const selectedPhases = PHASES_TYPES.slice(0, numPhases);

        selectedPhases.forEach((phaseType, index) => {
            // Sauter les week-ends
            while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                currentDate = addDays(currentDate, 1);
            }

            const poseur = randomBool(0.7) ? randomItem(poseurs) : null;

            phases.push({
                id: `phase-gen-${phaseCounter++}`,
                chantier_id: chantier.id,
                groupe_phase: phaseType.groupe,
                numero_phase: index + 1,
                libelle: phaseType.libelle,
                heures_budget: randomBool(0.5) ? randomInt(8, 40) : null,
                date_debut: formatDate(currentDate),
                date_fin: formatDate(currentDate), // Même jour (4h)
                heure_debut: '08:00:00',
                duree_heures: 4, // Toujours 4h
                heure_fin: '12:00:00',
                poseur_id: poseur,
                created_at: '2024-12-15T14:00:00Z',
                updated_at: '2024-12-15T14:00:00Z',
            });

            // Passer au jour suivant pour la prochaine phase
            currentDate = addDays(currentDate, 1);
        });
    });

    return phases;
};

// Générer les réserves pour les chantiers
const generateReserves = (chantiers: Tables<'chantiers'>[]): Tables<'notes_chantiers'>[] => {
    const reserves: Tables<'notes_chantiers'>[] = [];
    const poseurs = ['poseur-uuid-001', 'poseur-uuid-002', 'poseur-uuid-003', 'poseur-uuid-004', 'poseur-uuid-005'];
    const traiteurs = ['ca-uuid-001', 'ca-uuid-002', 'sup-uuid-001'];
    const statuts: ('ouverte' | 'en_cours' | 'levee' | 'rejetee')[] = ['ouverte', 'en_cours', 'levee', 'rejetee'];
    let reserveCounter = 100;

    chantiers.forEach(chantier => {
        // 60% des chantiers ont des réserves
        if (!randomBool(0.6)) return;

        // 1 à 4 réserves par chantier
        const numReserves = randomInt(1, 4);

        for (let i = 0; i < numReserves; i++) {
            const statut = randomItem(statuts);
            const dateCreation = randomDate(new Date('2026-01-04'), new Date('2026-01-10'));

            reserves.push({
                id: `reserve-gen-${reserveCounter++}`,
                chantier_id: chantier.id,
                type: 'reserve',
                contenu: randomItem(PROBLEMES_RESERVE),
                photo_1_url: null,
                photo_2_url: null,
                created_by: randomItem(poseurs),
                localisation: randomItem(LOCALISATIONS_RESERVE),
                statut_reserve: statut,
                traite_par: statut !== 'ouverte' ? randomItem(traiteurs) : null,
                date_traitement: statut !== 'ouverte' ? addDays(dateCreation, randomInt(1, 3)).toISOString() : null,
                date_resolution: (statut === 'levee' || statut === 'rejetee') ? addDays(dateCreation, randomInt(2, 5)).toISOString() : null,
                commentaire_resolution: statut === 'levee' ? 'Problème corrigé.' : (statut === 'rejetee' ? 'Non reproductible ou hors périmètre.' : null),
                phase_id: null,
                heure_arrivee: null,
                heure_depart: null,
                deleted_at: null,
                created_at: dateCreation.toISOString(),
                updated_at: dateCreation.toISOString(),
            });
        }
    });

    return reserves;
};

// Générer les données
const generatedChantiers = generateChantiers();
const generatedPhases = generatePhases(generatedChantiers);
const generatedReserves = generateReserves(generatedChantiers);

// Ajouter aux tableaux existants
initial_chantiers.push(...generatedChantiers);
initial_phases_chantiers.push(...generatedPhases);
initial_notes_chantiers.push(...generatedReserves);
