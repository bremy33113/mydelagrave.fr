import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, RefreshCw, AlertCircle, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { KPIBar } from '../components/dashboard/KPIBar';
import { ChantierCard } from '../components/chantiers/ChantierCard';
import { getWeekNumber } from '../lib/dateUtils';
import { ChantierDetail } from '../components/chantiers/ChantierDetail';
import { CreateChantierModal } from '../components/chantiers/CreateChantierModal';
import { PhasesModal } from '../components/chantiers/PhasesModal';
import { AddContactModal } from '../components/chantiers/AddContactModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Tables } from '../lib/database.types';

type PhaseWithPoseur = Tables<'phases_chantiers'> & {
    poseur?: Tables<'users'> | null;
};

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
    phases_chantiers?: PhaseWithPoseur[] | null;
};

export function DashboardPage() {
    const { userId, canViewAllChantiers, loading: roleLoading, isPoseur } = useUserRole();
    const [chantiers, setChantiers] = useState<Chantier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Dropdown filter states (for admin/superviseur only)
    const [filterChargeAffaire, setFilterChargeAffaire] = useState<string>('');
    const [filterStatut, setFilterStatut] = useState<string>('');
    const [filterPoseur, setFilterPoseur] = useState<string>('');

    // Lists for dropdown filters
    const [chargeAffaireList, setChargeAffaireList] = useState<Tables<'users'>[]>([]);
    const [poseurList, setPoseurList] = useState<Tables<'users'>[]>([]);
    const [statutList, setStatutList] = useState<Tables<'ref_statuts_chantier'>[]>([]);

    // Tri des colonnes
    type SortColumn = 'reference' | 'nom' | 'charge_affaire' | 'poseur' | 'semaine' | null;
    type SortDirection = 'asc' | 'desc';
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Expand/Collapse all
    const [allExpanded, setAllExpanded] = useState<boolean | null>(null); // null = individuel, true = tous ouverts, false = tous fermés

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
          charge_affaire:users!charge_affaire_id(*),
          poseur:users!poseur_id(*),
          ref_categories_chantier(*),
          ref_statuts_chantier(*),
          phases_chantiers(*, poseur:users!poseur_id(*))
        `)
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;

            let filteredData = (data as Chantier[]) || [];
            const today = new Date().toISOString().split('T')[0];

            // Apply role-based filtering
            if (!canViewAllChantiers && userId) {
                if (isPoseur) {
                    // Poseur: voir uniquement les chantiers avec des phases attribuées et planifiées
                    filteredData = filteredData.filter((c) => {
                        const hasAssignedUpcomingPhase = c.phases_chantiers?.some(
                            (phase) => phase.poseur_id === userId && phase.date_debut >= today
                        );
                        return hasAssignedUpcomingPhase;
                    });
                } else {
                    // Charge d'affaire: voir ses chantiers assignés
                    filteredData = filteredData.filter(
                        (c) => c.charge_affaire_id === userId
                    );
                }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, canViewAllChantiers, roleLoading, isPoseur]);

    // Détecter les modifications de phases depuis le Planning et rafraîchir
    const lastKnownUpdate = useRef<string | null>(null);
    useEffect(() => {
        const checkForUpdates = () => {
            const phasesUpdate = localStorage.getItem('phases_last_update');
            if (phasesUpdate && phasesUpdate !== lastKnownUpdate.current) {
                lastKnownUpdate.current = phasesUpdate;
                fetchChantiers();
            }
        };

        // Vérifier au montage
        checkForUpdates();

        // Vérifier quand la page redevient visible (navigation retour)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForUpdates();
            }
        };

        // Vérifier sur le focus de la fenêtre
        const handleFocus = () => checkForUpdates();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch filter lists for admin/superviseur
    useEffect(() => {
        if (!canViewAllChantiers) return;

        const fetchFilterLists = async () => {
            // Fetch charge d'affaires
            const { data: caData } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'charge_affaire')
                .eq('suspended', false)
                .order('last_name');
            if (caData && Array.isArray(caData)) setChargeAffaireList(caData as Tables<'users'>[]);

            // Fetch poseurs
            const { data: poseurData } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'poseur')
                .eq('suspended', false)
                .order('last_name');
            if (poseurData && Array.isArray(poseurData)) setPoseurList(poseurData as Tables<'users'>[]);

            // Fetch statuts
            const { data: statutData } = await supabase
                .from('ref_statuts_chantier')
                .select('*')
                .order('code');
            if (statutData && Array.isArray(statutData)) setStatutList(statutData as Tables<'ref_statuts_chantier'>[]);
        };

        fetchFilterLists();
    }, [canViewAllChantiers]);

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

        // Status filter (from KPI bar)
        if (statusFilter) {
            switch (statusFilter) {
                case 'non_planifie':
                    result = result.filter((c) => !c.phases_chantiers || c.phases_chantiers.length === 0);
                    break;
                case 'non_attribue':
                    result = result.filter(
                        (c) => !c.poseur_id && c.statut !== 'termine'
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

        // Dropdown filters (admin/superviseur only)
        if (filterChargeAffaire) {
            result = result.filter((c) => c.charge_affaire_id === filterChargeAffaire);
        }
        if (filterStatut) {
            result = result.filter((c) => c.statut === filterStatut);
        }
        if (filterPoseur) {
            result = result.filter((c) => c.poseur_id === filterPoseur);
        }

        // Tri
        if (sortColumn) {
            const today = new Date().toISOString().split('T')[0];
            result = [...result].sort((a, b) => {
                let valA: string | number = '';
                let valB: string | number = '';

                switch (sortColumn) {
                    case 'reference':
                        valA = a.reference || '';
                        valB = b.reference || '';
                        break;
                    case 'nom':
                        valA = a.nom.toLowerCase();
                        valB = b.nom.toLowerCase();
                        break;
                    case 'charge_affaire':
                        valA = a.charge_affaire ? `${a.charge_affaire.last_name}`.toLowerCase() : '';
                        valB = b.charge_affaire ? `${b.charge_affaire.last_name}`.toLowerCase() : '';
                        break;
                    case 'poseur':
                        // Trouver le premier poseur des phases à venir
                        const phaseA = a.phases_chantiers?.find(p => p.date_debut >= today && p.poseur_id);
                        const phaseB = b.phases_chantiers?.find(p => p.date_debut >= today && p.poseur_id);
                        valA = phaseA?.poseur ? `${phaseA.poseur.last_name}`.toLowerCase() : '';
                        valB = phaseB?.poseur ? `${phaseB.poseur.last_name}`.toLowerCase() : '';
                        break;
                    case 'semaine':
                        // Trouver la première semaine des phases à venir
                        const firstPhaseA = a.phases_chantiers?.filter(p => p.date_debut >= today).sort((x, y) => x.date_debut.localeCompare(y.date_debut))[0];
                        const firstPhaseB = b.phases_chantiers?.filter(p => p.date_debut >= today).sort((x, y) => x.date_debut.localeCompare(y.date_debut))[0];
                        valA = firstPhaseA?.date_debut || '9999-99-99';
                        valB = firstPhaseB?.date_debut || '9999-99-99';
                        break;
                }

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [chantiers, searchQuery, statusFilter, filterChargeAffaire, filterStatut, filterPoseur, sortColumn, sortDirection]);

    const selectedChantier = useMemo(
        () => chantiers.find((c) => c.id === selectedId),
        [chantiers, selectedId]
    );

    // Gestion du tri sur les colonnes
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            // Même colonne: inverser la direction ou désactiver
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else {
                setSortColumn(null);
                setSortDirection('asc');
            }
        } else {
            // Nouvelle colonne
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ArrowUpDown size={12} className="text-slate-500" />;
        }
        return sortDirection === 'asc'
            ? <ArrowUp size={12} className="text-blue-400" />
            : <ArrowDown size={12} className="text-blue-400" />;
    };

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
            <div className="flex items-center justify-between mb-6 ml-14">
                <h1 className="text-2xl font-bold text-white flex items-baseline gap-3">
                    Tableau de bord
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        S{getWeekNumber(new Date())}
                    </span>
                    <span className="text-slate-400">
                        {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </h1>
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
                <div className="w-[46%] flex flex-col min-h-0">
                    {/* Search and Filters */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher un chantier..."
                                className="input-field !pl-11"
                            />
                        </div>
                        {canViewAllChantiers && (
                            <>
                                <div className="relative">
                                    <select
                                        data-testid="filter-charge-affaire"
                                        value={filterChargeAffaire}
                                        onChange={(e) => setFilterChargeAffaire(e.target.value)}
                                        className={`input-field appearance-none pr-8 min-w-[120px] ${filterChargeAffaire ? 'border-blue-500/50 text-blue-400' : ''}`}
                                    >
                                        <option value="">Chargé</option>
                                        {chargeAffaireList.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        data-testid="filter-statut"
                                        value={filterStatut}
                                        onChange={(e) => setFilterStatut(e.target.value)}
                                        className={`input-field appearance-none pr-8 min-w-[120px] ${filterStatut ? 'border-blue-500/50 text-blue-400' : ''}`}
                                    >
                                        <option value="">Statut</option>
                                        {statutList.map((statut) => (
                                            <option key={statut.code} value={statut.code}>
                                                {statut.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        data-testid="filter-poseur"
                                        value={filterPoseur}
                                        onChange={(e) => setFilterPoseur(e.target.value)}
                                        className={`input-field appearance-none pr-8 min-w-[120px] ${filterPoseur ? 'border-blue-500/50 text-blue-400' : ''}`}
                                    >
                                        <option value="">Poseur</option>
                                        {poseurList.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </>
                        )}
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

                    {/* En-tête des colonnes */}
                    {!loading && filteredChantiers.length > 0 && (
                        <div className="flex items-center px-3 py-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-700/50">
                            {/* Expand/Collapse All */}
                            <button
                                onClick={() => setAllExpanded(prev => prev === true ? false : true)}
                                className="flex items-center justify-center hover:text-slate-300 transition-colors"
                                style={{ width: '5%' }}
                                title={allExpanded ? 'Tout réduire' : 'Tout développer'}
                            >
                                {allExpanded ? (
                                    <ChevronsDownUp size={14} className="text-blue-400" />
                                ) : (
                                    <ChevronsUpDown size={14} />
                                )}
                            </button>
                            {/* Référence */}
                            <button
                                onClick={() => handleSort('reference')}
                                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                                style={{ width: '10%' }}
                            >
                                Réf. <SortIcon column="reference" />
                            </button>
                            {/* Nom */}
                            <button
                                onClick={() => handleSort('nom')}
                                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                                style={{ width: (canViewAllChantiers || isPoseur) ? '50%' : '50%' }}
                            >
                                Nom <SortIcon column="nom" />
                            </button>
                            {/* Chargé d'affaire (conditionnel) */}
                            {(canViewAllChantiers || isPoseur) && (
                                <button
                                    onClick={() => handleSort('charge_affaire')}
                                    className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                                    style={{ width: '10%' }}
                                >
                                    CA <SortIcon column="charge_affaire" />
                                </button>
                            )}
                            {/* Poseur */}
                            <button
                                onClick={() => handleSort('poseur')}
                                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                                style={{ width: (canViewAllChantiers || isPoseur) ? '10%' : '20%' }}
                            >
                                Poseur <SortIcon column="poseur" />
                            </button>
                            {/* Semaine + Date */}
                            <button
                                onClick={() => handleSort('semaine')}
                                className="flex items-center gap-1 justify-end hover:text-slate-300 transition-colors"
                                style={{ width: '15%' }}
                            >
                                Sem / Date <SortIcon column="semaine" />
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
                                    showChargeAffaire={canViewAllChantiers || isPoseur}
                                    filterByPoseurId={isPoseur ? userId ?? undefined : undefined}
                                    forceExpanded={allExpanded}
                                    onClick={() => setSelectedId(chantier.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Detail panel */}
                <div className="w-[54%] glass-card overflow-hidden">
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
                            onStatusChange={fetchChantiers}
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
                        chantierBudgetHeures={selectedChantier.budget_heures}
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
