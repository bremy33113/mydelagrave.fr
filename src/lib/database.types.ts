// Types générés simulés pour la base de données MyDelagrave
// Ce fichier sera remplacé par les vrais types Supabase lors de la migration

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string | null;
                    last_name: string | null;
                    role: string;
                    suspended: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            chantiers: {
                Row: {
                    id: string;
                    reference: string | null;
                    nom: string;
                    adresse_livraison: string | null;
                    adresse_livraison_latitude: number | null;
                    adresse_livraison_longitude: number | null;
                    client_id: string | null;
                    charge_affaire_id: string | null;
                    poseur_id: string | null;
                    statut: string;
                    categorie: string | null;
                    type: string | null;
                    date_debut: string | null;
                    date_fin: string | null;
                    reserves_levees: boolean;
                    doe_fourni: boolean;
                    deleted_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['chantiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['chantiers']['Insert']>;
            };
            clients: {
                Row: {
                    id: string;
                    nom: string;
                    email: string | null;
                    telephone: string | null;
                    adresse: string | null;
                    batiment: string | null;
                    entreprise: string | null;
                    job: string | null;
                    client_categorie: string;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['clients']['Insert']>;
            };
            phases_chantiers: {
                Row: {
                    id: string;
                    chantier_id: string;
                    numero_phase: number;
                    libelle: string | null;
                    date_debut: string;
                    date_fin: string;
                    heure_debut: string;
                    duree_heures: number;
                    heure_fin: string;
                    poseur_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['phases_chantiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['phases_chantiers']['Insert']>;
            };
            notes_chantiers: {
                Row: {
                    id: string;
                    chantier_id: string;
                    contenu: string | null;
                    photo_1_url: string | null;
                    photo_2_url: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['notes_chantiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['notes_chantiers']['Insert']>;
            };
            chantiers_contacts: {
                Row: {
                    id: string;
                    chantier_id: string;
                    client_id: string;
                    role: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['chantiers_contacts']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['chantiers_contacts']['Insert']>;
            };
            ref_roles_user: {
                Row: {
                    code: string;
                    label: string;
                    level: number;
                    description: string | null;
                };
                Insert: Database['public']['Tables']['ref_roles_user']['Row'];
                Update: Partial<Database['public']['Tables']['ref_roles_user']['Insert']>;
            };
            ref_statuts_chantier: {
                Row: {
                    code: string;
                    label: string;
                    icon: string | null;
                    color: string | null;
                };
                Insert: Database['public']['Tables']['ref_statuts_chantier']['Row'];
                Update: Partial<Database['public']['Tables']['ref_statuts_chantier']['Insert']>;
            };
            ref_categories_chantier: {
                Row: {
                    code: string;
                    label: string;
                    icon: string | null;
                };
                Insert: Database['public']['Tables']['ref_categories_chantier']['Row'];
                Update: Partial<Database['public']['Tables']['ref_categories_chantier']['Insert']>;
            };
            ref_types_chantier: {
                Row: {
                    code: string;
                    label: string;
                };
                Insert: Database['public']['Tables']['ref_types_chantier']['Row'];
                Update: Partial<Database['public']['Tables']['ref_types_chantier']['Insert']>;
            };
            ref_clients: {
                Row: {
                    code: string;
                    label: string;
                    icon: string | null;
                    color: string | null;
                };
                Insert: Database['public']['Tables']['ref_clients']['Row'];
                Update: Partial<Database['public']['Tables']['ref_clients']['Insert']>;
            };
            ref_job: {
                Row: {
                    code: string;
                    label: string;
                    icon: string | null;
                    color: string | null;
                };
                Insert: Database['public']['Tables']['ref_job']['Row'];
                Update: Partial<Database['public']['Tables']['ref_job']['Insert']>;
            };
        };
        Functions: {
            get_my_role: {
                Args: Record<string, never>;
                Returns: string;
            };
            is_user_suspended: {
                Args: { user_id: string };
                Returns: boolean;
            };
        };
    };
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
