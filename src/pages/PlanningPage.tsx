import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { PlanningCalendar } from '../components/planning/PlanningCalendar';
import { UnassignedPhasesPanel } from '../components/planning/UnassignedPhasesPanel';
import { PoseurTourneeModal } from '../components/planning/PoseurTourneeModal';
import type { Tables } from '../lib/database.types';

export type PhaseWithRelations = Tables<'phases_chantiers'> & {
    poseur?: { id: string; first_name: string | null; last_name: string | null } | null;
    chantier?: {
        id: string;
        nom: string;
        reference: string | null;
        statut: string;
        type?: string | null;
        adresse_livraison?: string | null;
        adresse_livraison_latitude: number | null;
        adresse_livraison_longitude: number | null;
    } | null;
};

export type ViewMode = 'week' | '3weeks' | 'month' | '3months' | 'year';

// Get Monday of the current week
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Get ISO week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Format date range for display
function formatDateRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString('fr-FR', options);
    const endStr = end.toLocaleDateString('fr-FR', { ...options, year: 'numeric' });
    return `${startStr} - ${endStr}`;
}

export function PlanningPage() {
    const { canViewAllChantiers, loading: roleLoading } = useUserRole();
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(getWeekStart(new Date()));
    const [selectedPoseur, setSelectedPoseur] = useState<string | null>(null);
    const [phases, setPhases] = useState<PhaseWithRelations[]>([]);
    const [poseurs, setPoseurs] = useState<Tables<'users'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [tourneeModal, setTourneeModal] = useState<{
        isOpen: boolean;
        poseur: Tables<'users'>;
    } | null>(null);
    const [highlightedChantierId, setHighlightedChantierId] = useState<string | null>(null);
    const [focusedPhaseId, setFocusedPhaseId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Calculate date range based on view mode
    const dateRange = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        switch (viewMode) {
            case 'week':
                end.setDate(start.getDate() + 6);
                break;
            case '3weeks':
                end.setDate(start.getDate() + 20);
                break;
            case 'month':
                end.setDate(start.getDate() + 27);
                break;
            case '3months':
                end.setDate(start.getDate() + 90); // ~3 mois
                break;
            case 'year':
                end.setDate(start.getDate() + 365); // 1 an
                break;
        }

        return { start, end };
    }, [currentDate, viewMode]);

    // Fetch poseurs (users with role poseur only)
    useEffect(() => {
        const fetchPoseurs = async () => {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'poseur')
                .eq('suspended', false)
                .order('last_name', { ascending: true });
            if (data && Array.isArray(data)) {
                setPoseurs(data as Tables<'users'>[]);
            }
        };
        fetchPoseurs();
    }, []);

    // Fetch phases with relations
    useEffect(() => {
        const fetchPhases = async () => {
            setLoading(true);

            // Fetch all phases (we'll filter client-side for flexibility)
            const { data, error } = await supabase
                .from('phases_chantiers')
                .select(`
                    *,
                    poseur:users!poseur_id(id, first_name, last_name),
                    chantier:chantiers(id, nom, reference, statut, type, adresse_livraison, adresse_livraison_latitude, adresse_livraison_longitude)
                `)
                .order('date_debut', { ascending: true });

            if (error) {
                console.error('Error fetching phases:', error);
            } else if (data && Array.isArray(data)) {
                // Filter out phases from deleted chantiers
                const validPhases = data.filter(
                    (p: PhaseWithRelations) => p.chantier && !(p.chantier as { deleted_at?: string }).deleted_at
                ) as PhaseWithRelations[];
                setPhases(validPhases);
            }

            setLoading(false);
        };

        fetchPhases();
    }, [refreshKey]);

    // Filter phases for calendar view (within date range)
    // Only show real sub-phases (duree_heures > 0), not phase group headers
    const calendarPhases = useMemo(() => {
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];

        return phases.filter((p) => {
            // Exclude phase group headers (placeholder with 0 hours)
            if (p.duree_heures === 0) return false;

            // Phase overlaps with date range if:
            // phase.date_debut <= endStr AND phase.date_fin >= startStr
            const phaseStart = p.date_debut;
            const phaseEnd = p.date_fin;

            const overlaps = phaseStart <= endStr && phaseEnd >= startStr;

            // Apply poseur filter if selected (but always include unassigned phases)
            if (selectedPoseur && p.poseur_id !== selectedPoseur && p.poseur_id !== null) {
                return false;
            }

            return overlaps;
        });
    }, [phases, dateRange, selectedPoseur]);

    // Filter phases based on search query
    const searchFilteredPhases = useMemo(() => {
        if (!searchQuery.trim()) return calendarPhases;

        const query = searchQuery.toLowerCase().trim();
        return calendarPhases.filter((p) => {
            const chantierRef = p.chantier?.reference?.toLowerCase() || '';
            const chantierNom = p.chantier?.nom?.toLowerCase() || '';
            const poseurName = p.poseur ? `${p.poseur.first_name || ''} ${p.poseur.last_name || ''}`.toLowerCase() : '';
            const phaseLabel = p.libelle?.toLowerCase() || '';

            return chantierRef.includes(query) ||
                   chantierNom.includes(query) ||
                   poseurName.includes(query) ||
                   phaseLabel.includes(query);
        });
    }, [calendarPhases, searchQuery]);

    // Group unassigned sub-phases by their parent phase (groupe_phase)
    // Only include phases that have at least one unassigned sub-phase
    const unassignedPhasesGrouped = useMemo(() => {
        // Get all real sub-phases (duree_heures > 0) without poseur, excluding "fourniture seule"
        const unassignedSubPhases = phases.filter(
            (p) => !p.poseur_id && p.chantier?.type !== 'fourniture' && p.duree_heures > 0
        );

        // Group by chantier_id + groupe_phase
        const groups = new Map<string, {
            chantierId: string;
            chantierNom: string;
            chantierRef: string | null;
            groupePhase: number;
            phaseLabel: string;
            subPhases: typeof unassignedSubPhases;
        }>();

        unassignedSubPhases.forEach((subPhase) => {
            const key = `${subPhase.chantier_id}-${subPhase.groupe_phase || 1}`;
            if (!groups.has(key)) {
                // Find the phase header (duree_heures = 0) for this group to get the label
                const phaseHeader = phases.find(
                    (p) => p.chantier_id === subPhase.chantier_id &&
                           p.groupe_phase === (subPhase.groupe_phase || 1) &&
                           p.numero_phase === 1
                );
                groups.set(key, {
                    chantierId: subPhase.chantier_id,
                    chantierNom: subPhase.chantier?.nom || 'Chantier',
                    chantierRef: subPhase.chantier?.reference || null,
                    groupePhase: subPhase.groupe_phase || 1,
                    phaseLabel: phaseHeader?.libelle || `Phase ${subPhase.groupe_phase || 1}`,
                    subPhases: [],
                });
            }
            groups.get(key)?.subPhases.push(subPhase);
        });

        // Sort sub-phases within each group
        groups.forEach((group) => {
            group.subPhases.sort((a, b) => a.numero_phase - b.numero_phase);
        });

        return Array.from(groups.values()).sort((a, b) => {
            // Sort by chantier name, then by groupe_phase
            const nameCompare = a.chantierNom.localeCompare(b.chantierNom);
            if (nameCompare !== 0) return nameCompare;
            return a.groupePhase - b.groupePhase;
        });
    }, [phases]);

    // Navigate: Hebdo = 1 day, 3Sem/Mois = 7 days, 3Mois = 30 days, Annuel = 90 days
    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        let days = 7;
        switch (viewMode) {
            case 'week':
                days = 1;
                break;
            case '3weeks':
            case 'month':
                days = 7;
                break;
            case '3months':
                days = 30;
                break;
            case 'year':
                days = 90;
                break;
        }
        newDate.setDate(newDate.getDate() + (direction === 'next' ? days : -days));
        setCurrentDate(newDate);
    };

    // Handle calendar navigation (Shift + wheel)
    const handleCalendarNavigate = (days: number) => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    };

    // Go to today
    const goToToday = () => {
        setCurrentDate(getWeekStart(new Date()));
    };

    // Handle phase update (from drag & drop or inline edit)
    const handlePhaseUpdate = async (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => {
        const { error } = await supabase
            .from('phases_chantiers')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', phaseId);

        if (error) {
            console.error('Error updating phase:', error);
            alert('Erreur lors de la mise à jour');
        } else {
            // Signal au Dashboard qu'une phase a été modifiée
            localStorage.setItem('phases_last_update', Date.now().toString());
            setRefreshKey((k) => k + 1);
        }
    };

    // Handle phase click (focus on phase from "À attribuer" panel)
    const handlePhaseClick = (phase: PhaseWithRelations) => {
        if (phase.date_debut) {
            // Center planning on the phase's start date
            const phaseDate = new Date(phase.date_debut);
            setCurrentDate(getWeekStart(phaseDate));
        } else {
            alert('Cette phase n\'est pas encore planifiée');
        }
    };

    // Handle chantier click (highlight all phases of this chantier)
    const handleChantierHighlight = (chantierId: string | null) => {
        setHighlightedChantierId(chantierId);
    };

    // Handle phase navigation (click on arrow to go to sibling phase)
    const handlePhaseNavigate = (phaseId: string) => {
        const targetPhase = phases.find(p => p.id === phaseId);
        if (targetPhase?.chantier_id) {
            setHighlightedChantierId(targetPhase.chantier_id);
            setFocusedPhaseId(phaseId);
        }
    };

    // Handle calendar phase click (highlight chantier and focus phase)
    const handleCalendarPhaseClick = (phaseId: string) => {
        const targetPhase = phases.find(p => p.id === phaseId);
        if (targetPhase?.chantier_id) {
            setHighlightedChantierId(targetPhase.chantier_id);
            setFocusedPhaseId(phaseId);
        }
    };

    // Handle poseur click (open tournee modal)
    const handlePoseurClick = (poseur: Tables<'users'>) => {
        setTourneeModal({ isOpen: true, poseur });
    };

    // Access denied for non-supervisors
    if (!roleLoading && !canViewAllChantiers) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-slate-400">Accès non autorisé</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Cette page est réservée aux superviseurs et administrateurs
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">Planning</h1>

                        {/* Week navigation */}
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                title="Semaine précédente"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                Semaine {getWeekNumber(currentDate)}
                            </button>

                            <button
                                onClick={() => navigateWeek('next')}
                                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                title="Semaine suivante"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <span className="text-sm text-slate-400">
                            {formatDateRange(dateRange.start, dateRange.end)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View mode toggle */}
                        <div className="flex bg-slate-800/50 rounded-lg p-1">
                            {(['week', '3weeks', 'month', '3months', 'year'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                                        viewMode === mode
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {mode === 'week' ? 'Hebdo' : mode === '3weeks' ? '3 Sem' : mode === 'month' ? 'Mois' : mode === '3months' ? '3 Mois' : 'Année'}
                                </button>
                            ))}
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="pl-9 pr-8 py-2 w-48 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-700"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                        </div>

                        {/* Poseur filter */}
                        <select
                            value={selectedPoseur || ''}
                            onChange={(e) => setSelectedPoseur(e.target.value || null)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Tous les poseurs</option>
                            {poseurs.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.first_name} {p.last_name}
                                </option>
                            ))}
                        </select>

                        {/* Refresh button */}
                        <button
                            onClick={() => setRefreshKey((k) => k + 1)}
                            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                            title="Actualiser"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Unassigned phases panel */}
                <UnassignedPhasesPanel
                    groupedPhases={unassignedPhasesGrouped}
                    onPhaseUpdate={handlePhaseUpdate}
                    onPhaseClick={handlePhaseClick}
                    highlightedChantierId={highlightedChantierId}
                    onChantierHighlight={handleChantierHighlight}
                />

                {/* Calendar */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <PlanningCalendar
                            phases={searchFilteredPhases}
                            poseurs={poseurs}
                            dateRange={dateRange}
                            viewMode={viewMode}
                            onPhaseUpdate={handlePhaseUpdate}
                            onNavigate={handleCalendarNavigate}
                            onPoseurClick={handlePoseurClick}
                            highlightedChantierId={highlightedChantierId}
                            focusedPhaseId={focusedPhaseId}
                            onPhaseNavigate={handlePhaseNavigate}
                            onPhaseClick={handleCalendarPhaseClick}
                        />
                    )}
                </div>
            </div>

            {/* Poseur Tournee Modal */}
            {tourneeModal && (
                <PoseurTourneeModal
                    isOpen={tourneeModal.isOpen}
                    onClose={() => setTourneeModal(null)}
                    poseur={tourneeModal.poseur}
                    phases={phases.filter((p) => p.poseur_id === tourneeModal.poseur.id)}
                />
            )}
        </div>
    );
}
