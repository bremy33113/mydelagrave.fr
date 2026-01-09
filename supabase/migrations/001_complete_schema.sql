-- =====================================================
-- MyDelagrave - Complete Database Schema Migration
-- Run this in Supabase SQL Editor to sync all tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- REFERENCE TABLES (lookup tables)
-- =====================================================

-- Roles utilisateur
CREATE TABLE IF NOT EXISTS ref_roles_user (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

INSERT INTO ref_roles_user (code, label, level, description) VALUES
    ('admin', 'Administrateur', 100, 'Accès complet'),
    ('superviseur', 'Superviseur', 80, 'Supervision des chantiers'),
    ('charge_affaire', 'Chargé d''affaire', 60, 'Gestion des chantiers attribués'),
    ('poseur', 'Poseur', 40, 'Consultation des chantiers attribués')
ON CONFLICT (code) DO NOTHING;

-- Statuts chantier
CREATE TABLE IF NOT EXISTS ref_statuts_chantier (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    color TEXT
);

INSERT INTO ref_statuts_chantier (code, label, icon, color) VALUES
    ('nouveau', 'Nouveau', 'Plus', 'blue'),
    ('planifie', 'Planifié', 'Calendar', 'purple'),
    ('en_cours', 'En cours', 'Play', 'orange'),
    ('termine', 'Terminé', 'CheckCircle', 'green'),
    ('annule', 'Annulé', 'XCircle', 'red'),
    ('en_attente', 'En attente', 'Pause', 'yellow')
ON CONFLICT (code) DO NOTHING;

-- Catégories chantier
CREATE TABLE IF NOT EXISTS ref_categories_chantier (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT
);

INSERT INTO ref_categories_chantier (code, label, icon) VALUES
    ('laboratoire', 'Laboratoire', 'Flask'),
    ('enseignement', 'Enseignement', 'GraduationCap'),
    ('tertiaire', 'Tertiaire', 'Building'),
    ('hospitalier', 'Hospitalier', 'Hospital'),
    ('industriel', 'Industriel', 'Factory'),
    ('commercial', 'Commercial', 'Store'),
    ('residentiel', 'Résidentiel', 'Home')
ON CONFLICT (code) DO NOTHING;

-- Types chantier
CREATE TABLE IF NOT EXISTS ref_types_chantier (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);

INSERT INTO ref_types_chantier (code, label) VALUES
    ('fourniture_pose', 'Fourniture et pose'),
    ('fourniture', 'Fourniture seule'),
    ('pose', 'Pose seule'),
    ('sav', 'SAV')
ON CONFLICT (code) DO NOTHING;

-- Catégories clients
CREATE TABLE IF NOT EXISTS ref_clients (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    color TEXT
);

INSERT INTO ref_clients (code, label, icon, color) VALUES
    ('client', 'Client', 'User', 'blue'),
    ('sous_traitant', 'Sous-traitant', 'Users', 'purple'),
    ('architecte', 'Architecte', 'Compass', 'green'),
    ('maitrise_ouvrage', 'Maîtrise d''ouvrage', 'Building', 'orange'),
    ('bureau_etudes', 'Bureau d''études', 'FileText', 'cyan')
ON CONFLICT (code) DO NOTHING;

-- Fonctions/Jobs contacts
CREATE TABLE IF NOT EXISTS ref_job (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    color TEXT
);

INSERT INTO ref_job (code, label, icon, color) VALUES
    ('directeur', 'Directeur', 'Crown', 'purple'),
    ('architecte', 'Architecte', 'Compass', 'blue'),
    ('conducteur_travaux', 'Conducteur de travaux', 'HardHat', 'orange'),
    ('chef_chantier', 'Chef de chantier', 'Wrench', 'green'),
    ('responsable_technique', 'Responsable technique', 'Settings', 'cyan'),
    ('commercial', 'Commercial', 'Briefcase', 'yellow'),
    ('assistant', 'Assistant(e)', 'UserCheck', 'gray')
ON CONFLICT (code) DO NOTHING;

-- Types de documents
CREATE TABLE IF NOT EXISTS ref_types_document (
    id TEXT PRIMARY KEY,
    libelle TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'File',
    ordre INTEGER NOT NULL DEFAULT 0
);

INSERT INTO ref_types_document (id, libelle, icon, ordre) VALUES
    ('plan', 'Plan', 'Map', 1),
    ('devis', 'Devis', 'FileText', 2),
    ('rapport', 'Rapport', 'FileSpreadsheet', 3),
    ('reserve', 'Réserve', 'AlertTriangle', 4),
    ('feuille_pointage', 'Feuille de pointage', 'Clock', 5),
    ('photo', 'Photo', 'Camera', 6),
    ('autre', 'Autre', 'File', 99)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'poseur' REFERENCES ref_roles_user(code),
    suspended BOOLEAN NOT NULL DEFAULT FALSE,
    adresse_domicile TEXT,
    adresse_domicile_latitude NUMERIC,
    adresse_domicile_longitude NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: Add address columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'adresse_domicile') THEN
        ALTER TABLE users ADD COLUMN adresse_domicile TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'adresse_domicile_latitude') THEN
        ALTER TABLE users ADD COLUMN adresse_domicile_latitude NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'adresse_domicile_longitude') THEN
        ALTER TABLE users ADD COLUMN adresse_domicile_longitude NUMERIC;
    END IF;
END $$;

-- Clients/Contacts
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    batiment TEXT,
    entreprise TEXT,
    job TEXT,
    client_categorie TEXT NOT NULL DEFAULT 'client' REFERENCES ref_clients(code),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chantiers
CREATE TABLE IF NOT EXISTS chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference TEXT,
    nom TEXT NOT NULL,
    adresse_livraison TEXT,
    adresse_livraison_latitude NUMERIC,
    adresse_livraison_longitude NUMERIC,
    client_id UUID REFERENCES clients(id),
    charge_affaire_id UUID REFERENCES users(id),
    poseur_id UUID REFERENCES users(id),
    statut TEXT NOT NULL DEFAULT 'nouveau' REFERENCES ref_statuts_chantier(code),
    categorie TEXT REFERENCES ref_categories_chantier(code),
    type TEXT REFERENCES ref_types_chantier(code),
    date_debut DATE,
    date_fin DATE,
    reserves_levees BOOLEAN DEFAULT FALSE,
    doe_fourni BOOLEAN DEFAULT FALSE,
    heures_allouees NUMERIC,
    budget_heures NUMERIC,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phases des chantiers
CREATE TABLE IF NOT EXISTS phases_chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    groupe_phase INTEGER NOT NULL DEFAULT 1,
    numero_phase INTEGER NOT NULL DEFAULT 1,
    libelle TEXT,
    heures_budget NUMERIC,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME NOT NULL DEFAULT '08:00',
    heure_fin TIME NOT NULL DEFAULT '17:00',
    duree_heures NUMERIC NOT NULL DEFAULT 8,
    poseur_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notes/Réserves/Rapports des chantiers
CREATE TABLE IF NOT EXISTS notes_chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'reserve', 'rapport')),
    contenu TEXT,
    photo_1_url TEXT,
    photo_2_url TEXT,
    created_by UUID REFERENCES users(id),
    -- Champs pour réserves
    localisation TEXT,
    statut_reserve TEXT CHECK (statut_reserve IN ('ouverte', 'en_cours', 'levee', 'rejetee')),
    traite_par UUID REFERENCES users(id),
    date_traitement TIMESTAMPTZ,
    date_resolution TIMESTAMPTZ,
    commentaire_resolution TEXT,
    -- Champs pour rapports journaliers
    phase_id UUID REFERENCES phases_chantiers(id),
    heure_arrivee TIME,
    heure_depart TIME,
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pointages (time tracking)
CREATE TABLE IF NOT EXISTS pointages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poseur_id UUID NOT NULL REFERENCES users(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    periode TEXT NOT NULL CHECK (periode IN ('matin', 'apres_midi')),
    type TEXT NOT NULL CHECK (type IN ('trajet', 'travail')),
    heure_debut TIME,
    heure_fin TIME,
    duree_minutes INTEGER NOT NULL DEFAULT 0,
    mode_saisie TEXT NOT NULL DEFAULT 'manuel' CHECK (mode_saisie IN ('chrono', 'manuel')),
    type_trajet TEXT CHECK (type_trajet IN ('domicile_chantier', 'entre_chantiers', 'chantier_domicile')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts associés aux chantiers
CREATE TABLE IF NOT EXISTS chantiers_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chantier_id, client_id)
);

-- Documents des chantiers
CREATE TABLE IF NOT EXISTS documents_chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    type TEXT NOT NULL REFERENCES ref_types_document(id),
    nom TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historique des modifications de phases
CREATE TABLE IF NOT EXISTS historique_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases_chantiers(id) ON DELETE CASCADE,
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    modified_by UUID NOT NULL REFERENCES users(id),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL CHECK (action IN ('date_change', 'duration_change', 'poseur_change', 'budget_change', 'create', 'update', 'delete')),
    description TEXT NOT NULL DEFAULT '',
    -- Anciennes valeurs
    old_date_debut DATE,
    old_date_fin DATE,
    old_heure_debut TIME,
    old_heure_fin TIME,
    old_duree_heures NUMERIC,
    old_heures_budget NUMERIC,
    old_poseur_id UUID REFERENCES users(id),
    old_libelle TEXT,
    -- Nouvelles valeurs
    new_date_debut DATE,
    new_date_fin DATE,
    new_heure_debut TIME,
    new_heure_fin TIME,
    new_duree_heures NUMERIC,
    new_heures_budget NUMERIC,
    new_poseur_id UUID REFERENCES users(id),
    new_libelle TEXT
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_charge_affaire ON chantiers(charge_affaire_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_poseur ON chantiers(poseur_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_deleted_at ON chantiers(deleted_at);

CREATE INDEX IF NOT EXISTS idx_phases_chantier ON phases_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_phases_poseur ON phases_chantiers(poseur_id);
CREATE INDEX IF NOT EXISTS idx_phases_dates ON phases_chantiers(date_debut, date_fin);

CREATE INDEX IF NOT EXISTS idx_notes_chantier ON notes_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes_chantiers(type);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes_chantiers(deleted_at);

CREATE INDEX IF NOT EXISTS idx_pointages_poseur ON pointages(poseur_id);
CREATE INDEX IF NOT EXISTS idx_pointages_chantier ON pointages(chantier_id);
CREATE INDEX IF NOT EXISTS idx_pointages_date ON pointages(date);

CREATE INDEX IF NOT EXISTS idx_historique_phase ON historique_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_historique_chantier ON historique_phases(chantier_id);
CREATE INDEX IF NOT EXISTS idx_historique_modified_at ON historique_phases(modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_chantier ON documents_chantiers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents_chantiers(deleted_at);

CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pointages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_phases ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (basic - can be refined later)
DO $$
BEGIN
    -- Users table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users read access') THEN
        CREATE POLICY "Users read access" ON users FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- Clients table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Clients read access') THEN
        CREATE POLICY "Clients read access" ON clients FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Clients write access') THEN
        CREATE POLICY "Clients write access" ON clients FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Chantiers table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chantiers' AND policyname = 'Chantiers read access') THEN
        CREATE POLICY "Chantiers read access" ON chantiers FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chantiers' AND policyname = 'Chantiers write access') THEN
        CREATE POLICY "Chantiers write access" ON chantiers FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Phases table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phases_chantiers' AND policyname = 'Phases read access') THEN
        CREATE POLICY "Phases read access" ON phases_chantiers FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phases_chantiers' AND policyname = 'Phases write access') THEN
        CREATE POLICY "Phases write access" ON phases_chantiers FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Notes table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes_chantiers' AND policyname = 'Notes read access') THEN
        CREATE POLICY "Notes read access" ON notes_chantiers FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes_chantiers' AND policyname = 'Notes write access') THEN
        CREATE POLICY "Notes write access" ON notes_chantiers FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Pointages table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pointages' AND policyname = 'Pointages read access') THEN
        CREATE POLICY "Pointages read access" ON pointages FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pointages' AND policyname = 'Pointages write access') THEN
        CREATE POLICY "Pointages write access" ON pointages FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Chantiers_contacts table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chantiers_contacts' AND policyname = 'Contacts read access') THEN
        CREATE POLICY "Contacts read access" ON chantiers_contacts FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chantiers_contacts' AND policyname = 'Contacts write access') THEN
        CREATE POLICY "Contacts write access" ON chantiers_contacts FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Documents table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents_chantiers' AND policyname = 'Documents read access') THEN
        CREATE POLICY "Documents read access" ON documents_chantiers FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents_chantiers' AND policyname = 'Documents write access') THEN
        CREATE POLICY "Documents write access" ON documents_chantiers FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Historique table
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historique_phases' AND policyname = 'Historique read access') THEN
        CREATE POLICY "Historique read access" ON historique_phases FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historique_phases' AND policyname = 'Historique write access') THEN
        CREATE POLICY "Historique write access" ON historique_phases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT suspended FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['users', 'clients', 'chantiers', 'phases_chantiers', 'notes_chantiers', 'pointages', 'chantiers_contacts', 'documents_chantiers'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_' || t || '_updated_at') THEN
            EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Migration completed successfully!' as status;
