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
];

export const initial_clients: Tables<'clients'>[] = [
    {
        id: 'client-001',
        nom: 'Dr. Sophie Bernard',
        email: 'sophie.bernard@chu-nantes.fr',
        telephone: '02 40 08 33 33',
        adresse: '1 Place Alexis-Ricordeau, 44093 Nantes',
        entreprise: 'CHU de Nantes',
        job: 'directeur',
        client_categorie: 'contact_client',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
    },
    {
        id: 'client-002',
        nom: 'Marc Lefevre',
        email: 'marc.lefevre@archistudio.fr',
        telephone: '02 41 22 33 44',
        adresse: '15 Rue de la Paix, 49000 Angers',
        entreprise: 'ArchiStudio',
        job: 'architecte',
        client_categorie: 'architecte',
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-01T09:00:00Z',
    },
    {
        id: 'client-003',
        nom: 'Antoine Moreau',
        email: 'a.moreau@batipro.fr',
        telephone: '02 51 44 55 66',
        adresse: '8 Boulevard des Industries, 44600 Saint-Nazaire',
        entreprise: 'BatiPro',
        job: 'conducteur_travaux',
        client_categorie: 'entreprise_generale',
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
        statut: 'planifie',
        categorie: 'labo',
        type: 'fourniture_pose',
        date_debut: '2026-01-15',
        date_fin: '2026-02-28',
        reserves_levees: false,
        doe_fourni: false,
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
        deleted_at: null,
        created_at: '2025-03-01T10:00:00Z',
        updated_at: '2025-10-15T16:00:00Z',
    },
];

export const initial_phases_chantiers: Tables<'phases_chantiers'>[] = [
    {
        id: 'phase-001',
        chantier_id: 'chantier-001',
        numero_phase: 1,
        libelle: 'Préparation du site',
        date_debut: '2026-01-15',
        date_fin: '2026-01-17',
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
        numero_phase: 2,
        libelle: 'Installation mobilier',
        date_debut: '2026-01-20',
        date_fin: '2026-01-25',
        heure_debut: '08:00:00',
        duree_heures: 8,
        heure_fin: '17:00:00',
        poseur_id: 'poseur-uuid-001',
        created_at: '2024-12-15T14:30:00Z',
        updated_at: '2024-12-15T14:30:00Z',
    },
    {
        id: 'phase-003',
        chantier_id: 'chantier-001',
        numero_phase: 3,
        libelle: 'Finitions et nettoyage',
        date_debut: '2026-02-01',
        date_fin: '2026-02-03',
        heure_debut: '08:00:00',
        duree_heures: 8,
        heure_fin: '17:00:00',
        poseur_id: null,
        created_at: '2024-12-15T15:00:00Z',
        updated_at: '2024-12-15T15:00:00Z',
    },
];

export const initial_notes_chantiers: Tables<'notes_chantiers'>[] = [
    {
        id: 'note-001',
        chantier_id: 'chantier-001',
        contenu: 'Première visite effectuée. RDV prévu avec le client pour valider les plans finaux le 10/01.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        deleted_at: null,
        created_at: '2024-12-10T09:00:00Z',
        updated_at: '2024-12-10T09:00:00Z',
    },
    {
        id: 'note-002',
        chantier_id: 'chantier-001',
        contenu: 'Plans validés par le client. Commande des matériaux lancée.',
        photo_1_url: null,
        photo_2_url: null,
        created_by: 'ca-uuid-001',
        deleted_at: null,
        created_at: '2024-12-12T14:00:00Z',
        updated_at: '2024-12-12T14:00:00Z',
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
