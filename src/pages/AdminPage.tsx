import { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Plus,
    Edit,
    Ban,
    CheckCircle,
    X,
    Shield,
    AlertTriangle,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Database,
    MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { ROLE_COLORS, ROLE_HIERARCHY } from '../lib/constants';
import type { Tables } from '../lib/database.types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { RefTableEditor, FieldConfig } from '../components/admin/RefTableEditor';
import { AddressSelectorModal } from '../components/chantiers/AddressSelectorModal';

// Configuration des tables de référence
interface TableConfig {
    key: string;
    title: string;
    icon: string;
    fields: FieldConfig[];
}

const REF_TABLES_CONFIG: TableConfig[] = [
    {
        key: 'ref_statuts_chantier',
        title: 'Statuts',
        icon: '📊',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true, hidden: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
            { key: 'icon', label: 'Icône', type: 'icon' },
            { key: 'color', label: 'Couleur', type: 'color' },
        ],
    },
    {
        key: 'ref_categories_chantier',
        title: 'Catégories',
        icon: '📁',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true, hidden: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
            { key: 'icon', label: 'Icône', type: 'icon' },
        ],
    },
    {
        key: 'ref_types_chantier',
        title: 'Types',
        icon: '📋',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true, hidden: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
        ],
    },
    {
        key: 'ref_clients',
        title: 'Catég. Clients',
        icon: '👥',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true, hidden: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
            { key: 'icon', label: 'Icône', type: 'icon' },
            { key: 'color', label: 'Couleur', type: 'color' },
        ],
    },
    {
        key: 'ref_job',
        title: 'Fonctions',
        icon: '💼',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true, hidden: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
            { key: 'icon', label: 'Icône', type: 'icon' },
            { key: 'color', label: 'Couleur', type: 'color' },
        ],
    },
    {
        key: 'ref_types_document',
        title: 'Types Docs',
        icon: '📄',
        fields: [
            { key: 'id', label: 'ID', type: 'text', primaryKey: true, hidden: true },
            { key: 'libelle', label: 'Libellé', type: 'text', required: true },
            { key: 'icon', label: 'Icône', type: 'icon' },
            { key: 'ordre', label: 'Ordre', type: 'number', hidden: true },
        ],
    },
    {
        key: 'ref_roles_user',
        title: 'Rôles',
        icon: '🔐',
        fields: [
            { key: 'code', label: 'Code', type: 'text', primaryKey: true },
            { key: 'label', label: 'Label', type: 'text', required: true },
            { key: 'level', label: 'Niveau', type: 'number', required: true },
            { key: 'description', label: 'Description', type: 'text' },
        ],
    },
];

type User = Tables<'users'> & {
    ref_roles_user?: Tables<'ref_roles_user'> | null;
};

type SortColumn = 'name' | 'role';
type SortDirection = 'asc' | 'desc';

type MainTab = 'users' | 'referentiels';

export function AdminPage() {
    const { isAdmin, canManageUsers } = useUserRole();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Tables<'ref_roles_user'>[]>([]);

    // Main tab state
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('users');
    const [activeRefTab, setActiveRefTab] = useState(REF_TABLES_CONFIG[0].key);

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role: 'poseur',
        password: '',
        adresse_domicile: '',
        adresse_domicile_latitude: null as number | null,
        adresse_domicile_longitude: null as number | null,
    });

    // Address modal state
    const [showAddressModal, setShowAddressModal] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('users')
                .select('*, ref_roles_user(*)')
                .order('last_name', { ascending: true });

            let filteredUsers = (data as User[]) || [];

            // Supervisors can only see Poseurs and Charge d'Affaires
            if (!isAdmin && canManageUsers) { // implies Supervisor because of logic in useUserRole
                filteredUsers = filteredUsers.filter(u => u.role === 'poseur' || u.role === 'charge_affaire');
            }

            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        const { data } = await supabase
            .from('ref_roles_user')
            .select('*')
            .order('level', { ascending: false });

        let fetchedRoles = (data as Tables<'ref_roles_user'>[]) || [];

        // Supervisors can only assign Poseur role
        if (!isAdmin && canManageUsers) {
            fetchedRoles = fetchedRoles.filter(r => r.code === 'poseur');
        }

        setRoles(fetchedRoles);
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sorting logic
    const toggleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let comparison = 0;

            if (sortColumn === 'name') {
                const nameA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase();
                const nameB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase();
                comparison = nameA.localeCompare(nameB, 'fr');
            } else if (sortColumn === 'role') {
                // Sort by role level (admin > superviseur > charge_affaire > poseur)
                comparison = (ROLE_HIERARCHY[b.role as keyof typeof ROLE_HIERARCHY] || 0) - (ROLE_HIERARCHY[a.role as keyof typeof ROLE_HIERARCHY] || 0);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [users, sortColumn, sortDirection]);

    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="w-4 h-4 opacity-50" />;
        }
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4" />
            : <ArrowDown className="w-4 h-4" />;
    };

    const getRoleColor = (role: string) => {
        return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            first_name: '',
            last_name: '',
            role: 'poseur',
            password: '',
            adresse_domicile: '',
            adresse_domicile_latitude: null,
            adresse_domicile_longitude: null,
        });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role: user.role,
            password: '',
            adresse_domicile: user.adresse_domicile || '',
            adresse_domicile_latitude: user.adresse_domicile_latitude,
            adresse_domicile_longitude: user.adresse_domicile_longitude,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                // Update existing user
                await supabase
                    .from('users')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        role: formData.role,
                        adresse_domicile: formData.adresse_domicile || null,
                        adresse_domicile_latitude: formData.adresse_domicile_latitude,
                        adresse_domicile_longitude: formData.adresse_domicile_longitude,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingUser.id);
            } else {
                // Sauvegarder la session admin actuelle avant de créer le nouvel utilisateur
                const { data: sessionData } = await supabase.auth.getSession();
                const adminSession = sessionData?.session;

                // Create new user
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password || 'password123',
                    options: {
                        data: {
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            role: formData.role,
                        },
                    },
                });

                if (error) throw error;

                // Restaurer la session admin (évite la déconnexion)
                if (adminSession) {
                    await supabase.auth.setSession({
                        access_token: adminSession.access_token,
                        refresh_token: adminSession.refresh_token,
                    });
                }

                // Update role after creation
                const { data: newUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', formData.email)
                    .single();

                if (newUser) {
                    await supabase
                        .from('users')
                        .update({ role: formData.role })
                        .eq('id', (newUser as Tables<'users'>).id);
                }
            }

            setShowModal(false);
            fetchUsers();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };



    const deleteUser = (user: User) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userToDelete.id);

            if (error) throw error;

            fetchUsers();
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err) {
            alert('Erreur lors de la suppression : ' + (err as Error).message);
        }
    };

    // Suspend modal state
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState<User | null>(null);

    const toggleSuspend = (user: User) => {
        setUserToSuspend(user);
        setShowSuspendModal(true);
    };

    const confirmToggleSuspend = async () => {
        if (!userToSuspend) return;

        try {
            await supabase
                .from('users')
                .update({
                    suspended: !userToSuspend.suspended,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userToSuspend.id);

            fetchUsers();
            setShowSuspendModal(false);
            setUserToSuspend(null);
        } catch {
            alert('Erreur lors de la mise à jour');
        }
    };

    if (!canManageUsers) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
                    <p className="text-slate-400">
                        Vous n'avez pas les permissions pour accéder à cette page.
                    </p>
                </div>
            </div>
        );
    }

    const activeRefConfig = REF_TABLES_CONFIG.find(t => t.key === activeRefTab);

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {activeMainTab === 'users' ? (
                                <Users className="w-7 h-7 text-blue-400" />
                            ) : (
                                <Database className="w-7 h-7 text-blue-400" />
                            )}
                            Administration
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {activeMainTab === 'users' ? 'Gestion des utilisateurs' : 'Gestion des référentiels'}
                        </p>
                    </div>
                    {activeMainTab === 'users' && (
                        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nouvel utilisateur
                        </button>
                    )}
                </div>

                {/* Main tabs */}
                <div className="flex gap-2 border-b border-slate-700 pb-4">
                    <button
                        onClick={() => setActiveMainTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            activeMainTab === 'users'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Utilisateurs</span>
                    </button>
                    <button
                        onClick={() => setActiveMainTab('referentiels')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            activeMainTab === 'referentiels'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                    >
                        <Database className="w-4 h-4" />
                        <span className="font-medium">Référentiels</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeMainTab === 'users' ? (
                /* Users table */
                <div className="flex-1 overflow-auto">
                    <div className="glass-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left p-4 text-sm font-medium text-slate-400">
                                    <button
                                        onClick={() => toggleSort('name')}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                        data-testid="sort-by-name"
                                    >
                                        Utilisateur
                                        {getSortIcon('name')}
                                    </button>
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400">
                                    Email
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400">
                                    <button
                                        onClick={() => toggleSort('role')}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                        data-testid="sort-by-role"
                                    >
                                        Rôle
                                        {getSortIcon('role')}
                                    </button>
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400">
                                    Statut
                                </th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">{user.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                                                    user.role
                                                )}`}
                                            >
                                                {user.ref_roles_user?.label || user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.suspended ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                                    <Ban className="w-3 h-3" />
                                                    Suspendu
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Actif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                {/* Edit button: Admin can edit all, Supervisor can only edit Poseurs */}
                                                {(isAdmin || user.role === 'poseur') && (
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                                        title="Modifier"
                                                        data-testid={`user-edit-btn-${user.id}`}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* Suspend/Delete: Admin can manage non-admins, Supervisor can only manage Poseurs */}
                                                {(isAdmin ? user.role !== 'admin' : user.role === 'poseur') && (
                                                    <>
                                                        <button
                                                            onClick={() => toggleSuspend(user)}
                                                            className={`p-2 rounded-lg transition-colors ${user.suspended
                                                                ? 'hover:bg-green-500/20 text-slate-400 hover:text-green-400'
                                                                : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                                                                }`}
                                                            title={user.suspended ? 'Réactiver' : 'Suspendre'}
                                                            data-testid={`user-suspend-btn-${user.id}`}
                                                        >
                                                            {user.suspended ? (
                                                                <CheckCircle className="w-4 h-4" />
                                                            ) : (
                                                                <Ban className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(user)}
                                                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                            title="Supprimer définitivement"
                                                            data-testid={`user-delete-btn-${user.id}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            ) : (
                /* Referentiels section */
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Ref tables tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {REF_TABLES_CONFIG.map((table) => (
                            <button
                                key={table.key}
                                onClick={() => setActiveRefTab(table.key)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                    activeRefTab === table.key
                                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                }`}
                            >
                                <span>{table.icon}</span>
                                <span className="font-medium">{table.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Ref table editor */}
                    <div className="flex-1 overflow-auto">
                        {activeRefConfig && (
                            <RefTableEditor
                                key={activeRefConfig.key}
                                tableName={activeRefConfig.key}
                                title={activeRefConfig.title}
                                fields={activeRefConfig.fields}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div
                        className="glass-card w-full max-w-md p-6 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" data-testid="user-form">
                            {!editingUser && (
                                <>
                                    <div>
                                        <label className="input-label">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            className="input-field"
                                            required
                                            data-testid="user-email-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Mot de passe</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            className="input-field"
                                            placeholder="password123 par défaut"
                                            data-testid="user-password-input"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, first_name: e.target.value })
                                        }
                                        className="input-field"
                                        data-testid="user-prenom-input"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, last_name: e.target.value })
                                        }
                                        className="input-field"
                                        data-testid="user-nom-input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Rôle</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                    }
                                    className="input-field"
                                    data-testid="user-role-select"
                                >
                                    {roles.map((role) => (
                                        <option key={role.code} value={role.code}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Adresse domicile */}
                            <div>
                                <label className="input-label">Adresse domicile</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.adresse_domicile}
                                        readOnly
                                        placeholder="Cliquer sur la carte pour sélectionner"
                                        className="input-field flex-1 cursor-pointer"
                                        onClick={() => setShowAddressModal(true)}
                                        data-testid="user-address-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressModal(true)}
                                        className="btn-secondary flex items-center gap-2"
                                        title="Sélectionner sur la carte"
                                    >
                                        <MapPin className="w-4 h-4" />
                                    </button>
                                </div>
                                {formData.adresse_domicile_latitude && formData.adresse_domicile_longitude && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        GPS: {formData.adresse_domicile_latitude.toFixed(5)}, {formData.adresse_domicile_longitude.toFixed(5)}
                                    </p>
                                )}
                            </div>

                            {!isAdmin && formData.role === 'admin' && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <p className="text-sm">Seuls les admins peuvent créer d'autres admins</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                    data-testid="user-cancel-btn"
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary" data-testid="user-submit-btn">
                                    {editingUser ? 'Enregistrer' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showSuspendModal}
                onClose={() => {
                    setShowSuspendModal(false);
                    setUserToSuspend(null);
                }}
                onConfirm={confirmToggleSuspend}
                title={userToSuspend?.suspended ? "Réactiver l'utilisateur" : "Suspendre l'utilisateur"}
                message={`Voulez-vous vraiment ${userToSuspend?.suspended ? 'réactiver' : 'suspendre'} ${userToSuspend?.first_name} ${userToSuspend?.last_name} ?`}
                confirmText={userToSuspend?.suspended ? "Réactiver" : "Suspendre"}
                variant={userToSuspend?.suspended ? "info" : "warning"}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                onConfirm={confirmDeleteUser}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer définitivement ${userToDelete?.first_name} ${userToDelete?.last_name} ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />

            {/* Address Selector Modal */}
            <AddressSelectorModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSelect={(address, coords) => {
                    setFormData({
                        ...formData,
                        adresse_domicile: address,
                        adresse_domicile_latitude: coords?.lat ?? null,
                        adresse_domicile_longitude: coords?.lng ?? null,
                    });
                    setShowAddressModal(false);
                }}
                initialAddress={formData.adresse_domicile}
                initialCoords={
                    formData.adresse_domicile_latitude && formData.adresse_domicile_longitude
                        ? { lat: formData.adresse_domicile_latitude, lng: formData.adresse_domicile_longitude }
                        : undefined
                }
            />
        </div>
    );
}
