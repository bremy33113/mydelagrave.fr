-- =============================================
-- MyDelagrave Auth User Sync v1.0.0
-- Migration: 00005_auth_user_sync.sql
-- Description: Trigger pour synchroniser auth.users vers public.users
-- =============================================

-- =============================================
-- FONCTION: Créer automatiquement un profil utilisateur
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'poseur')  -- Rôle par défaut: poseur
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGER: Exécuter après création d'un utilisateur auth
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SYNCHRONISATION INITIALE: Créer les profils manquants
-- =============================================

-- Insérer tous les utilisateurs auth existants qui n'ont pas de profil public
INSERT INTO public.users (id, email, first_name, last_name, role)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    'admin'  -- Premier utilisateur = admin
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.5', 'Auth user sync trigger + initial sync')
ON CONFLICT (version) DO NOTHING;
