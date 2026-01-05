import { useState, useEffect, useMemo } from 'react';
import { X, Route, Loader2, CalendarX } from 'lucide-react';
import type { Tables } from '../../lib/database.types';
import { TourneeMap, TourneeStep } from './TourneeMap';
import { TourneeStepsList } from './TourneeStepsList';
import { useOSRMRoute, formatDuration } from './hooks/useOSRMRoute';
import type { PhaseWithRelations } from '../../pages/PlanningPage';

interface PoseurTourneeModalProps {
    isOpen: boolean;
    onClose: () => void;
    poseur: Tables<'users'>;
    phases: PhaseWithRelations[];
}

type WeekOffset = 0 | 1;

function getWeekBounds(offset: WeekOffset): { start: Date; end: Date; label: string } {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Find Monday of current week
    const monday = new Date(today);
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Add week offset
    monday.setDate(monday.getDate() + offset * 7);

    // Friday = Monday + 4 days
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const label = `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')} - ${friday.getDate().toString().padStart(2, '0')}/${(friday.getMonth() + 1).toString().padStart(2, '0')}`;

    return { start: monday, end: friday, label };
}

function getTourneeSteps(
    phases: PhaseWithRelations[],
    weekStart: Date,
    weekEnd: Date
): TourneeStep[] {
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    // Filter phases for the week
    const weekPhases = phases.filter((phase) => {
        const phaseStart = phase.date_debut;
        const phaseEnd = phase.date_fin;
        // Phase overlaps with week
        return phaseStart <= endStr && phaseEnd >= startStr;
    });

    // Sort by date_debut then heure_debut
    weekPhases.sort((a, b) => {
        const dateCompare = a.date_debut.localeCompare(b.date_debut);
        if (dateCompare !== 0) return dateCompare;
        return (a.heure_debut || '08:00').localeCompare(b.heure_debut || '08:00');
    });

    // Transform to TourneeStep with numbering
    return weekPhases.map((phase, index) => ({
        id: phase.id,
        order: index + 1,
        chantierNom: phase.chantier?.nom || 'Chantier inconnu',
        chantierReference: phase.chantier?.reference || null,
        adresse: phase.chantier?.adresse_livraison || null,
        latitude: phase.chantier?.adresse_livraison_latitude || null,
        longitude: phase.chantier?.adresse_livraison_longitude || null,
        dateDebut: phase.date_debut,
        heureDebut: phase.heure_debut?.slice(0, 5) || '08:00',
        durationHours: phase.duree_heures,
    }));
}

export function PoseurTourneeModal({ isOpen, onClose, poseur, phases }: PoseurTourneeModalProps) {
    const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
    const [selectedStepId, setSelectedStepId] = useState<string | undefined>();

    const { route, loading: routeLoading, fetchRoute } = useOSRMRoute();

    // Calculate week bounds
    const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

    // Filter and sort steps
    const steps = useMemo(
        () => getTourneeSteps(phases, weekBounds.start, weekBounds.end),
        [phases, weekBounds]
    );

    // Load route when steps change
    useEffect(() => {
        const coordinates: [number, number][] = steps
            .filter((s): s is typeof s & { latitude: number; longitude: number } =>
                s.latitude !== null && s.longitude !== null)
            .map((s) => [s.latitude, s.longitude]);

        fetchRoute(coordinates);
    }, [steps, fetchRoute]);

    // Extract leg durations
    const legDurations = useMemo(() => {
        if (!route?.routes?.[0]?.legs) return [];
        return route.routes[0].legs.map((leg) => leg.duration);
    }, [route]);

    // Total travel time
    const totalTravelTime = useMemo(() => route?.routes?.[0]?.duration || 0, [route]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="glass-card w-full max-w-5xl h-[85vh] flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
                data-testid="tournee-modal"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Route className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                Tournee de {poseur.first_name} {poseur.last_name}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {steps.length} chantier(s) cette semaine
                                {totalTravelTime > 0 && ` - ${formatDuration(totalTravelTime)} de trajet total`}
                            </p>
                        </div>
                    </div>

                    {/* Week selector */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-800/50 rounded-lg p-1">
                            <button
                                onClick={() => setWeekOffset(0)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                    weekOffset === 0
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                data-testid="week-current"
                            >
                                Semaine courante
                            </button>
                            <button
                                onClick={() => setWeekOffset(1)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                    weekOffset === 1
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                data-testid="week-next"
                            >
                                Semaine suivante
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                            data-testid="close-tournee-modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Steps list (1/3) */}
                    <div className="w-80 flex-shrink-0 border-r border-slate-700/50 p-4 overflow-y-auto" data-testid="tournee-steps-panel">
                        <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                            Semaine du {weekBounds.label}
                        </div>
                        {steps.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center text-slate-500">
                                    <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucun chantier cette semaine</p>
                                </div>
                            </div>
                        ) : (
                            <TourneeStepsList
                                steps={steps}
                                legDurations={legDurations}
                                selectedStepId={selectedStepId}
                                onStepClick={setSelectedStepId}
                            />
                        )}
                    </div>

                    {/* Map (2/3) */}
                    <div className="flex-1 relative" data-testid="tournee-map-container">
                        {routeLoading && (
                            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Calcul de l'itineraire...
                                </div>
                            </div>
                        )}
                        <TourneeMap
                            steps={steps}
                            routeGeometry={route?.routes?.[0]?.geometry || null}
                            selectedStepId={selectedStepId}
                            onStepClick={setSelectedStepId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
