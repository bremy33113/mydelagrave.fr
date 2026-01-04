-- =============================================
-- MyDelagrave Migration v1.0.6
-- Migration: 00006_add_clients_deleted_at.sql
-- Description: Ajouter soft delete à la table clients
-- =============================================

-- Ajouter la colonne deleted_at à clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Créer un index pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);

-- =============================================
-- VERSION
-- =============================================

INSERT INTO schema_version (version, description)
VALUES ('1.0.6', 'Add deleted_at column to clients table for soft delete')
ON CONFLICT (version) DO NOTHING;
