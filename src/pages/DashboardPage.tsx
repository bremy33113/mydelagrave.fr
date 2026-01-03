import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { KPIBar } from '../components/dashboard/KPIBar';
import { ChantierCard } from '../components/chantiers/ChantierCard';
import { ChantierDetail } from '../components/chantiers/ChantierDetail';
import { CreateChantierModal } from '../components/chantiers/CreateChantierModal';
import { PhasesModal } from '../components/chantiers/PhasesModal';
import { AddContactModal } from '../components/chantiers/AddContactModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Tables } from '../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
};

export function DashboardPage() {
    const { userId, canViewAllChantiers, loading: roleLoading, isPoseur } = useUserRole();
    const [chantiers, setChantiers] = useState<Chantier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Modal states
    const [showChantierModal, setShowChantierModal] = useState(false);
    const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
    const [showPhasesModal, setShowPhasesModal] = useState(false);
    const [showContactsModal, setShowContactsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchChantiers = async () => {
        if (roleLoading) return; // Wait for role to be loaded

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('chantiers')
                .select(`
          *,
          client:clients(*),
          charge_affaire:users(*),
          ref_categories_chantier(*),
          ref_statuts_chantier(*)
        `)
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;

            let filteredData = (data as Chantier[]) || [];

            // Apply role-based filtering
            if (!canViewAllChantiers && userId) {
                // Charge d'affaire sees only assigned chantiers
                // Poseur sees only assigned chantiers (via poseur_id or phases - simplified to chantiers assignment here)
                filteredData = filteredData.filter(
                    (c) => c.charge_affaire_id === userId || c.poseur_id === userId
                );
            } else if (!canViewAllChantiers && !userId) {
                // If role loaded but no user ID (shouldn't happen if logged in), show nothing
                filteredData = [];
            }

            setChantiers(filteredData);

            // Auto-select first if none selected
            if (!selectedId && filteredData && filteredData.length > 0) {
                setSelectedId(filteredData[0].id);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChantiers();
    }, [userId, canViewAllChantiers, roleLoading]);

    // Filter chantiers based on search and status
    const filteredChantiers = useMemo(() => {
        let result = chantiers;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.nom.toLowerCase().includes(query) ||
                    c.reference?.toLowerCase().includes(query) ||
                    c.client?.nom.toLowerCase().includes(query) ||
                    c.client?.entreprise?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter) {
            switch (statusFilter) {
                case 'non_planifie':
                    result = result.filter((c) => !c.date_debut && c.statut !== 'termine');
                    break;
                case 'non_attribue':
                    result = result.filter(
                        (c) => !c.charge_affaire_id && c.statut !== 'termine'
                    );
                    break;
                case 'en_cours':
                    result = result.filter(
                        (c) => c.statut === 'en_cours' || c.statut === 'pose_en_cours'
                    );
                    break;
                default:
                    result = result.filter((c) => c.statut === statusFilter);
            }
        }

        return result;
    }, [chantiers, searchQuery, statusFilter]);

    const selectedChantier = useMemo(
        () => chantiers.find((c) => c.id === selectedId),
        [chantiers, selectedId]
    );

    // Open delete confirmation modal
    const handleDelete = () => {
        if (!selectedChantier) return;
        setShowDeleteConfirm(true);
    };

    // Actual delete action (called from modal)
    const confirmDelete = async () => {
        if (!selectedChantier) return;

        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('chantiers')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', selectedChantier.id);

            if (error) throw error;

            setSelectedId(null);
            setShowDeleteConfirm(false);
            fetchChantiers();
        } catch {
            alert('Erreur lors de la suppression');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
                    <p className="text-slate-400">
                        {chantiers.length} chantier{chantiers.length !== 1 ? 's' : ''} au total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchChantiers}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    {!isPoseur && (
                        <button
                            onClick={() => {
                                setEditingChantier(null);
                                setShowChantierModal(true);
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau chantier
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Bar */}
            <div className="mb-6">
                <KPIBar
                    chantiers={chantiers}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Main content: list + detail */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* List panel */}
                <div className="w-2/5 flex flex-col min-h-0">
                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un chantier..."
                            className="input-field !pl-11"
                        />
                    </div>

                    {/* Active filter indicator */}
                    {statusFilter && (
                        <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <span className="text-sm text-blue-400">
                                Filtré par: {statusFilter.replace('_', ' ')}
                            </span>
                            <button
                                onClick={() => setStatusFilter(null)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                Effacer
                            </button>
                        </div>
                    )}

                    {/* Chantier list */}
                    <div className="flex-1 overflow-auto space-y-3 pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredChantiers.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <p>Aucun chantier trouvé</p>
                            </div>
                        ) : (
                            filteredChantiers.map((chantier) => (
                                <ChantierCard
                                    key={chantier.id}
                                    chantier={chantier}
                                    isSelected={chantier.id === selectedId}
                                    onClick={() => setSelectedId(chantier.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Detail panel */}
                <div className="w-3/5 glass-card overflow-hidden">
                    {selectedChantier ? (
                        <ChantierDetail
                            chantier={selectedChantier}
                            onEdit={!isPoseur ? () => {
                                setEditingChantier(selectedChantier);
                                setShowChantierModal(true);
                            } : undefined}
                            onDelete={!isPoseur ? handleDelete : undefined}
                            onManagePhases={() => setShowPhasesModal(true)}
                            onManageContacts={() => setShowContactsModal(true)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <p>Sélectionnez un chantier pour voir les détails</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateChantierModal
                isOpen={showChantierModal}
                onClose={() => {
                    setShowChantierModal(false);
                    setEditingChantier(null);
                }}
                onSuccess={fetchChantiers}
                editingChantier={editingChantier}
            />

            {selectedChantier && (
                <>
                    <PhasesModal
                        isOpen={showPhasesModal}
                        onClose={() => setShowPhasesModal(false)}
                        chantierId={selectedChantier.id}
                        chantierNom={selectedChantier.nom}
                    />

                    <AddContactModal
                        isOpen={showContactsModal}
                        onClose={() => setShowContactsModal(false)}
                        chantierId={selectedChantier.id}
                        chantierNom={selectedChantier.nom}
                    />

                    <ConfirmModal
                        isOpen={showDeleteConfirm}
                        onClose={() => setShowDeleteConfirm(false)}
                        onConfirm={confirmDelete}
                        title="Supprimer le chantier"
                        message={`Êtes-vous sûr de vouloir supprimer "${selectedChantier.nom}" ? Cette action peut être annulée depuis la corbeille.`}
                        confirmText="Supprimer"
                        cancelText="Annuler"
                        variant="danger"
                        loading={deleteLoading}
                    />
                </>
            )}
        </div>
    );
}
