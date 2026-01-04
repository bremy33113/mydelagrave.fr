import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Phone,
    Mail,
    Building2,
    MapPin,
    RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/database.types';
import { CreateContactModal } from '../components/chantiers/CreateContactModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useUserRole } from '../hooks/useUserRole';

type Client = Tables<'clients'> & {
    ref_clients?: Tables<'ref_clients'> | null;
    ref_job?: Tables<'ref_job'> | null;
};

export function ContactsPage() {
    const { userId, isAdmin, isSuperviseur, isChargeAffaire, isPoseur } = useUserRole();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Tables<'clients'> | null>(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    const [categories, setCategories] = useState<Tables<'ref_clients'>[]>([]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('clients')
                .select('*, ref_clients(*), ref_job(*)')
                .order('nom', { ascending: true });

            setClients((data as Client[]) || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRefs = async () => {
        const { data } = await supabase.from('ref_clients').select('*');
        setCategories((data as Tables<'ref_clients'>[]) || []);
    };

    useEffect(() => {
        fetchClients();
        fetchRefs();
    }, []);

    const filteredClients = clients.filter((client) => {
        const matchesSearch =
            !searchQuery ||
            client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.entreprise?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            !categoryFilter || client.client_categorie === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const openCreateModal = () => {
        setEditingClient(null);
        setShowModal(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setShowModal(true);
    };

    const handleModalSuccess = () => {
        fetchClients();
    };

    const handleDelete = (client: Client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const confirmDeleteClient = async () => {
        if (!clientToDelete) return;

        try {
            await supabase
                .from('clients')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', clientToDelete.id);
            fetchClients();
            setShowDeleteModal(false);
            setClientToDelete(null);
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Contacts</h1>
                    <p className="text-slate-400">{clients.length} contact(s)</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchClients}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {!isPoseur && (
                        <button
                            onClick={openCreateModal}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau contact
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un contact..."
                        className="input-field pl-12"
                        data-testid="contacts-search-input"
                    />
                </div>
                <select
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                    className="input-field w-48"
                    data-testid="contacts-category-filter"
                >
                    <option value="">Toutes catégories</option>
                    {categories.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                            {cat.icon} {cat.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p>Aucun contact trouvé</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className="glass-card p-4 animate-fadeIn"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                            style={{
                                                backgroundColor: `${client.ref_clients?.color || '#64748B'}20`,
                                            }}
                                        >
                                            {client.ref_clients?.icon || '👤'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{client.nom}</h3>
                                            {client.ref_job && (
                                                <p className="text-xs text-slate-400">
                                                    {client.ref_job.icon} {client.ref_job.label}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {(isAdmin || isSuperviseur || (isChargeAffaire && userId && client.created_by === userId)) && (
                                            <button
                                                onClick={() => openEditModal(client)}
                                                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                                title="Modifier le contact"
                                                data-testid={`contact-edit-btn-${client.id}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {(isAdmin || isSuperviseur || (isChargeAffaire && userId && client.created_by === userId)) && (
                                            <button
                                                onClick={() => handleDelete(client)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Supprimer le contact"
                                                data-testid={`contact-delete-btn-${client.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {client.entreprise && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Building2 className="w-4 h-4" />
                                            <span>{client.entreprise}</span>
                                        </div>
                                    )}
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Mail className="w-4 h-4" />
                                            <a
                                                href={`mailto:${client.email}`}
                                                className="hover:text-blue-400 transition-colors truncate"
                                            >
                                                {client.email}
                                            </a>
                                        </div>
                                    )}
                                    {client.telephone && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Phone className="w-4 h-4" />
                                            <a
                                                href={`tel:${client.telephone}`}
                                                className="hover:text-blue-400 transition-colors"
                                            >
                                                {client.telephone}
                                            </a>
                                        </div>
                                    )}
                                    {client.adresse && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{client.adresse}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <CreateContactModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleModalSuccess}
                editingClient={editingClient}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setClientToDelete(null);
                }}
                onConfirm={confirmDeleteClient}
                title="Supprimer le contact"
                message={`Êtes-vous sûr de vouloir supprimer "${clientToDelete?.nom}" ?`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    );
}
