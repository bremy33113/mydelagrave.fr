/**
 * Supabase Client Factory
 * Supporte deux modes :
 * - Mock (localStorage) pour le développement local
 * - Réel (Supabase distant) pour la production
 *
 * Configuration via variables d'environnement :
 * - VITE_USE_MOCK=true  → Mode développement (défaut)
 * - VITE_USE_MOCK=false → Mode production (nécessite VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import {
    ref_roles_user,
    ref_statuts_chantier,
    ref_categories_chantier,
    ref_types_chantier,
    ref_clients,
    ref_job,
    ref_types_document,
    mockPasswords,
    initial_users,
    initial_clients,
    initial_chantiers,
    initial_phases_chantiers,
    initial_notes_chantiers,
    initial_chantiers_contacts,
    initial_documents_chantiers,
    initial_pointages,
} from './mockData';

// ============ TYPES ============

interface MockUser {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
}

interface MockSession {
    user: MockUser;
    access_token: string;
}

interface AuthResponse {
    data: { user: MockUser | null; session: MockSession | null };
    error: { message: string } | null;
}

type AuthChangeCallback = (event: string, session: MockSession | null) => void;

// ============ STORAGE KEYS ============

const STORAGE_PREFIX = 'mock_db_';
const AUTH_SESSION_KEY = 'mock_auth_session';

// ============ HELPERS ============

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function getTable<T>(tableName: string): T[] {
    const key = STORAGE_PREFIX + tableName;
    const stored = localStorage.getItem(key);
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function setTable<T>(tableName: string, data: T[]): void {
    const key = STORAGE_PREFIX + tableName;
    localStorage.setItem(key, JSON.stringify(data));
}

function initializeDataIfNeeded(): void {
    // Vérifier si les données sont déjà initialisées
    const isInitialized = localStorage.getItem(STORAGE_PREFIX + 'initialized');

    if (!isInitialized) {
        // Initialiser les tables de référence
        setTable('ref_roles_user', ref_roles_user);
        setTable('ref_statuts_chantier', ref_statuts_chantier);
        setTable('ref_categories_chantier', ref_categories_chantier);
        setTable('ref_types_chantier', ref_types_chantier);
        setTable('ref_clients', ref_clients);
        setTable('ref_job', ref_job);
        setTable('ref_types_document', ref_types_document);

        // Initialiser les données de démo
        setTable('users', initial_users);
        setTable('clients', initial_clients);
        setTable('chantiers', initial_chantiers);
        setTable('phases_chantiers', initial_phases_chantiers);
        setTable('notes_chantiers', initial_notes_chantiers);
        setTable('chantiers_contacts', initial_chantiers_contacts);
        setTable('documents_chantiers', initial_documents_chantiers);

        localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
        console.info('📦 Mock database initialized with demo data');
    }

    // Migration: ajouter les tables manquantes (pour les installations existantes)
    migrateIfNeeded();
}

function migrateIfNeeded(): void {
    // Migration v0.6.0: Ajouter ref_types_document si manquant
    if (!localStorage.getItem(STORAGE_PREFIX + 'ref_types_document')) {
        setTable('ref_types_document', ref_types_document);
        console.info('📦 Migration: ref_types_document ajouté');
    }

    // Migration v0.6.0: Ajouter documents_chantiers si manquant
    if (!localStorage.getItem(STORAGE_PREFIX + 'documents_chantiers')) {
        setTable('documents_chantiers', initial_documents_chantiers);
        console.info('📦 Migration: documents_chantiers ajouté');
    }

    // Migration v1.5.0: Ajouter pointages si manquant
    if (!localStorage.getItem(STORAGE_PREFIX + 'pointages')) {
        setTable('pointages', initial_pointages);
        console.info('📦 Migration: pointages ajouté');
    }

    // Migration v1.5.1: Réinitialiser phases et chantiers pour les dates de cette semaine
    if (!localStorage.getItem(STORAGE_PREFIX + 'migration_v1_5_1')) {
        setTable('phases_chantiers', initial_phases_chantiers);
        setTable('chantiers', initial_chantiers);
        localStorage.setItem(STORAGE_PREFIX + 'migration_v1_5_1', 'true');
        console.info('📦 Migration v1.5.1: phases_chantiers et chantiers mis à jour');
    }

    // Migration v1.5.0: Mettre à jour notes_chantiers avec nouveaux champs
    const notes = getTable<Record<string, unknown>>('notes_chantiers');
    let notesMigrated = false;
    notes.forEach((note) => {
        if (note.type === undefined) {
            note.type = 'note';
            notesMigrated = true;
        }
        if (note.localisation === undefined) note.localisation = null;
        if (note.statut_reserve === undefined) note.statut_reserve = null;
        if (note.priorite === undefined) note.priorite = null;
        if (note.traite_par === undefined) note.traite_par = null;
        if (note.date_traitement === undefined) note.date_traitement = null;
        if (note.date_resolution === undefined) note.date_resolution = null;
        if (note.commentaire_resolution === undefined) note.commentaire_resolution = null;
        if (note.phase_id === undefined) note.phase_id = null;
        if (note.heure_arrivee === undefined) note.heure_arrivee = null;
        if (note.heure_depart === undefined) note.heure_depart = null;
    });
    if (notesMigrated) {
        setTable('notes_chantiers', notes);
        console.info('📦 Migration: notes_chantiers mis à jour avec nouveaux champs');
    }

    // Migration v2.3.0: Ajouter historique_phases si manquant
    if (!localStorage.getItem(STORAGE_PREFIX + 'historique_phases')) {
        setTable('historique_phases', []);
        console.info('📦 Migration: historique_phases ajouté');
    }
}

// ============ MOCK AUTH ============

class MockAuth {
    private listeners: AuthChangeCallback[] = [];

    constructor() {
        initializeDataIfNeeded();
    }

    async signInWithPassword({ email, password }: { email: string; password: string }): Promise<AuthResponse> {
        // Combiner les mots de passe statiques et ceux du localStorage
        const storedPasswords = JSON.parse(localStorage.getItem('mock_passwords') || '{}');
        const allPasswords = { ...mockPasswords, ...storedPasswords };
        const validPassword = allPasswords[email];

        if (!validPassword || validPassword !== password) {
            return {
                data: { user: null, session: null },
                error: { message: 'Invalid login credentials' },
            };
        }

        const users = getTable<{ id: string; email: string; suspended: boolean }>('users');
        const user = users.find((u) => u.email === email);

        if (!user) {
            return {
                data: { user: null, session: null },
                error: { message: 'User not found' },
            };
        }

        if (user.suspended) {
            return {
                data: { user: null, session: null },
                error: { message: 'User account is suspended' },
            };
        }

        const session: MockSession = {
            user: { id: user.id, email: user.email },
            access_token: 'mock_token_' + generateUUID(),
        };

        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        this.notifyListeners('SIGNED_IN', session);

        return {
            data: { user: session.user, session },
            error: null,
        };
    }

    async signUp({
        email,
        password,
        options,
    }: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
    }): Promise<AuthResponse> {
        const users = getTable<{ id: string; email: string }>('users');
        const existingUser = users.find((u) => u.email === email);

        if (existingUser) {
            return {
                data: { user: null, session: null },
                error: { message: 'User already registered' },
            };
        }

        const newUser = {
            id: generateUUID(),
            email,
            first_name: (options?.data?.first_name as string) || null,
            last_name: (options?.data?.last_name as string) || null,
            role: 'poseur',
            suspended: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        users.push(newUser);
        setTable('users', users);

        // Sauvegarder le mot de passe pour le mock
        const passwords = { ...mockPasswords, [email]: password };
        localStorage.setItem('mock_passwords', JSON.stringify(passwords));

        const session: MockSession = {
            user: { id: newUser.id, email: newUser.email },
            access_token: 'mock_token_' + generateUUID(),
        };

        // Si une session existe déjà (ex: admin créant un user), ne pas la remplacer
        const currentSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (!currentSession) {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
            this.notifyListeners('SIGNED_IN', session);
        }

        return {
            data: { user: session.user, session: currentSession ? null : session },
            error: null,
        };
    }

    async signOut(): Promise<{ error: null }> {
        localStorage.removeItem(AUTH_SESSION_KEY);
        this.notifyListeners('SIGNED_OUT', null);
        return { error: null };
    }

    async getSession(): Promise<{ data: { session: MockSession | null } }> {
        const stored = localStorage.getItem(AUTH_SESSION_KEY);
        const session = stored ? JSON.parse(stored) : null;
        return { data: { session } };
    }

    async setSession({ access_token }: { access_token: string; refresh_token: string }): Promise<{ data: { session: MockSession | null }; error: null }> {
        // Restore session from tokens (mock: reconstruct from localStorage or token data)
        // In mock mode, we store the full session, so we can just look it up
        const stored = localStorage.getItem(AUTH_SESSION_KEY);
        if (stored) {
            const session = JSON.parse(stored);
            // Verify tokens match (simplified mock validation)
            if (session.access_token === access_token) {
                this.notifyListeners('TOKEN_REFRESHED', session);
                return { data: { session }, error: null };
            }
        }
        // If tokens provided, create a minimal session restoration
        // This handles the case where admin session is being restored after signUp
        const currentSession = stored ? JSON.parse(stored) : null;
        if (currentSession && access_token) {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(currentSession));
            this.notifyListeners('SIGNED_IN', currentSession);
            return { data: { session: currentSession }, error: null };
        }
        return { data: { session: null }, error: null };
    }

    async getUser(): Promise<{ data: { user: MockUser | null } }> {
        const stored = localStorage.getItem(AUTH_SESSION_KEY);
        const session = stored ? JSON.parse(stored) : null;
        return { data: { user: session?.user || null } };
    }

    onAuthStateChange(callback: AuthChangeCallback): { data: { subscription: { unsubscribe: () => void } } } {
        this.listeners.push(callback);

        // Notifier immédiatement avec la session actuelle
        const stored = localStorage.getItem(AUTH_SESSION_KEY);
        const session = stored ? JSON.parse(stored) : null;
        if (session) {
            setTimeout(() => callback('INITIAL_SESSION', session), 0);
        }

        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        this.listeners = this.listeners.filter((l) => l !== callback);
                    },
                },
            },
        };
    }

    private notifyListeners(event: string, session: MockSession | null): void {
        this.listeners.forEach((callback) => callback(event, session));
    }
}

// ============ MOCK QUERY BUILDER ============

interface QueryState {
    tableName: string;
    selectColumns: string;
    filters: Array<{ column: string; operator: string; value: unknown }>;
    orderColumn: string | null;
    orderAscending: boolean;
    limitCount: number | null;
    isSingle: boolean;
    insertData: unknown[] | null;
    updateData: Record<string, unknown> | null;
    isDelete: boolean;
}

class MockQueryBuilder {
    private state: QueryState;

    constructor(tableName: string) {
        this.state = {
            tableName,
            selectColumns: '*',
            filters: [],
            orderColumn: null,
            orderAscending: true,
            limitCount: null,
            isSingle: false,
            insertData: null,
            updateData: null,
            isDelete: false,
        };
    }

    select(columns: string = '*'): this {
        this.state.selectColumns = columns;
        return this;
    }

    insert(data: unknown | unknown[]): this {
        this.state.insertData = Array.isArray(data) ? data : [data];
        return this;
    }

    update(data: Record<string, unknown>): this {
        this.state.updateData = data;
        return this;
    }

    delete(): this {
        this.state.isDelete = true;
        return this;
    }

    eq(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'eq', value });
        return this;
    }

    neq(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'neq', value });
        return this;
    }

    is(column: string, value: null): this {
        this.state.filters.push({ column, operator: 'is', value });
        return this;
    }

    not(column: string, operator: string, value: unknown): this {
        this.state.filters.push({ column, operator: `not_${operator}`, value });
        return this;
    }

    in(column: string, values: unknown[]): this {
        this.state.filters.push({ column, operator: 'in', value: values });
        return this;
    }

    gte(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'gte', value });
        return this;
    }

    lte(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'lte', value });
        return this;
    }

    gt(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'gt', value });
        return this;
    }

    lt(column: string, value: unknown): this {
        this.state.filters.push({ column, operator: 'lt', value });
        return this;
    }

    order(column: string, options?: { ascending?: boolean }): this {
        this.state.orderColumn = column;
        this.state.orderAscending = options?.ascending ?? true;
        return this;
    }

    limit(count: number): this {
        this.state.limitCount = count;
        return this;
    }

    single(): this {
        this.state.isSingle = true;
        return this;
    }

    // Exécution de la requête
    async then<TResult>(
        onfulfilled?: (value: { data: unknown; error: null } | { data: null; error: { message: string } }) => TResult
    ): Promise<TResult> {
        const result = this.execute();
        return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
    }

    private execute(): { data: unknown; error: null } | { data: null; error: { message: string } } {
        try {
            // INSERT
            if (this.state.insertData) {
                return this.executeInsert();
            }

            // UPDATE
            if (this.state.updateData) {
                return this.executeUpdate();
            }

            // DELETE
            if (this.state.isDelete) {
                return this.executeDelete();
            }

            // SELECT
            return this.executeSelect();
        } catch (error) {
            return { data: null, error: { message: (error as Error).message } };
        }
    }

    private executeSelect(): { data: unknown; error: null } {
        let data = getTable<Record<string, unknown>>(this.state.tableName);

        // Appliquer les filtres
        data = this.applyFilters(data);

        // Appliquer les relations (select avec jointures)
        if (this.state.selectColumns !== '*' && this.state.selectColumns.includes(':')) {
            data = this.applyRelations(data);
        }

        // Appliquer le tri
        if (this.state.orderColumn) {
            data = this.applyOrder(data);
        }

        // Appliquer la limite
        if (this.state.limitCount !== null) {
            data = data.slice(0, this.state.limitCount);
        }

        // Retourner un seul élément si demandé
        if (this.state.isSingle) {
            return { data: data[0] || null, error: null };
        }

        return { data, error: null };
    }

    private executeInsert(): { data: unknown; error: null } {
        const table = getTable<Record<string, unknown>>(this.state.tableName);
        const now = new Date().toISOString();

        const newItems = (this.state.insertData ?? []).map((item) => ({
            id: generateUUID(),
            ...item as object,
            created_at: now,
            updated_at: now,
        }));

        table.push(...newItems);
        setTable(this.state.tableName, table);

        if (this.state.isSingle) {
            return { data: newItems[0], error: null };
        }
        return { data: newItems, error: null };
    }

    private executeUpdate(): { data: unknown; error: null } {
        let table = getTable<Record<string, unknown>>(this.state.tableName);
        const now = new Date().toISOString();
        let updatedItem: Record<string, unknown> | null = null;

        table = table.map((item) => {
            if (this.matchesFilters(item)) {
                updatedItem = { ...item, ...this.state.updateData, updated_at: now };
                return updatedItem;
            }
            return item;
        });

        setTable(this.state.tableName, table);

        if (this.state.isSingle) {
            return { data: updatedItem, error: null };
        }
        return { data: table.filter((item) => this.matchesFilters(item)), error: null };
    }

    private executeDelete(): { data: unknown; error: null } {
        let table = getTable<Record<string, unknown>>(this.state.tableName);
        const deleted = table.filter((item) => this.matchesFilters(item));
        table = table.filter((item) => !this.matchesFilters(item));
        setTable(this.state.tableName, table);
        return { data: deleted, error: null };
    }

    private applyFilters(data: Record<string, unknown>[]): Record<string, unknown>[] {
        return data.filter((item) => this.matchesFilters(item));
    }

    private matchesFilters(item: Record<string, unknown>): boolean {
        return this.state.filters.every((filter) => {
            const value = item[filter.column];

            switch (filter.operator) {
                case 'eq':
                    return value === filter.value;
                case 'neq':
                    return value !== filter.value;
                case 'is':
                    // Treat undefined as null for .is('column', null) queries
                    if (filter.value === null) {
                        return value === null || value === undefined;
                    }
                    return value === filter.value;
                case 'not_is':
                    // Treat undefined as null for .not('column', 'is', null) queries
                    if (filter.value === null) {
                        return value !== null && value !== undefined;
                    }
                    return value !== filter.value;
                case 'in':
                    return (filter.value as unknown[]).includes(value);
                case 'gte':
                    return value !== null && value !== undefined && value >= (filter.value as string | number);
                case 'lte':
                    return value !== null && value !== undefined && value <= (filter.value as string | number);
                case 'gt':
                    return value !== null && value !== undefined && value > (filter.value as string | number);
                case 'lt':
                    return value !== null && value !== undefined && value < (filter.value as string | number);
                default:
                    return true;
            }
        });
    }

    private applyRelations(data: Record<string, unknown>[]): Record<string, unknown>[] {
        // Parser le select pour trouver les relations
        // Format: *, client:clients(*), ref_statuts_chantier(*), phases_chantiers(*)
        const relations = this.parseSelectRelations();

        return data.map((item) => {
            const result = { ...item };

            relations.forEach((relation) => {
                const foreignTable = getTable<Record<string, unknown>>(relation.table);

                if (relation.type === 'one-to-many') {
                    // One-to-many: find all related items where foreignKey matches this item's id
                    const related = foreignTable.filter((r) => r[relation.foreignKey] === item.id);
                    result[relation.alias] = related;
                } else {
                    // Many-to-one: find single related item
                    const foreignKey = item[relation.foreignKey];
                    if (foreignKey) {
                        const related = foreignTable.find((r) => r[relation.primaryKey] === foreignKey);
                        result[relation.alias] = related || null;
                    } else {
                        result[relation.alias] = null;
                    }
                }
            });

            return result;
        });
    }

    private parseSelectRelations(): Array<{
        alias: string;
        table: string;
        foreignKey: string;
        primaryKey: string;
        type: 'many-to-one' | 'one-to-many';
    }> {
        const relations: Array<{ alias: string; table: string; foreignKey: string; primaryKey: string; type: 'many-to-one' | 'one-to-many' }> = [];

        // Split by comma but not inside parentheses
        // e.g., "*, uploader:users!uploaded_by(first_name, last_name)" should split into:
        // ["*", "uploader:users!uploaded_by(first_name, last_name)"]
        const selectParts: string[] = [];
        let current = '';
        let depth = 0;
        for (const char of this.state.selectColumns) {
            if (char === '(') depth++;
            else if (char === ')') depth--;

            if (char === ',' && depth === 0) {
                selectParts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.trim()) {
            selectParts.push(current.trim());
        }

        // One-to-many relations (child tables that reference parent via foreign key)
        const oneToManyTables = ['phases_chantiers', 'notes_chantiers', 'chantiers_contacts', 'documents_chantiers'];

        selectParts.forEach((part) => {
            // Format: client:clients(*) ou uploader:users!uploaded_by(first_name, last_name) ou phases_chantiers(*)
            const colonMatch = part.match(/(\w+):(\w+)(?:!(\w+))?\(([^)]+)\)/);
            const simpleMatch = part.match(/(\w+)\(([^)]+)\)/);

            if (colonMatch) {
                // client:clients(*) or uploader:users!uploaded_by(*)
                const [, alias, table, explicitForeignKey] = colonMatch;
                // Use explicit foreign key if provided, otherwise fallback to convention
                const foreignKey = explicitForeignKey || (alias === 'creator' ? 'created_by' : `${alias}_id`);
                relations.push({
                    alias,
                    table,
                    foreignKey,
                    primaryKey: 'id',
                    type: 'many-to-one',
                });
            } else if (simpleMatch) {
                const [, table] = simpleMatch;

                // Check if it's a one-to-many relation
                if (oneToManyTables.includes(table)) {
                    // One-to-many: phases_chantiers(*), notes_chantiers(*), chantiers_contacts(*)
                    relations.push({
                        alias: table,
                        table,
                        foreignKey: `${this.state.tableName.replace(/s$/, '')}_id`, // chantiers -> chantier_id
                        primaryKey: 'id',
                        type: 'one-to-many',
                    });
                } else if (table.startsWith('ref_')) {
                    // ref_statuts_chantier(*)
                    const fkName = table.replace('ref_', '').replace('_chantier', '').replace('s_', '_');
                    relations.push({
                        alias: table,
                        table,
                        foreignKey: fkName === 'statuts' ? 'statut' : fkName,
                        primaryKey: 'code',
                        type: 'many-to-one',
                    });
                }
            }
        });

        return relations;
    }

    private applyOrder(data: Record<string, unknown>[]): Record<string, unknown>[] {
        return [...data].sort((a, b) => {
            const orderCol = this.state.orderColumn;
            if (!orderCol) return 0;
            const aVal = a[orderCol];
            const bVal = b[orderCol];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return this.state.orderAscending ? comparison : -comparison;
        });
    }
}

// ============ MOCK STORAGE ============

class MockStorageBucket {
    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    async upload(
        path: string,
        file: File
    ): Promise<{ data: { path: string } | null; error: { message: string } | null }> {
        try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const storageKey = `mock_storage_${this.bucketName}`;
            const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
            storage[path] = base64;
            localStorage.setItem(storageKey, JSON.stringify(storage));

            return { data: { path }, error: null };
        } catch (error) {
            return { data: null, error: { message: (error as Error).message } };
        }
    }

    async remove(paths: string[]): Promise<{ error: { message: string } | null }> {
        const storageKey = `mock_storage_${this.bucketName}`;
        const storage: Record<string, unknown> = JSON.parse(localStorage.getItem(storageKey) || '{}');

        const filteredStorage = Object.fromEntries(
            Object.entries(storage).filter(([key]) => !paths.includes(key))
        );

        localStorage.setItem(storageKey, JSON.stringify(filteredStorage));
        return { error: null };
    }

    getPublicUrl(path: string): { data: { publicUrl: string } } {
        const storageKey = `mock_storage_${this.bucketName}`;
        const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const base64 = storage[path] || '';
        return { data: { publicUrl: base64 } };
    }

    async createSignedUrl(path: string, _expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
        const storageKey = `mock_storage_${this.bucketName}`;
        const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const base64 = storage[path];
        if (!base64) {
            return { data: null, error: new Error('File not found') };
        }
        // In mock mode, return base64 directly as the "signed URL"
        return { data: { signedUrl: base64 }, error: null };
    }
}

class MockStorage {
    from(bucketName: string): MockStorageBucket {
        return new MockStorageBucket(bucketName);
    }
}

// ============ MOCK SUPABASE CLIENT ============

class MockSupabaseClient {
    auth: MockAuth;
    storage: MockStorage;

    constructor() {
        this.auth = new MockAuth();
        this.storage = new MockStorage();
    }

    from(tableName: string): MockQueryBuilder {
        return new MockQueryBuilder(tableName);
    }

    // Fonction RPC simulée
    async rpc(
        functionName: string,
        _params?: Record<string, unknown>
    ): Promise<{ data: unknown; error: null }> {
        if (functionName === 'get_my_role') {
            const session = await this.auth.getSession();
            if (!session.data.session) {
                return { data: null, error: null };
            }
            const users = getTable<{ id: string; role: string }>('users');
            const user = users.find((u) => u.id === session.data.session?.user.id);
            return { data: user?.role || null, error: null };
        }

        return { data: null, error: null };
    }
}

// ============ CLIENT FACTORY ============

// Déterminer le mode d'exécution
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Crée le client Supabase approprié selon la configuration
 * Note: On utilise 'any' pour éviter les conflits de types entre mock et réel
 * Les deux clients ont la même API, donc c'est sûr à l'exécution
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createSupabaseClient(): any {
    if (USE_MOCK) {
        console.info('🔧 Mode développement (localStorage)');
        return new MockSupabaseClient();
    }

    // Mode production : utiliser le vrai client Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Variables Supabase manquantes !');
        console.error('   Définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
        console.error('   Ou activer le mode mock avec VITE_USE_MOCK=true');
        throw new Error('Configuration Supabase manquante. Vérifiez vos variables d\'environnement.');
    }

    console.info('🚀 Mode production (Supabase distant)');
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export du client (mock ou réel selon la configuration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createSupabaseClient();

// Fonction utilitaire pour réinitialiser les données (mock mode only)
export function resetMockDatabase(): void {
    if (!USE_MOCK) {
        console.warn('⚠️ resetMockDatabase() n\'est disponible qu\'en mode mock');
        return;
    }

    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX) || key === AUTH_SESSION_KEY) {
            localStorage.removeItem(key);
        }
    });
    initializeDataIfNeeded();
    console.info('🔄 Mock database reset');
}

// Export pour vérifier le mode actuel
export const isUsingMock = USE_MOCK;
