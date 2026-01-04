-- =============================================
-- MyDelagrave Storage Buckets v1.0.2
-- Migration: 00003_storage_buckets.sql
-- Description: Configuration des buckets de stockage et leurs policies
-- =============================================

-- =============================================
-- CRÉATION DES BUCKETS
-- =============================================

-- Bucket 'documents' pour les documents chantiers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,  -- Bucket privé (nécessite authentification)
    5242880,  -- 5MB limite
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket 'notes-photos' pour les photos des notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'notes-photos',
    'notes-photos',
    false,  -- Bucket privé
    2097152,  -- 2MB limite pour les photos
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- POLICIES STORAGE - BUCKET DOCUMENTS
-- =============================================

-- SELECT: Utilisateurs authentifiés peuvent voir les documents
DROP POLICY IF EXISTS "documents_select" ON storage.objects;
CREATE POLICY "documents_select" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
    );

-- INSERT: Utilisateurs authentifiés peuvent uploader
DROP POLICY IF EXISTS "documents_insert" ON storage.objects;
CREATE POLICY "documents_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
    );

-- UPDATE: Owner ou manager peut modifier
DROP POLICY IF EXISTS "documents_update" ON storage.objects;
CREATE POLICY "documents_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'documents'
        AND (
            owner = auth.uid()
            OR public.is_supervisor_or_admin()
        )
    );

-- DELETE: Owner ou manager peut supprimer
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;
CREATE POLICY "documents_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents'
        AND (
            owner = auth.uid()
            OR public.is_supervisor_or_admin()
        )
    );

-- =============================================
-- POLICIES STORAGE - BUCKET NOTES-PHOTOS
-- =============================================

-- SELECT: Utilisateurs authentifiés peuvent voir les photos
DROP POLICY IF EXISTS "notes_photos_select" ON storage.objects;
CREATE POLICY "notes_photos_select" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'notes-photos'
        AND auth.uid() IS NOT NULL
    );

-- INSERT: Utilisateurs authentifiés peuvent uploader
DROP POLICY IF EXISTS "notes_photos_insert" ON storage.objects;
CREATE POLICY "notes_photos_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'notes-photos'
        AND auth.uid() IS NOT NULL
    );

-- UPDATE: Owner ou manager peut modifier
DROP POLICY IF EXISTS "notes_photos_update" ON storage.objects;
CREATE POLICY "notes_photos_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'notes-photos'
        AND (
            owner = auth.uid()
            OR public.is_supervisor_or_admin()
        )
    );

-- DELETE: Owner ou manager peut supprimer
DROP POLICY IF EXISTS "notes_photos_delete" ON storage.objects;
CREATE POLICY "notes_photos_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'notes-photos'
        AND (
            owner = auth.uid()
            OR public.is_supervisor_or_admin()
        )
    );

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.2', 'Storage buckets (documents, notes-photos) with RLS policies')
ON CONFLICT (version) DO NOTHING;
