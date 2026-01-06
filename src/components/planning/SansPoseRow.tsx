import { Truck } from 'lucide-react';
import { DraggablePhase } from './DraggablePhase';
import type { PhaseWithRelations, ViewMode } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface WorkingDateInfo {
    date: Date;
    isHoliday: boolean;
    weekendBefore: boolean;
}

interface SansPoseRowProps {
    phases: PhaseWithRelations[];
    workingDates: WorkingDateInfo[];
    columnWidth: number;
    poseurColumnWidth: number;
    statusColors: Record<string, string>;
    isCompact: boolean;
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    highlightedChantierId?: string | null;
    focusedPhaseId?: string | null;
    allPhases?: PhaseWithRelations[];
    viewMode?: ViewMode;
    onPhaseNavigate?: (phaseId: string) => void;
    onPhaseClick?: (phaseId: string) => void;
}

// Convert hour to fraction of working day (0-1)
function hourToFraction(hour: number): number {
    if (hour <= 8) return 0;
    if (hour >= 17) return 1;
    if (hour <= 12) {
        return (hour - 8) / 8;
    }
    if (hour < 13) return 0.5;
    return 0.5 + (hour - 13) / 8;
}

// Calculate phase position and width on the timeline
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

    const startHour = parseInt(phase.heure_debut?.split(':')[0] || '8');
    const endHour = parseInt(phase.heure_fin?.split(':')[0] || '17');

    let startIndex = -1;
    let endIndex = -1;
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

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        if (phaseEnd < firstDate || phaseStart > lastDate) {
            return null;
        }
        if (phaseStart < firstDate) {
            startIndex = 0;
            startsBeforeRange = true;
        }
        if (phaseEnd > lastDate) {
            endIndex = workingDates.length - 1;
            endsAfterRange = true;
        }
    }

    if (phaseStart < firstDate) {
        startsBeforeRange = true;
    }
    if (phaseEnd > lastDate) {
        endsAfterRange = true;
    }

    const startFraction = startsBeforeRange ? 0 : hourToFraction(startHour);
    const endFraction = endsAfterRange ? 1 : hourToFraction(endHour);

    let left = 0;
    for (let i = 0; i < startIndex; i++) {
        if (workingDates[i].weekendBefore) {
            left += 4;
        }
        left += columnWidth;
    }
    if (workingDates[startIndex]?.weekendBefore) {
        left += 4;
    }
    left += startFraction * columnWidth;

    let width = 0;
    if (startIndex === endIndex) {
        width = (endFraction - startFraction) * columnWidth;
    } else {
        width = (1 - startFraction) * columnWidth;
        for (let i = startIndex + 1; i < endIndex; i++) {
            if (workingDates[i].weekendBefore) {
                width += 4;
            }
            width += columnWidth;
        }
        if (workingDates[endIndex]?.weekendBefore && endIndex > startIndex) {
            width += 4;
        }
        width += endFraction * columnWidth;
    }

    return { left: left + 2, width: Math.max(width - 4, 20) };
}

export function SansPoseRow({
    phases,
    workingDates,
    columnWidth,
    poseurColumnWidth,
    statusColors,
    isCompact,
    onPhaseUpdate,
    highlightedChantierId,
    focusedPhaseId,
    allPhases,
    viewMode,
    onPhaseNavigate,
    onPhaseClick,
}: SansPoseRowProps) {
    const showNavigationArrows = viewMode === 'week' || viewMode === '3weeks';
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
            className="flex border-b border-slate-700/30 bg-amber-500/5"
            style={{ minHeight }}
        >
            {/* Label column */}
            <div
                className="flex-shrink-0 px-3 py-2 border-r border-slate-700/50 flex items-start gap-2"
                style={{ width: poseurColumnWidth }}
            >
                <Truck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-amber-400 italic">Sans pose</p>
                    <p className="text-xs text-slate-500">{phases.length} livraison(s)</p>
                </div>
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative" style={{ minHeight }}>
                {/* Background grid */}
                <div className="absolute inset-0 flex">
                    {workingDates.map((dateInfo, i) => (
                        <div key={i} className="flex h-full">
                            {dateInfo.weekendBefore && (
                                <div className="w-1 bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-amber-500/30 h-full" />
                            )}
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
