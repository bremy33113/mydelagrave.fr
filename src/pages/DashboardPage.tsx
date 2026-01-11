import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, RefreshCw, AlertCircle, ChevronRight, Building2, Calendar, Briefcase, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { KPIBar } from '../components/dashboard/KPIBar';
import { ChantierCard } from '../components/chantiers/ChantierCard';
import { getWeekNumber, formatLocalDate } from '../lib/dateUtils';
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
    const { userId, canViewAllChantiers, loading: roleLoading, isPoseur, isChargeAffaire, isAdmin, isSuperviseur } = useUserRole();
    const [chantiers, setChantiers] = useState<Chantier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Expand/collapse all chantiers
    const [allExpanded, setAllExpanded] = useState(true);

    // View mode: 'chantiers' or 'semaine'
    const [viewMode, setViewMode] = useState<'chantiers' | 'semaine'>('chantiers');

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
            const today = formatLocalDate(new Date());

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

        return result;
    }, [chantiers, searchQuery, statusFilter]);

    const selectedChantier = useMemo(
        () => chantiers.find((c) => c.id === selectedId),
        [chantiers, selectedId]
    );

    // Group phases by week for "semaine" view
    const phasesByWeek = useMemo(() => {
        const weeks: Record<number, {
            weekNumber: number;
            mondayDate: string;
            fridayDate: string;
            phases: Array<{
                chantier: Chantier;
                phase: PhaseWithPoseur;
            }>;
        }> = {};

        // Helper to get Monday and Friday of a week
        const getWeekDates = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const monday = new Date(d);
            monday.setDate(d.getDate() + diffToMonday);
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);
            return { monday, friday };
        };

        // Format date as JJ/MM/AA
        const formatShort = (date: Date) => {
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yy = String(date.getFullYear()).slice(2);
            return `${dd}/${mm}/${yy}`;
        };

        const currentWeek = getWeekNumber(new Date());

        filteredChantiers.forEach((chantier) => {
            chantier.phases_chantiers?.forEach((phase) => {
                if (phase.duree_heures <= 0) return;

                const [year, month, day] = phase.date_debut.split('-').map(Number);
                const phaseDate = new Date(year, month - 1, day);
                const weekNum = getWeekNumber(phaseDate);

                // Inclure semaine en cours + semaines futures uniquement
                if (weekNum < currentWeek) return;

                const { monday, friday } = getWeekDates(phaseDate);

                if (!weeks[weekNum]) {
                    weeks[weekNum] = {
                        weekNumber: weekNum,
                        mondayDate: formatShort(monday),
                        fridayDate: formatShort(friday),
                        phases: [],
                    };
                }

                weeks[weekNum].phases.push({ chantier, phase });
            });
        });

        // Sort phases within each week by date, then by chantier reference
        Object.values(weeks).forEach((week) => {
            week.phases.sort((a, b) => {
                if (a.phase.date_debut !== b.phase.date_debut) {
                    return a.phase.date_debut.localeCompare(b.phase.date_debut);
                }
                return (a.chantier.reference || '').localeCompare(b.chantier.reference || '');
            });
        });

        return Object.values(weeks).sort((a, b) => a.weekNumber - b.weekNumber);
    }, [filteredChantiers]);

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
                        {/* Expand/Collapse all button */}
                        <button
                            onClick={() => setAllExpanded(!allExpanded)}
                            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                            title={allExpanded ? 'Replier tout' : 'Déplier tout'}
                        >
                            <ChevronRight
                                className={`w-5 h-5 text-slate-400 transition-transform ${allExpanded ? 'rotate-90' : ''}`}
                            />
                        </button>
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
                        {/* Legend icons */}
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <button
                                onClick={() => setStatusFilter(null)}
                                className="flex items-center hover:scale-110 transition-transform"
                                title="Afficher tous les chantiers"
                            >
                                <Building2 className="w-5 h-5 text-purple-400" />
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === 'semaine' ? 'chantiers' : 'semaine')}
                                className={`flex items-center hover:scale-110 transition-transform ${viewMode === 'semaine' ? 'ring-2 ring-emerald-400 rounded' : ''}`}
                                title="Afficher par semaine"
                            >
                                <Calendar className="w-5 h-5 text-emerald-400" />
                            </button>
                            <div className="flex items-center" title="Chargé d'affaire">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex items-center" title="Poseur">
                                <Wrench className="w-5 h-5 text-orange-400" />
                            </div>
                        </div>
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

                    {/* Chantier list or Week view */}
                    <div className="flex-1 overflow-auto space-y-3 pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : viewMode === 'chantiers' ? (
                            // Vue Chantiers
                            filteredChantiers.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p>Aucun chantier trouvé</p>
                                </div>
                            ) : (
                                filteredChantiers.map((chantier) => (
                                    <ChantierCard
                                        key={chantier.id}
                                        chantier={chantier}
                                        isSelected={chantier.id === selectedId}
                                        filterByPoseurId={isPoseur ? userId ?? undefined : undefined}
                                        forceExpanded={allExpanded}
                                        onClick={() => setSelectedId(chantier.id)}
                                    />
                                ))
                            )
                        ) : (
                            // Vue Semaine
                            phasesByWeek.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p>Aucune phase planifiée</p>
                                </div>
                            ) : (
                                phasesByWeek.map((week) => (
                                    <div key={week.weekNumber} className="rounded-lg bg-slate-800/30 border border-slate-700/50 overflow-hidden">
                                        {/* En-tête de semaine */}
                                        <div className="px-3 py-2 bg-emerald-500/10 border-b border-slate-700/50">
                                            <span className="text-emerald-400 font-bold">S{week.weekNumber}</span>
                                            <span className="text-slate-400 ml-2">
                                                Du Lundi {week.mondayDate} au Vendredi {week.fridayDate}
                                            </span>
                                        </div>
                                        {/* Phases de la semaine */}
                                        <div className="divide-y divide-slate-700/30">
                                            {week.phases.map(({ chantier, phase }) => {
                                                const formatDateShort = (dateStr: string) => {
                                                    const parts = dateStr.split('-');
                                                    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
                                                };
                                                return (
                                                    <button
                                                        key={phase.id}
                                                        onClick={() => setSelectedId(chantier.id)}
                                                        className={`w-full text-left px-3 py-2 flex items-center text-xs hover:bg-slate-700/30 transition-colors ${
                                                            chantier.id === selectedId ? 'bg-blue-600/20' : ''
                                                        }`}
                                                    >
                                                        {/* Référence - 10% */}
                                                        <div style={{ width: '10%' }} className="text-blue-400 font-semibold truncate">
                                                            {chantier.reference || '-'}
                                                        </div>
                                                        {/* Nom chantier - 50% */}
                                                        <div style={{ width: '50%' }} className="text-white font-medium truncate uppercase">
                                                            {chantier.nom}
                                                        </div>
                                                        {/* N° sous-phase - 5% */}
                                                        <div style={{ width: '5%' }} className="text-purple-400 font-medium">
                                                            {phase.groupe_phase}.{phase.numero_phase}
                                                        </div>
                                                        {/* Date début - 10% */}
                                                        <div style={{ width: '10%' }} className="text-slate-400">
                                                            {formatDateShort(phase.date_debut)}
                                                        </div>
                                                        {/* Chargé d'affaire - 12.5% */}
                                                        <div style={{ width: '12.5%' }} className="flex items-center gap-1 text-slate-400 truncate">
                                                            <Briefcase className="w-3 h-3 text-blue-400" />
                                                            {chantier.charge_affaire ? (
                                                                <span>{chantier.charge_affaire.first_name}</span>
                                                            ) : (
                                                                <span className="text-slate-500">-</span>
                                                            )}
                                                        </div>
                                                        {/* Poseur - 12.5% */}
                                                        <div style={{ width: '12.5%' }} className="flex items-center gap-1 text-slate-400 truncate">
                                                            <Wrench className="w-3 h-3 text-orange-400" />
                                                            {phase.poseur ? (
                                                                <span>{phase.poseur.first_name}</span>
                                                            ) : (
                                                                <span className="text-slate-500">-</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )
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
                            canInteract={isAdmin || isSuperviseur || isPoseur || isChargeAffaire}
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
                        onPhaseChange={fetchChantiers}
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
