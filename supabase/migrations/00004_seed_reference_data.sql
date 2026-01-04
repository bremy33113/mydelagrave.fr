-- =============================================
-- MyDelagrave Seed Reference Data v1.0.3
-- Migration: 00004_seed_reference_data.sql
-- Description: Données initiales des tables de référence
-- Note: Utilise ON CONFLICT DO UPDATE pour être idempotent
-- =============================================

-- =============================================
-- ref_roles_user: Rôles utilisateurs
-- =============================================

INSERT INTO ref_roles_user (code, label, level, description) VALUES
    ('admin', 'Administrateur', 100, 'Accès complet à toutes les fonctionnalités'),
    ('superviseur', 'Superviseur', 80, 'Supervision des chantiers et poseurs'),
    ('charge_affaire', 'Chargé d''Affaires', 50, 'Gestion de ses propres chantiers'),
    ('poseur', 'Poseur', 10, 'Consultation des phases assignées')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    level = EXCLUDED.level,
    description = EXCLUDED.description;

-- =============================================
-- ref_statuts_chantier: Statuts des chantiers
-- =============================================

INSERT INTO ref_statuts_chantier (code, label, icon, color) VALUES
    ('nouveau', 'Nouveau', '🆕', '#3B82F6'),
    ('en_cours', 'En cours', '🔄', '#F59E0B'),
    ('planifie', 'Planifié', '📅', '#8B5CF6'),
    ('pose_en_cours', 'Pose en cours', '🔨', '#EC4899'),
    ('a_terminer', 'À terminer', '⏳', '#F97316'),
    ('termine', 'Terminé', '✅', '#10B981')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;

-- =============================================
-- ref_categories_chantier: Catégories
-- =============================================

INSERT INTO ref_categories_chantier (code, label, icon) VALUES
    ('labo', 'Laboratoire', '🔬'),
    ('en', 'Enseignement', '🎓'),
    ('hospitalier', 'Hospitalier', '🏥'),
    ('autres', 'Autres', '📦')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon;

-- =============================================
-- ref_types_chantier: Types de projet
-- =============================================

INSERT INTO ref_types_chantier (code, label) VALUES
    ('fourniture', 'Fourniture seule'),
    ('fourniture_pose', 'Fourniture et pose')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label;

-- =============================================
-- ref_clients: Types de contacts
-- =============================================

INSERT INTO ref_clients (code, label, icon, color) VALUES
    ('contact_client', 'Contact client', '👤', '#3B82F6'),
    ('contact_chantier', 'Contact chantier', '🏗️', '#10B981'),
    ('architecte', 'Architecte', '📐', '#8B5CF6'),
    ('maitre_ouvrage', 'Maître d''ouvrage', '🏛️', '#F59E0B'),
    ('entreprise_generale', 'Entreprise générale', '🏢', '#EC4899')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;

-- =============================================
-- ref_job: Métiers/postes
-- =============================================

INSERT INTO ref_job (code, label, icon, color) VALUES
    ('directeur', 'Directeur', '👔', '#1E40AF'),
    ('commercial', 'Commercial', '💼', '#047857'),
    ('conducteur_travaux', 'Conducteur de travaux', '👷', '#B45309'),
    ('architecte', 'Architecte', '📐', '#7C3AED'),
    ('technicien', 'Technicien', '🔧', '#0891B2'),
    ('responsable_achats', 'Responsable achats', '📋', '#BE185D'),
    ('autre', 'Autre', '👤', '#64748B')
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;

-- =============================================
-- ref_types_document: Types de documents
-- =============================================

INSERT INTO ref_types_document (id, libelle, icon, ordre) VALUES
    ('plan', 'Plan', '📐', 1),
    ('devis', 'Devis', '💰', 2),
    ('rapport', 'Rapport', '📄', 3),
    ('reserve', 'Liste réserves', '📋', 4)
ON CONFLICT (id) DO UPDATE SET
    libelle = EXCLUDED.libelle,
    icon = EXCLUDED.icon,
    ordre = EXCLUDED.ordre;

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Cette requête permet de vérifier que toutes les données sont bien insérées
-- À exécuter manuellement pour valider :
/*
SELECT 'ref_roles_user' as table_name, COUNT(*) as count FROM ref_roles_user
UNION ALL SELECT 'ref_statuts_chantier', COUNT(*) FROM ref_statuts_chantier
UNION ALL SELECT 'ref_categories_chantier', COUNT(*) FROM ref_categories_chantier
UNION ALL SELECT 'ref_types_chantier', COUNT(*) FROM ref_types_chantier
UNION ALL SELECT 'ref_clients', COUNT(*) FROM ref_clients
UNION ALL SELECT 'ref_job', COUNT(*) FROM ref_job
UNION ALL SELECT 'ref_types_document', COUNT(*) FROM ref_types_document;

-- Résultat attendu :
-- ref_roles_user          | 4
-- ref_statuts_chantier    | 6
-- ref_categories_chantier | 4
-- ref_types_chantier      | 2
-- ref_clients             | 5
-- ref_job                 | 7
-- ref_types_document      | 4
*/

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.3', 'Reference data seeding (roles, statuts, categories, types, jobs, documents)')
ON CONFLICT (version) DO NOTHING;
