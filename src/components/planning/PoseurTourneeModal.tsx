import { useState, useEffect, useMemo } from 'react';
import { X, Route, Loader2, CalendarX, AlertTriangle } from 'lucide-react';
import type { Tables } from '../../lib/database.types';
import { TourneeMap, TourneeStep, RouteSegment, StepType } from './TourneeMap';
import { TourneeStepsList } from './TourneeStepsList';
import { useOSRMRoute, formatDuration } from './hooks/useOSRMRoute';
import { isWorkingDay, formatLocalDate } from '../../lib/dateUtils';
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

// Get the Monday date string of a given date (local timezone)
function getMondayOfWeek(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return formatLocalDate(d);
}

// Get the Friday date string of a given date (local timezone)
function getFridayOfWeek(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -2 : 5);
    d.setDate(diff);
    return formatLocalDate(d);
}


// Helper: get the next working day if the given date is not a working day
function getEffectiveWorkingDate(dateStr: string): string {
    const date = new Date(dateStr);
    while (!isWorkingDay(date)) {
        date.setDate(date.getDate() + 1);
    }
    return formatLocalDate(date);
}

function getTourneeSteps(
    phases: PhaseWithRelations[],
    weekStart: Date,
    weekEnd: Date
): TourneeStep[] {
    // Use local date format to avoid UTC timezone shift
    const startStr = formatLocalDate(weekStart);
    const endStr = formatLocalDate(weekEnd);

    // Filter phases for the week
    const weekPhases = phases.filter((phase) => {
        const phaseStart = phase.date_debut;
        const phaseEnd = phase.date_fin;
        // Phase overlaps with week
        return phaseStart <= endStr && phaseEnd >= startStr;
    });

    // Group phases by chantier_id + effective date (same chantier same day = same tour stop)
    const groupedByLocation = new Map<string, {
        phases: PhaseWithRelations[];
        chantier: PhaseWithRelations['chantier'];
        effectiveDate: string;
        effectiveHour: string;
    }>();

    weekPhases.forEach((phase) => {
        // Calculate effective start date
        let effectiveStart = phase.date_debut < startStr ? startStr : phase.date_debut;
        // Ensure effective start is a working day (not weekend or holiday)
        effectiveStart = getEffectiveWorkingDate(effectiveStart);

        // Calculate effective hour
        const effectiveHour = phase.date_debut < startStr
            ? '08:00'
            : (phase.heure_debut?.slice(0, 5) || '08:00');

        // Grouping key: chantier_id + effective date
        const groupKey = `${phase.chantier_id}-${effectiveStart}`;

        if (!groupedByLocation.has(groupKey)) {
            groupedByLocation.set(groupKey, {
                phases: [],
                chantier: phase.chantier,
                effectiveDate: effectiveStart,
                effectiveHour: effectiveHour,
            });
        }

        const group = groupedByLocation.get(groupKey);
        if (!group) return;
        group.phases.push(phase);

        // Keep the earliest hour for the group
        if (effectiveHour < group.effectiveHour) {
            group.effectiveHour = effectiveHour;
        }
    });

    // Convert to TourneeStep array with aggregated duration
    const entries = Array.from(groupedByLocation.values());

    // Sort by date then hour
    entries.sort((a, b) => {
        const dateCompare = a.effectiveDate.localeCompare(b.effectiveDate);
        if (dateCompare !== 0) return dateCompare;
        return a.effectiveHour.localeCompare(b.effectiveHour);
    });

    // Create TourneeStep for each group (not each phase)
    const worksiteSteps: TourneeStep[] = entries.map((group, index) => ({
        id: group.phases.map(p => p.id).join('-'), // Composite ID
        order: index + 1,
        chantierNom: group.chantier?.nom || 'Chantier inconnu',
        chantierReference: group.chantier?.reference || null,
        adresse: group.chantier?.adresse_livraison || null,
        latitude: group.chantier?.adresse_livraison_latitude || null,
        longitude: group.chantier?.adresse_livraison_longitude || null,
        dateDebut: group.effectiveDate,
        heureDebut: group.effectiveHour,
        durationHours: group.phases.reduce((sum, p) => sum + p.duree_heures, 0), // Total duration
        type: 'worksite' as StepType,
        isHomeStep: false,
    }));

    return worksiteSteps;
}

// Add home departure (Monday) and return (Friday) steps
function addHomeSteps(
    worksiteSteps: TourneeStep[],
    poseur: Tables<'users'>,
    weekStart: Date
): TourneeStep[] {
    if (!poseur.adresse_domicile_latitude || !poseur.adresse_domicile_longitude) {
        return worksiteSteps; // No home address, return unchanged
    }

    if (worksiteSteps.length === 0) {
        return worksiteSteps; // No worksites, no home steps needed
    }

    const mondayStr = getMondayOfWeek(weekStart);
    const fridayStr = getFridayOfWeek(weekStart);

    const result: TourneeStep[] = [];

    // Find the first worksite of the week (should be Monday or first working day)
    const firstWorksite = worksiteSteps[0];
    const lastWorksite = worksiteSteps[worksiteSteps.length - 1];

    // Add home departure step (before first worksite)
    const departureStep: TourneeStep = {
        id: 'home-departure-' + mondayStr,
        order: 0,
        chantierNom: 'Domicile',
        chantierReference: null,
        adresse: poseur.adresse_domicile || 'Domicile',
        latitude: poseur.adresse_domicile_latitude,
        longitude: poseur.adresse_domicile_longitude,
        dateDebut: firstWorksite.dateDebut,
        heureDebut: '07:00', // Will be calculated based on travel time
        durationHours: 0,
        type: 'home_departure',
        isHomeStep: true,
        heureCalculee: undefined, // Will be set after route calculation
    };

    result.push(departureStep);

    // Add all worksite steps
    result.push(...worksiteSteps);

    // Add home return step (after last worksite)
    // Find the last day's last worksite end time
    const returnStep: TourneeStep = {
        id: 'home-return-' + fridayStr,
        order: worksiteSteps.length + 1,
        chantierNom: 'Domicile',
        chantierReference: null,
        adresse: poseur.adresse_domicile || 'Domicile',
        latitude: poseur.adresse_domicile_latitude,
        longitude: poseur.adresse_domicile_longitude,
        dateDebut: lastWorksite.dateDebut, // Use last worksite date
        heureDebut: '18:00', // Will be calculated based on travel time
        durationHours: 0,
        type: 'home_return',
        isHomeStep: true,
        heureCalculee: undefined,
    };

    result.push(returnStep);

    return result;
}

export function PoseurTourneeModal({ isOpen, onClose, poseur, phases }: PoseurTourneeModalProps) {
    const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
    const [selectedStepId, setSelectedStepId] = useState<string | undefined>();
    const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);

    const { route, loading: routeLoading, fetchRoute } = useOSRMRoute();

    // Calculate week bounds
    const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

    // Check if poseur has home address
    const hasHomeAddress = !!(poseur.adresse_domicile_latitude && poseur.adresse_domicile_longitude);

    // Filter and sort worksite steps, then add home steps
    const steps = useMemo(() => {
        const worksiteSteps = getTourneeSteps(phases, weekBounds.start, weekBounds.end);
        return addHomeSteps(worksiteSteps, poseur, weekBounds.start);
    }, [phases, weekBounds, poseur]);

    // Load route when steps change
    useEffect(() => {
        const coordinates: [number, number][] = steps
            .filter((s): s is typeof s & { latitude: number; longitude: number } =>
                s.latitude !== null && s.longitude !== null)
            .map((s) => [s.latitude, s.longitude]);

        fetchRoute(coordinates);
    }, [steps, fetchRoute]);

    // Create route segments with colors (home routes = orange, inter-site = blue)
    useEffect(() => {
        if (!route?.routes?.[0]?.legs) {
            setRouteSegments([]);
            return;
        }

        const legs = route.routes[0].legs;
        const validSteps = steps.filter(
            (s): s is typeof s & { latitude: number; longitude: number } =>
                s.latitude !== null && s.longitude !== null
        );

        // Build segments from legs geometry
        const segments: RouteSegment[] = [];

        // We need to extract individual leg geometries from the full route
        // OSRM returns legs with steps that have geometry
        legs.forEach((leg, legIndex) => {
            if (legIndex >= validSteps.length - 1) return;

            const fromStep = validSteps[legIndex];
            const toStep = validSteps[legIndex + 1];

            // A leg is a home route if either end is a home step
            const isHomeRoute = !!(fromStep.isHomeStep || toStep.isHomeStep);

            // Extract geometry for this leg (OSRM provides steps with geometry)
            const legWithSteps = leg as { steps?: { geometry?: { coordinates?: [number, number][] } }[] };
            if (legWithSteps.steps && legWithSteps.steps.length > 0) {
                // Combine all step geometries into one LineString
                const coordinates: [number, number][] = [];
                legWithSteps.steps.forEach((step) => {
                    if (step.geometry?.coordinates) {
                        coordinates.push(...step.geometry.coordinates);
                    }
                });

                if (coordinates.length > 0) {
                    segments.push({
                        geometry: {
                            type: 'LineString',
                            coordinates,
                        },
                        isHomeRoute,
                    });
                }
            }
        });

        setRouteSegments(segments);
    }, [route, steps]);

    // Extract leg durations
    const legDurations = useMemo(() => {
        if (!route?.routes?.[0]?.legs) return [];
        return route.routes[0].legs.map((leg: { duration: number }) => leg.duration);
    }, [route]);

    // Total travel time
    const totalTravelTime = useMemo(() => route?.routes?.[0]?.duration || 0, [route]);

    // Count worksites only (excluding home steps)
    const worksiteCount = useMemo(
        () => steps.filter((s) => s.type === 'worksite').length,
        [steps]
    );

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
                                {worksiteCount} chantier(s) cette semaine
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

                        {/* Warning if no home address */}
                        {!hasHomeAddress && worksiteCount > 0 && (
                            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm font-medium">Adresse domicile non renseignee</span>
                                </div>
                                <p className="text-xs text-amber-300/80 mt-1">
                                    Les trajets domicile ne peuvent pas etre calcules.
                                    Renseignez l'adresse dans Administration &rarr; Utilisateurs.
                                </p>
                            </div>
                        )}

                        {worksiteCount === 0 ? (
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
                            routeSegments={routeSegments}
                            selectedStepId={selectedStepId}
                            onStepClick={setSelectedStepId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
