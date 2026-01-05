-- Migration: Create pointages table for v2.0.0
-- Application Mobile Poseur - Suivi des temps

-- Table pointages
CREATE TABLE IF NOT EXISTS public.pointages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poseur_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    periode VARCHAR(20) NOT NULL CHECK (periode IN ('matin', 'apres_midi')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('trajet', 'travail')),
    heure_debut TIME,
    heure_fin TIME,
    duree_minutes INTEGER NOT NULL DEFAULT 0,
    mode_saisie VARCHAR(20) NOT NULL CHECK (mode_saisie IN ('chrono', 'manuel')),
    type_trajet VARCHAR(30) CHECK (type_trajet IN ('domicile_chantier', 'entre_chantiers', 'chantier_domicile')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par poseur et date
CREATE INDEX IF NOT EXISTS idx_pointages_poseur_date ON public.pointages(poseur_id, date);
CREATE INDEX IF NOT EXISTS idx_pointages_chantier ON public.pointages(chantier_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_pointages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pointages_updated_at ON public.pointages;
CREATE TRIGGER trigger_pointages_updated_at
    BEFORE UPDATE ON public.pointages
    FOR EACH ROW
    EXECUTE FUNCTION update_pointages_updated_at();

-- RLS Policies
ALTER TABLE public.pointages ENABLE ROW LEVEL SECURITY;

-- Poseurs peuvent voir et modifier leurs propres pointages
CREATE POLICY "Poseurs can view own pointages"
    ON public.pointages FOR SELECT
    USING (auth.uid()::text = poseur_id::text);

CREATE POLICY "Poseurs can insert own pointages"
    ON public.pointages FOR INSERT
    WITH CHECK (auth.uid()::text = poseur_id::text);

CREATE POLICY "Poseurs can update own pointages"
    ON public.pointages FOR UPDATE
    USING (auth.uid()::text = poseur_id::text);

CREATE POLICY "Poseurs can delete own pointages"
    ON public.pointages FOR DELETE
    USING (auth.uid()::text = poseur_id::text);

-- Admin et Superviseur peuvent tout voir
CREATE POLICY "Admin and Superviseur can view all pointages"
    ON public.pointages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'superviseur')
        )
    );

-- Extension notes_chantiers pour réserves et rapports (si colonnes manquantes)
DO $$
BEGIN
    -- Ajout colonne type si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notes_chantiers' AND column_name = 'type') THEN
        ALTER TABLE public.notes_chantiers ADD COLUMN type VARCHAR(20) DEFAULT 'note';
    END IF;

    -- Ajout colonne statut_reserve si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notes_chantiers' AND column_name = 'statut_reserve') THEN
        ALTER TABLE public.notes_chantiers ADD COLUMN statut_reserve VARCHAR(20);
    END IF;

    -- Ajout colonne priorite si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notes_chantiers' AND column_name = 'priorite') THEN
        ALTER TABLE public.notes_chantiers ADD COLUMN priorite VARCHAR(20);
    END IF;
END $$;

COMMENT ON TABLE public.pointages IS 'Suivi des temps de travail et trajets des poseurs - v2.0.0';
