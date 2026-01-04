-- =============================================
-- MyDelagrave Database Schema v1.0.0
-- Migration: 00001_initial_schema.sql
-- Description: Création de toutes les tables, contraintes et triggers
-- =============================================

-- Note: gen_random_uuid() est natif dans PostgreSQL 13+ (utilisé par Supabase)

-- =============================================
-- TABLE DE VERSIONING
-- =============================================

CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLES DE RÉFÉRENCE (lookup tables)
-- =============================================

-- ref_roles_user: Définition des rôles utilisateurs
CREATE TABLE IF NOT EXISTS ref_roles_user (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

-- ref_statuts_chantier: Statuts des chantiers
CREATE TABLE IF NOT EXISTS ref_statuts_chantier (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20)
);

-- ref_categories_chantier: Catégories (labo, enseignement, hospitalier)
CREATE TABLE IF NOT EXISTS ref_categories_chantier (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(10)
);

-- ref_types_chantier: Types de projet (fourniture, fourniture+pose)
CREATE TABLE IF NOT EXISTS ref_types_chantier (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL
);

-- ref_clients: Types de contacts clients
CREATE TABLE IF NOT EXISTS ref_clients (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20)
);

-- ref_job: Métiers/postes des contacts
CREATE TABLE IF NOT EXISTS ref_job (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20)
);

-- ref_types_document: Types de documents
CREATE TABLE IF NOT EXISTS ref_types_document (
    id VARCHAR(50) PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL DEFAULT '📎',
    ordre INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- TABLES PRINCIPALES
-- =============================================

-- users: Utilisateurs de l'application (liés à auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'poseur' REFERENCES ref_roles_user(code),
    suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- clients: Contacts externes (clients, architectes, entreprises)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50),
    adresse TEXT,
    batiment TEXT,
    entreprise VARCHAR(255),
    job VARCHAR(50) REFERENCES ref_job(code),
    client_categorie VARCHAR(50) NOT NULL REFERENCES ref_clients(code),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- chantiers: Sites de construction (entité principale)
CREATE TABLE IF NOT EXISTS chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50),
    nom VARCHAR(255) NOT NULL,
    adresse_livraison TEXT,
    adresse_livraison_latitude DOUBLE PRECISION,
    adresse_livraison_longitude DOUBLE PRECISION,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    charge_affaire_id UUID REFERENCES users(id) ON DELETE SET NULL,
    poseur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'nouveau' REFERENCES ref_statuts_chantier(code),
    categorie VARCHAR(50) REFERENCES ref_categories_chantier(code),
    type VARCHAR(50) REFERENCES ref_types_chantier(code),
    date_debut DATE,
    date_fin DATE,
    reserves_levees BOOLEAN NOT NULL DEFAULT FALSE,
    doe_fourni BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- phases_chantiers: Phases de travail pour chaque chantier
CREATE TABLE IF NOT EXISTS phases_chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    numero_phase INTEGER NOT NULL,
    libelle VARCHAR(255),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME NOT NULL DEFAULT '08:00:00',
    duree_heures DECIMAL(4,2) NOT NULL DEFAULT 8,
    heure_fin TIME NOT NULL DEFAULT '17:00:00',
    poseur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chantier_id, numero_phase)
);

-- notes_chantiers: Notes/commentaires avec photos optionnelles
CREATE TABLE IF NOT EXISTS notes_chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    contenu TEXT,
    photo_1_url TEXT,  -- Chemin storage ou URL
    photo_2_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- chantiers_contacts: Relation many-to-many chantiers <-> contacts
CREATE TABLE IF NOT EXISTS chantiers_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chantier_id, client_id)
);

-- documents_chantiers: Documents attachés aux chantiers
CREATE TABLE IF NOT EXISTS documents_chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL REFERENCES ref_types_document(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEX (Performance)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_charge_affaire ON chantiers(charge_affaire_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_poseur ON chantiers(poseur_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_deleted_at ON chantiers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chantiers_client ON chantiers(client_id);

CREATE INDEX IF NOT EXISTS idx_phases_chantier ON phases_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_phases_poseur ON phases_chantiers(poseur_id);
CREATE INDEX IF NOT EXISTS idx_phases_dates ON phases_chantiers(date_debut, date_fin);

CREATE INDEX IF NOT EXISTS idx_notes_chantier ON notes_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes_chantiers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes_chantiers(created_by);

CREATE INDEX IF NOT EXISTS idx_documents_chantier ON documents_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents_chantiers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents_chantiers(type);

CREATE INDEX IF NOT EXISTS idx_chantiers_contacts_chantier ON chantiers_contacts(chantier_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_contacts_client ON chantiers_contacts(client_id);

CREATE INDEX IF NOT EXISTS idx_clients_categorie ON clients(client_categorie);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(suspended);

-- =============================================
-- FONCTIONS
-- =============================================

-- get_my_role: Retourne le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$;

-- is_user_suspended: Vérifie si un utilisateur est suspendu
CREATE OR REPLACE FUNCTION is_user_suspended(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(suspended, FALSE) FROM users WHERE id = user_id;
$$;

-- update_updated_at_column: Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at sur toutes les tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chantiers_updated_at ON chantiers;
CREATE TRIGGER update_chantiers_updated_at
    BEFORE UPDATE ON chantiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phases_updated_at ON phases_chantiers;
CREATE TRIGGER update_phases_updated_at
    BEFORE UPDATE ON phases_chantiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes_chantiers;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes_chantiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON chantiers_contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON chantiers_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents_chantiers;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents_chantiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial schema - Tables, indexes, functions, triggers')
ON CONFLICT (version) DO NOTHING;
