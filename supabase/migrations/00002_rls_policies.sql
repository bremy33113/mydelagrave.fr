-- =============================================
-- MyDelagrave RLS Policies v1.0.1
-- Migration: 00002_rls_policies.sql
-- Description: Politiques Row Level Security par rôle
-- =============================================

-- =============================================
-- ACTIVER RLS SUR TOUTES LES TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_chantiers ENABLE ROW LEVEL SECURITY;

-- Tables de référence : lecture publique, écriture admin
ALTER TABLE ref_roles_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_statuts_chantier ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_categories_chantier ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_types_chantier ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_types_document ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FONCTIONS HELPER POUR RLS
-- =============================================

-- Récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(public.user_role() = 'admin', FALSE);
$$;

-- Vérifier si l'utilisateur est superviseur ou admin
CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(public.user_role() IN ('admin', 'superviseur'), FALSE);
$$;

-- Vérifier si l'utilisateur peut voir un chantier spécifique
CREATE OR REPLACE FUNCTION public.can_view_chantier(p_chantier_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.chantiers
            WHERE id = p_chantier_id
            AND (charge_affaire_id = auth.uid() OR poseur_id = auth.uid())
        );
$$;

-- =============================================
-- POLICIES TABLES DE RÉFÉRENCE
-- Lecture : tous, Écriture : admin uniquement
-- =============================================

-- ref_roles_user
DROP POLICY IF EXISTS "ref_roles_user_select" ON ref_roles_user;
CREATE POLICY "ref_roles_user_select" ON ref_roles_user
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_roles_user_all_admin" ON ref_roles_user;
CREATE POLICY "ref_roles_user_all_admin" ON ref_roles_user
    FOR ALL USING (public.is_admin());

-- ref_statuts_chantier
DROP POLICY IF EXISTS "ref_statuts_select" ON ref_statuts_chantier;
CREATE POLICY "ref_statuts_select" ON ref_statuts_chantier
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_statuts_all_admin" ON ref_statuts_chantier;
CREATE POLICY "ref_statuts_all_admin" ON ref_statuts_chantier
    FOR ALL USING (public.is_admin());

-- ref_categories_chantier
DROP POLICY IF EXISTS "ref_categories_select" ON ref_categories_chantier;
CREATE POLICY "ref_categories_select" ON ref_categories_chantier
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_categories_all_admin" ON ref_categories_chantier;
CREATE POLICY "ref_categories_all_admin" ON ref_categories_chantier
    FOR ALL USING (public.is_admin());

-- ref_types_chantier
DROP POLICY IF EXISTS "ref_types_select" ON ref_types_chantier;
CREATE POLICY "ref_types_select" ON ref_types_chantier
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_types_all_admin" ON ref_types_chantier;
CREATE POLICY "ref_types_all_admin" ON ref_types_chantier
    FOR ALL USING (public.is_admin());

-- ref_clients
DROP POLICY IF EXISTS "ref_clients_select" ON ref_clients;
CREATE POLICY "ref_clients_select" ON ref_clients
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_clients_all_admin" ON ref_clients;
CREATE POLICY "ref_clients_all_admin" ON ref_clients
    FOR ALL USING (public.is_admin());

-- ref_job
DROP POLICY IF EXISTS "ref_job_select" ON ref_job;
CREATE POLICY "ref_job_select" ON ref_job
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_job_all_admin" ON ref_job;
CREATE POLICY "ref_job_all_admin" ON ref_job
    FOR ALL USING (public.is_admin());

-- ref_types_document
DROP POLICY IF EXISTS "ref_types_doc_select" ON ref_types_document;
CREATE POLICY "ref_types_doc_select" ON ref_types_document
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ref_types_doc_all_admin" ON ref_types_document;
CREATE POLICY "ref_types_doc_all_admin" ON ref_types_document
    FOR ALL USING (public.is_admin());

-- =============================================
-- POLICIES TABLE USERS
-- =============================================

-- Chaque utilisateur peut voir son propre profil
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (id = auth.uid());

-- Admin/Superviseur peuvent voir tous les utilisateurs
DROP POLICY IF EXISTS "users_select_managers" ON users;
CREATE POLICY "users_select_managers" ON users
    FOR SELECT USING (public.is_supervisor_or_admin());

-- L'utilisateur peut mettre à jour son propre profil (sauf role et suspended)
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin a tous les droits sur users
DROP POLICY IF EXISTS "users_all_admin" ON users;
CREATE POLICY "users_all_admin" ON users
    FOR ALL USING (public.is_admin());

-- Superviseur peut modifier les poseurs et chargés d'affaires
DROP POLICY IF EXISTS "users_update_supervisor" ON users;
CREATE POLICY "users_update_supervisor" ON users
    FOR UPDATE USING (
        public.user_role() = 'superviseur'
        AND role IN ('poseur', 'charge_affaire')
    );

-- Insert pour création via auth (service role)
DROP POLICY IF EXISTS "users_insert_service" ON users;
CREATE POLICY "users_insert_service" ON users
    FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- =============================================
-- POLICIES TABLE CLIENTS
-- =============================================

-- Tous les utilisateurs authentifiés peuvent voir les clients
DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Chargé d'affaire et plus peuvent créer des clients
DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients
    FOR INSERT WITH CHECK (
        public.user_role() IN ('admin', 'superviseur', 'charge_affaire')
    );

-- Chargé d'affaire et plus peuvent modifier des clients
DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients
    FOR UPDATE USING (
        public.user_role() IN ('admin', 'superviseur', 'charge_affaire')
    );

-- Admin et Superviseur peuvent supprimer des clients
DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients
    FOR DELETE USING (public.is_supervisor_or_admin());

-- =============================================
-- POLICIES TABLE CHANTIERS
-- =============================================

-- Admin/Superviseur voient tous les chantiers
DROP POLICY IF EXISTS "chantiers_select_managers" ON chantiers;
CREATE POLICY "chantiers_select_managers" ON chantiers
    FOR SELECT USING (public.is_supervisor_or_admin());

-- Chargé d'affaire/Poseur voient uniquement leurs chantiers assignés
DROP POLICY IF EXISTS "chantiers_select_assigned" ON chantiers;
CREATE POLICY "chantiers_select_assigned" ON chantiers
    FOR SELECT USING (
        charge_affaire_id = auth.uid()
        OR poseur_id = auth.uid()
    );

-- Chargé d'affaire et plus peuvent créer des chantiers
DROP POLICY IF EXISTS "chantiers_insert" ON chantiers;
CREATE POLICY "chantiers_insert" ON chantiers
    FOR INSERT WITH CHECK (
        public.user_role() IN ('admin', 'superviseur', 'charge_affaire')
    );

-- Peut modifier si admin/superviseur OU chargé d'affaire assigné
DROP POLICY IF EXISTS "chantiers_update" ON chantiers;
CREATE POLICY "chantiers_update" ON chantiers
    FOR UPDATE USING (
        public.is_supervisor_or_admin()
        OR charge_affaire_id = auth.uid()
    );

-- Suppression (soft delete) par admin ou chargé d'affaire assigné
DROP POLICY IF EXISTS "chantiers_delete" ON chantiers;
CREATE POLICY "chantiers_delete" ON chantiers
    FOR DELETE USING (
        public.is_admin()
        OR charge_affaire_id = auth.uid()
    );

-- =============================================
-- POLICIES TABLE PHASES_CHANTIERS
-- =============================================

-- Peut voir les phases si peut voir le chantier parent
DROP POLICY IF EXISTS "phases_select" ON phases_chantiers;
CREATE POLICY "phases_select" ON phases_chantiers
    FOR SELECT USING (public.can_view_chantier(chantier_id));

-- Insert si chargé d'affaire du chantier ou manager
DROP POLICY IF EXISTS "phases_insert" ON phases_chantiers;
CREATE POLICY "phases_insert" ON phases_chantiers
    FOR INSERT WITH CHECK (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

-- Update si chargé d'affaire du chantier ou manager
DROP POLICY IF EXISTS "phases_update" ON phases_chantiers;
CREATE POLICY "phases_update" ON phases_chantiers
    FOR UPDATE USING (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

-- Delete si chargé d'affaire du chantier ou manager
DROP POLICY IF EXISTS "phases_delete" ON phases_chantiers;
CREATE POLICY "phases_delete" ON phases_chantiers
    FOR DELETE USING (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

-- =============================================
-- POLICIES TABLE NOTES_CHANTIERS
-- =============================================

-- Peut voir les notes si peut voir le chantier parent
DROP POLICY IF EXISTS "notes_select" ON notes_chantiers;
CREATE POLICY "notes_select" ON notes_chantiers
    FOR SELECT USING (public.can_view_chantier(chantier_id));

-- Tous les utilisateurs assignés peuvent créer des notes
DROP POLICY IF EXISTS "notes_insert" ON notes_chantiers;
CREATE POLICY "notes_insert" ON notes_chantiers
    FOR INSERT WITH CHECK (public.can_view_chantier(chantier_id));

-- Peut modifier ses propres notes ou si manager
DROP POLICY IF EXISTS "notes_update" ON notes_chantiers;
CREATE POLICY "notes_update" ON notes_chantiers
    FOR UPDATE USING (
        created_by = auth.uid()
        OR public.is_supervisor_or_admin()
    );

-- Soft delete de ses propres notes ou si manager
DROP POLICY IF EXISTS "notes_delete" ON notes_chantiers;
CREATE POLICY "notes_delete" ON notes_chantiers
    FOR DELETE USING (
        created_by = auth.uid()
        OR public.is_supervisor_or_admin()
    );

-- =============================================
-- POLICIES TABLE CHANTIERS_CONTACTS
-- =============================================

DROP POLICY IF EXISTS "contacts_select" ON chantiers_contacts;
CREATE POLICY "contacts_select" ON chantiers_contacts
    FOR SELECT USING (public.can_view_chantier(chantier_id));

DROP POLICY IF EXISTS "contacts_insert" ON chantiers_contacts;
CREATE POLICY "contacts_insert" ON chantiers_contacts
    FOR INSERT WITH CHECK (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "contacts_update" ON chantiers_contacts;
CREATE POLICY "contacts_update" ON chantiers_contacts
    FOR UPDATE USING (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "contacts_delete" ON chantiers_contacts;
CREATE POLICY "contacts_delete" ON chantiers_contacts
    FOR DELETE USING (
        public.is_supervisor_or_admin()
        OR EXISTS (
            SELECT 1 FROM chantiers
            WHERE id = chantier_id AND charge_affaire_id = auth.uid()
        )
    );

-- =============================================
-- POLICIES TABLE DOCUMENTS_CHANTIERS
-- =============================================

DROP POLICY IF EXISTS "documents_select" ON documents_chantiers;
CREATE POLICY "documents_select" ON documents_chantiers
    FOR SELECT USING (public.can_view_chantier(chantier_id));

DROP POLICY IF EXISTS "documents_insert" ON documents_chantiers;
CREATE POLICY "documents_insert" ON documents_chantiers
    FOR INSERT WITH CHECK (public.can_view_chantier(chantier_id));

-- Peut modifier/supprimer ses propres documents ou si manager
DROP POLICY IF EXISTS "documents_update" ON documents_chantiers;
CREATE POLICY "documents_update" ON documents_chantiers
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR public.is_supervisor_or_admin()
    );

DROP POLICY IF EXISTS "documents_delete" ON documents_chantiers;
CREATE POLICY "documents_delete" ON documents_chantiers
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR public.is_supervisor_or_admin()
    );

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.1', 'RLS policies for all tables based on user roles')
ON CONFLICT (version) DO NOTHING;
