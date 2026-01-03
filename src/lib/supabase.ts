/**
 * Mock Supabase Client
 * Émule l'API Supabase avec persistance localStorage
 * Ce fichier peut être remplacé par le vrai client Supabase lors de la migration
 */

import {
    ref_roles_user,
    ref_statuts_chantier,
    ref_categories_chantier,
    ref_types_chantier,
    ref_clients,
    ref_job,
    mockPasswords,
    initial_users,
    initial_clients,
    initial_chantiers,
    initial_phases_chantiers,
    initial_notes_chantiers,
    initial_chantiers_contacts,
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
    if (localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
        return;
    }

    // Initialiser les tables de référence
    setTable('ref_roles_user', ref_roles_user);
    setTable('ref_statuts_chantier', ref_statuts_chantier);
    setTable('ref_categories_chantier', ref_categories_chantier);
    setTable('ref_types_chantier', ref_types_chantier);
    setTable('ref_clients', ref_clients);
    setTable('ref_job', ref_job);

    // Initialiser les données de démo
    setTable('users', initial_users);
    setTable('clients', initial_clients);
    setTable('chantiers', initial_chantiers);
    setTable('phases_chantiers', initial_phases_chantiers);
    setTable('notes_chantiers', initial_notes_chantiers);
    setTable('chantiers_contacts', initial_chantiers_contacts);

    localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
    console.info('📦 Mock database initialized with demo data');
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
                    return value === filter.value;
                case 'not_is':
                    return value !== filter.value;
                case 'in':
                    return (filter.value as unknown[]).includes(value);
                default:
                    return true;
            }
        });
    }

    private applyRelations(data: Record<string, unknown>[]): Record<string, unknown>[] {
        // Parser le select pour trouver les relations
        // Format: *, client:clients(*), ref_statuts_chantier(*)
        const relations = this.parseSelectRelations();

        return data.map((item) => {
            const result = { ...item };

            relations.forEach((relation) => {
                const foreignTable = getTable<Record<string, unknown>>(relation.table);
                const foreignKey = item[relation.foreignKey];

                if (foreignKey) {
                    const related = foreignTable.find((r) => r[relation.primaryKey] === foreignKey);
                    result[relation.alias] = related || null;
                } else {
                    result[relation.alias] = null;
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
    }> {
        const relations: Array<{ alias: string; table: string; foreignKey: string; primaryKey: string }> = [];
        const selectParts = this.state.selectColumns.split(',').map((s) => s.trim());

        selectParts.forEach((part) => {
            // Format: client:clients(*) ou ref_statuts_chantier(*)
            const colonMatch = part.match(/(\w+):(\w+)(?:!(\w+))?\(\*\)/);
            const simpleMatch = part.match(/(\w+)\(\*\)/);

            if (colonMatch) {
                // client:clients(*) or charge_affaire:users!chantiers_charge_affaire_id_fkey(*)
                const [, alias, table] = colonMatch;
                relations.push({
                    alias,
                    table,
                    foreignKey: `${alias}_id`,
                    primaryKey: 'id',
                });
            } else if (simpleMatch) {
                // ref_statuts_chantier(*)
                const [, table] = simpleMatch;
                // Trouver la clé étrangère correspondante
                if (table.startsWith('ref_')) {
                    const fkName = table.replace('ref_', '').replace('_chantier', '').replace('s_', '_');
                    relations.push({
                        alias: table,
                        table,
                        foreignKey: fkName === 'statuts' ? 'statut' : fkName,
                        primaryKey: 'code',
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

// Export du client mock
export const supabase = new MockSupabaseClient();

// Fonction utilitaire pour réinitialiser les données (dev only)
export function resetMockDatabase(): void {
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX) || key === AUTH_SESSION_KEY) {
            localStorage.removeItem(key);
        }
    });
    initializeDataIfNeeded();
    console.info('🔄 Mock database reset');
}
