import { useDroppable } from '@dnd-kit/core';
import { DraggablePhase } from './DraggablePhase';
import type { PhaseWithRelations, ViewMode } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface WorkingDateInfo {
    date: Date;
    isHoliday: boolean;
    weekendBefore: boolean;
}

interface DroppablePoseurRowProps {
    poseur: Tables<'users'> | null;
    phases: PhaseWithRelations[];
    dates: Date[];
    workingDates: WorkingDateInfo[];
    columnWidth: number;
    poseurColumnWidth: number;
    statusColors: Record<string, string>;
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    isCompact: boolean;
    onPoseurClick?: (poseur: Tables<'users'>) => void;
    highlightedChantierId?: string | null;
    focusedPhaseId?: string | null;
    allPhases?: PhaseWithRelations[];
    viewMode?: ViewMode;
    onPhaseNavigate?: (phaseId: string) => void;
    onPhaseClick?: (phaseId: string) => void;
}

// Convert hour to fraction of working day (0-1)
// Working hours: 8-12 (morning) + 13-17 (afternoon) = 8h total
function hourToFraction(hour: number): number {
    if (hour <= 8) return 0;
    if (hour >= 17) return 1;

    // Morning: 8-12 maps to 0-0.5
    if (hour <= 12) {
        return (hour - 8) / 8; // 8→0, 9→0.125, 10→0.25, 11→0.375, 12→0.5
    }

    // Lunch break (12-13): treat as end of morning
    if (hour < 13) return 0.5;

    // Afternoon: 13-17 maps to 0.5-1
    return 0.5 + (hour - 13) / 8; // 13→0.5, 14→0.625, 15→0.75, 16→0.875, 17→1
}

// Calculate phase position and width on the timeline (working days only, with hour precision)
function calculatePhasePosition(
    phase: PhaseWithRelations,
    workingDates: WorkingDateInfo[],
    columnWidth: number
): { left: number; width: number } | null {
    if (!workingDates.length) return null;

    const phaseStart = new Date(phase.date_debut);
    phaseStart.setHours(0, 0, 0, 0);
    const phaseEnd = new Date(phase.date_fin);
    phaseEnd.setHours(0, 0, 0, 0);

    // Extract start/end hours from phase
    const startHour = parseInt(phase.heure_debut?.split(':')[0] || '8');
    const endHour = parseInt(phase.heure_fin?.split(':')[0] || '17');

    // Find start index in working dates
    let startIndex = -1;
    let endIndex = -1;

    // Track if phase extends beyond visible range
    let startsBeforeRange = false;
    let endsAfterRange = false;

    const firstDate = new Date(workingDates[0].date);
    firstDate.setHours(0, 0, 0, 0);
    const lastDate = new Date(workingDates[workingDates.length - 1].date);
    lastDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < workingDates.length; i++) {
        const workDate = new Date(workingDates[i].date);
        workDate.setHours(0, 0, 0, 0);

        if (startIndex === -1 && workDate >= phaseStart) {
            startIndex = i;
        }
        if (workDate <= phaseEnd) {
            endIndex = i;
        }
    }

    // Phase not visible in this range
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        if (phaseEnd < firstDate || phaseStart > lastDate) {
            return null;
        }

        // Phase starts before visible range
        if (phaseStart < firstDate) {
            startIndex = 0;
            startsBeforeRange = true;
        }
        // Phase ends after visible range
        if (phaseEnd > lastDate) {
            endIndex = workingDates.length - 1;
            endsAfterRange = true;
        }
    }

    // Check if phase extends beyond visible range (for partial visibility)
    if (phaseStart < firstDate) {
        startsBeforeRange = true;
    }
    if (phaseEnd > lastDate) {
        endsAfterRange = true;
    }

    // Calculate fractions for intra-day positioning
    const startFraction = startsBeforeRange ? 0 : hourToFraction(startHour);
    const endFraction = endsAfterRange ? 1 : hourToFraction(endHour);

    // Calculate left position (accounting for weekend separators)
    let left = 0;
    for (let i = 0; i < startIndex; i++) {
        if (workingDates[i].weekendBefore) {
            left += 4; // weekend separator width
        }
        left += columnWidth;
    }
    if (workingDates[startIndex]?.weekendBefore) {
        left += 4;
    }

    // Add intra-day offset for start hour
    left += startFraction * columnWidth;

    // Calculate width based on hours
    let width = 0;

    if (startIndex === endIndex) {
        // Same day: width = (endFraction - startFraction) * columnWidth
        width = (endFraction - startFraction) * columnWidth;
    } else {
        // Multi-day phase
        // First day: remaining portion from startFraction to end of day
        width = (1 - startFraction) * columnWidth;

        // Middle days: full columns + weekend separators
        for (let i = startIndex + 1; i < endIndex; i++) {
            if (workingDates[i].weekendBefore) {
                width += 4;
            }
            width += columnWidth;
        }

        // Last day: partial (up to endFraction) + weekend separator if applicable
        if (workingDates[endIndex]?.weekendBefore && endIndex > startIndex) {
            width += 4;
        }
        width += endFraction * columnWidth;
    }

    // Minimum width for visibility, with margin
    return { left: left + 2, width: Math.max(width - 4, 20) };
}

export function DroppablePoseurRow({
    poseur,
    phases,
    dates: _dates, // kept for interface compatibility
    workingDates,
    columnWidth,
    poseurColumnWidth,
    statusColors,
    onPhaseUpdate,
    isCompact,
    onPoseurClick,
    highlightedChantierId,
    focusedPhaseId,
    allPhases,
    viewMode,
    onPhaseNavigate,
    onPhaseClick,
}: DroppablePoseurRowProps) {
    const showNavigationArrows = viewMode === 'week' || viewMode === '3weeks';
    const poseurId = poseur?.id || 'unassigned';

    const { setNodeRef, isOver } = useDroppable({
        id: poseurId,
    });

    // Sort phases by date
    const sortedPhases = [...phases].sort(
        (a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    );

    // Calculate positions for all phases
    const phasesWithPositions = sortedPhases
        .map((phase) => ({
            phase,
            position: calculatePhasePosition(phase, workingDates, columnWidth),
        }))
        .filter((p) => p.position !== null);

    // Detect overlapping phases and stack them
    const rows: { phase: PhaseWithRelations; position: { left: number; width: number }; row: number }[][] = [[]];

    phasesWithPositions.forEach(({ phase, position }) => {
        if (!position) return;

        // Find a row where this phase doesn't overlap
        let rowIndex = 0;
        let placed = false;

        while (!placed) {
            const row = rows[rowIndex] || [];
            const overlaps = row.some((item) => {
                const itemEnd = item.position.left + item.position.width;
                const phaseEnd = position.left + position.width;
                return !(position.left >= itemEnd || phaseEnd <= item.position.left);
            });

            if (!overlaps) {
                if (!rows[rowIndex]) rows[rowIndex] = [];
                rows[rowIndex].push({ phase, position, row: rowIndex });
                placed = true;
            } else {
                rowIndex++;
            }
        }
    });

    const rowHeight = 30;
    const minHeight = Math.max(rows.length * rowHeight, rowHeight);

    return (
        <div
            ref={setNodeRef}
            className={`flex border-b border-slate-700/30 transition-colors ${
                isOver ? 'bg-blue-500/10' : ''
            } ${!poseur ? 'bg-slate-800/20' : ''}`}
            style={{ minHeight }}
        >
            {/* Poseur name column */}
            <div className="flex-shrink-0 px-3 py-2 border-r border-slate-700/50 flex items-start" style={{ width: poseurColumnWidth }}>
                {poseur ? (
                    <div>
                        <button
                            onClick={() => onPoseurClick?.(poseur)}
                            className="text-sm font-medium text-white truncate hover:text-blue-400 transition-colors text-left"
                            title="Voir la tournee"
                            data-testid={`poseur-name-${poseur.id}`}
                        >
                            {poseur.first_name} {poseur.last_name}
                        </button>
                        <p className="text-xs text-slate-500">{phases.length} phase(s)</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-medium text-slate-400 italic">Non attribue</p>
                        <p className="text-xs text-slate-500">{phases.length} phase(s)</p>
                    </div>
                )}
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative" style={{ minHeight }}>
                {/* Background grid with weekend separators and holiday colors */}
                <div className="absolute inset-0 flex">
                    {workingDates.map((dateInfo, i) => (
                        <div key={i} className="flex h-full">
                            {/* Weekend separator */}
                            {dateInfo.weekendBefore && (
                                <div className="w-1 bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-amber-500/30 h-full" />
                            )}
                            {/* Day column */}
                            <div
                                className={`flex-shrink-0 border-r border-slate-700/20 h-full ${
                                    dateInfo.isHoliday ? 'bg-red-500/5' : ''
                                }`}
                                style={{ width: columnWidth }}
                            />
                        </div>
                    ))}
                </div>

                {/* Phases */}
                {rows.flat().map(({ phase, position, row }) => {
                    // Get sibling phases from the same chantier
                    const siblingPhases = allPhases?.filter(p => p.chantier_id === phase.chantier_id && p.duree_heures > 0);
                    return (
                        <div
                            key={phase.id}
                            className="absolute"
                            style={{
                                left: position.left,
                                top: row * rowHeight + 4,
                                width: position.width,
                                height: rowHeight - 8,
                            }}
                        >
                            <DraggablePhase
                                phase={phase}
                                statusColors={statusColors}
                                onPhaseUpdate={onPhaseUpdate}
                                isCompact={isCompact}
                                isHighlighted={highlightedChantierId === phase.chantier_id}
                                isFocused={focusedPhaseId === phase.id}
                                siblingPhases={siblingPhases}
                                showNavigationArrows={showNavigationArrows}
                                onPhaseNavigate={onPhaseNavigate}
                                onPhaseClick={onPhaseClick}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
