import type { Tables } from '../../lib/database.types';

export type Note = Tables<'notes_chantiers'> & {
    creator?: { first_name: string; last_name: string } | null;
};

export type Document = Tables<'documents_chantiers'> & {
    uploader?: { first_name: string; last_name: string } | null;
    ref_types_document?: Tables<'ref_types_document'> | null;
};

export type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
};

export type ChantierContact = Tables<'chantiers_contacts'> & {
    clients: (Tables<'clients'> & {
        ref_job?: Tables<'ref_job'> | null;
    }) | null;
};
