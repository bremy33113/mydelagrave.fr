-- Migration: Add groupe_phase and heures_budget columns for v1.4.0+ sub-phases support
-- These columns were added in the mock client but missing from remote Supabase

-- Add groupe_phase column (default 1 for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'phases_chantiers'
                   AND column_name = 'groupe_phase') THEN
        ALTER TABLE public.phases_chantiers ADD COLUMN groupe_phase INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Add heures_budget column for phase budget tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'phases_chantiers'
                   AND column_name = 'heures_budget') THEN
        ALTER TABLE public.phases_chantiers ADD COLUMN heures_budget INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Add index for groupe_phase queries
CREATE INDEX IF NOT EXISTS idx_phases_groupe ON public.phases_chantiers(chantier_id, groupe_phase);

-- Update existing phases to have groupe_phase = numero_phase (for backward compatibility)
UPDATE public.phases_chantiers
SET groupe_phase = numero_phase
WHERE groupe_phase = 1 AND numero_phase > 1;

COMMENT ON COLUMN public.phases_chantiers.groupe_phase IS 'Group number for sub-phases (1, 2, 3...) - v1.4.0+';
COMMENT ON COLUMN public.phases_chantiers.heures_budget IS 'Budget hours allocated for this phase group - v1.4.0+';

-- Note: Migration applied for v2.0.1 - sub-phases support
