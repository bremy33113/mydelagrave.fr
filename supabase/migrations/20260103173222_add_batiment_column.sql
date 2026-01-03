-- Add batiment column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS batiment TEXT;

-- Update RLS policies if necessary (usually not needed for new columns if policy covers all columns using *)
COMMENT ON COLUMN clients.batiment IS 'Complément d''adresse (Bâtiment, étage, etc.)';
