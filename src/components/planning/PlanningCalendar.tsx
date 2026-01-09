import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { DroppablePoseurRow } from './DroppablePoseurRow';
import { SansPoseRow } from './SansPoseRow';
import { DraggablePhase } from './DraggablePhase';
import { isHoliday, getWeekNumber, calculateEndDateTime } from '../../lib/dateUtils';
import { CHANTIER_STATUS_COLORS } from '../../lib/constants';
import { calculateCascadeUpdates } from '../../lib/phaseOverlapUtils';
import type { WorkingDateInfo } from '../../lib/planningRndUtils';
import type { PhaseWithRelations, ViewMode } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface PlanningCalendarProps {
    phases: PhaseWithRelations[];
    allPhases: PhaseWithRelations[];
    poseurs: Tables<'users'>[];
    dateRange: { start: Date; end: Date };
    viewMode: ViewMode;
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    onPhaseUpdateBatch: (updates: Array<{ id: string; updates: Partial<Tables<'phases_chantiers'>> }>) => Promise<void>;
    onNavigate: (days: number) => void;
    onPoseurClick?: (poseur: Tables<'users'>) => void;
    highlightedChantierId?: string | null;
    focusedPhaseId?: string | null;
    onPhaseNavigate?: (phaseId: string) => void;
    onPhaseClick?: (phaseId: string) => void;
}

// Generate N working days starting from a date (excluding weekends)
function getWorkingDaysFromStart(start: Date, count: number): WorkingDateInfo[] {
    const dates: WorkingDateInfo[] = [];
    const current = new Date(start);
    let lastWasWeekend = false;

    while (dates.length < count) {
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
            lastWasWeekend = true;
        } else {
            const holiday = isHoliday(current);
            dates.push({
                date: new Date(current),
                isHoliday: holiday,
                weekendBefore: lastWasWeekend
            });
            lastWasWeekend = false;
        }
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

// Constants for responsive calculation
const MIN_COLUMN_WIDTH = 20; // Minimum for year view
const MIN_COLUMN_WIDTH_NORMAL = 60; // Minimum for normal views
const POSEUR_COLUMN_WIDTH = 202;

// Get month name in French
function getMonthName(date: Date): string {
    return date.toLocaleDateString('fr-FR', { month: 'short' });
}

// Format day header
function formatDayHeader(date: Date, compact: boolean): { day: string; date: string } {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return {
        day: days[date.getDay()],
        date: compact ? date.getDate().toString() : date.getDate().toString(),
    };
}

// Check if date is today
function isToday(date: Date): boolean {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

// Calculate responsive days count and column width based on container width and viewMode
function useResponsivePlanning(
    containerRef: React.RefObject<HTMLDivElement | null>,
    viewMode: ViewMode
): { daysCount: number; columnWidth: number } {
    const [state, setState] = useState({ daysCount: 5, columnWidth: 80 });

    useEffect(() => {
        const updateLayout = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const availableWidth = containerWidth - POSEUR_COLUMN_WIDTH;

            // Minimum column width depends on view mode
            const minWidth = viewMode === '3months' || viewMode === 'year' ? MIN_COLUMN_WIDTH : MIN_COLUMN_WIDTH_NORMAL;

            // Fixed days count according to viewMode
            let targetDays: number;
            switch (viewMode) {
                case 'week':
                    targetDays = 5; // 5 jours ouvrés
                    break;
                case '3weeks':
                    targetDays = 15; // 3 semaines * 5 jours
                    break;
                case 'month':
                    targetDays = 22; // ~1 mois de jours ouvrés
                    break;
                case '3months':
                    targetDays = 65; // ~3 mois de jours ouvrés
                    break;
                case 'year':
                    targetDays = 260; // ~1 an de jours ouvrés
                    break;
                default:
                    targetDays = 5;
            }

            // Calculate column width to fill ALL available space
            const calculatedWidth = Math.floor(availableWidth / targetDays);

            // Use minimum width only if calculated is too small
            const finalWidth = Math.max(minWidth, calculatedWidth);

            // If columns are at minimum width, we may need more days to fill space
            const finalDays = finalWidth === minWidth
                ? Math.floor(availableWidth / minWidth)
                : targetDays;

            setState({ daysCount: Math.max(3, finalDays), columnWidth: finalWidth });
        };

        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, [containerRef, viewMode]);

    return state;
}

export function PlanningCalendar({
    phases,
    allPhases,
    poseurs,
    dateRange,
    viewMode,
    onPhaseUpdate,
    onPhaseUpdateBatch,
    onNavigate,
    onPoseurClick,
    highlightedChantierId,
    focusedPhaseId,
    onPhaseNavigate,
    onPhaseClick,
}: PlanningCalendarProps) {
    const [activePhase, setActivePhase] = useState<PhaseWithRelations | null>(null);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track Shift key state for horizontal scroll
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Handle Shift + Wheel for horizontal navigation
    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey) {
            e.preventDefault();
            const direction = e.deltaY > 0 ? 1 : -1;
            onNavigate(direction);
        }
    };

    // Scroll to focused phase when it changes
    useEffect(() => {
        if (focusedPhaseId && containerRef.current) {
            // Small delay to ensure the phase is rendered
            setTimeout(() => {
                const phaseElement = containerRef.current?.querySelector(`[data-phase-id="${focusedPhaseId}"]`);
                if (phaseElement) {
                    phaseElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
            }, 100);
        }
    }, [focusedPhaseId]);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Start drag after 8px movement
            },
        })
    );

    // Calculate responsive days count and column width
    const { daysCount, columnWidth } = useResponsivePlanning(containerRef, viewMode);

    // Generate working dates array based on calculated days count
    const workingDates = useMemo(
        () => getWorkingDaysFromStart(dateRange.start, daysCount),
        [dateRange.start, daysCount]
    );

    const isCompact = columnWidth < 70;

    // Group dates by week for header display
    const weekGroups = useMemo(() => {
        const groups: { week: number; month: string; year: number; startIndex: number; count: number; hasWeekendBefore: boolean[] }[] = [];
        let currentWeek = -1;
        let currentGroup: typeof groups[0] | null = null;

        workingDates.forEach((dateInfo, index) => {
            const week = getWeekNumber(dateInfo.date);
            const month = getMonthName(dateInfo.date);
            const year = dateInfo.date.getFullYear();

            if (week !== currentWeek) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentGroup = {
                    week,
                    month,
                    year,
                    startIndex: index,
                    count: 1,
                    hasWeekendBefore: [dateInfo.weekendBefore]
                };
                currentWeek = week;
            } else if (currentGroup) {
                currentGroup.count++;
                currentGroup.hasWeekendBefore.push(dateInfo.weekendBefore);
            }
        });

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return groups;
    }, [workingDates]);

    // Group weeks by year for year header
    const yearGroups = useMemo(() => {
        const groups: { year: number; weekCount: number; totalWidth: number }[] = [];
        let currentYear = -1;
        let currentGroup: typeof groups[0] | null = null;

        weekGroups.forEach((weekGroup) => {
            const weekendCount = weekGroup.hasWeekendBefore.filter(Boolean).length;
            const weekWidth = weekGroup.count * columnWidth + weekendCount * 4;

            if (weekGroup.year !== currentYear) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentGroup = {
                    year: weekGroup.year,
                    weekCount: 1,
                    totalWidth: weekWidth
                };
                currentYear = weekGroup.year;
            } else if (currentGroup) {
                currentGroup.weekCount++;
                currentGroup.totalWidth += weekWidth;
            }
        });

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return groups;
    }, [weekGroups, columnWidth]);

    // Group phases by poseur, separating "sans pose" (fourniture seule)
    const { phasesByPoseur, sansPosePhases } = useMemo(() => {
        const grouped: Record<string, PhaseWithRelations[]> = {};
        const sansPose: PhaseWithRelations[] = [];

        // Initialize with all poseurs
        poseurs.forEach((p) => {
            grouped[p.id] = [];
        });

        // Add "unassigned" group
        grouped['unassigned'] = [];

        // Distribute phases
        phases.forEach((phase) => {
            // If chantier type is "fourniture" (supply only) -> Sans pose row
            if (phase.chantier?.type === 'fourniture') {
                sansPose.push(phase);
            } else {
                // Otherwise -> poseur row or unassigned
                const key = phase.poseur_id || 'unassigned';
                if (grouped[key]) {
                    grouped[key].push(phase);
                }
            }
        });

        return { phasesByPoseur: grouped, sansPosePhases: sansPose };
    }, [phases, poseurs]);

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const phase = phases.find((p) => p.id === event.active.id);
        setActivePhase(phase || null);
    };

    // Handle drag end
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActivePhase(null);

        if (!over) return;

        const phaseId = active.id as string;
        const newPoseurId = over.id as string;

        // Find the phase
        const phase = phases.find((p) => p.id === phaseId);
        if (!phase) return;

        // Check if poseur changed
        const currentPoseurId = phase.poseur_id || 'unassigned';
        if (currentPoseurId === newPoseurId) return;

        // Update poseur
        const updates: Partial<Tables<'phases_chantiers'>> = {
            poseur_id: newPoseurId === 'unassigned' ? null : newPoseurId,
        };

        await onPhaseUpdate(phaseId, updates);
    };

    // Handle date/time change from react-rnd drag
    const handleDateTimeChange = async (phaseId: string, newDate: string, newHour: number) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        const { endDate, endHour } = calculateEndDateTime(newDate, newHour, phase.duree_heures);

        const primaryUpdate = {
            date_debut: newDate,
            date_fin: endDate,
            heure_debut: `${newHour.toString().padStart(2, '0')}:00:00`,
            heure_fin: `${endHour.toString().padStart(2, '0')}:00:00`,
        };

        // Calculer les phases affectées par chevauchement (cascade)
        const cascadeUpdates = calculateCascadeUpdates(phaseId, endDate, endHour, allPhases);

        if (cascadeUpdates.length > 0) {
            // Batch update: phase principale + phases en cascade
            await onPhaseUpdateBatch([
                { id: phaseId, updates: primaryUpdate },
                ...cascadeUpdates
            ]);
        } else {
            // Pas de cascade, mise à jour simple
            await onPhaseUpdate(phaseId, primaryUpdate);
        }
    };

    // Handle duration change from react-rnd resize
    const handleDurationChange = async (phaseId: string, newDuration: number) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        const startHour = parseInt(phase.heure_debut?.split(':')[0] || '8');
        const { endDate, endHour } = calculateEndDateTime(phase.date_debut, startHour, newDuration);

        const primaryUpdate = {
            date_fin: endDate,
            heure_fin: `${endHour.toString().padStart(2, '0')}:00:00`,
            duree_heures: newDuration,
        };

        // Calculer les phases affectées par chevauchement (cascade)
        const cascadeUpdates = calculateCascadeUpdates(phaseId, endDate, endHour, allPhases);

        if (cascadeUpdates.length > 0) {
            // Batch update: phase principale + phases en cascade
            await onPhaseUpdateBatch([
                { id: phaseId, updates: primaryUpdate },
                ...cascadeUpdates
            ]);
        } else {
            // Pas de cascade, mise à jour simple
            await onPhaseUpdate(phaseId, primaryUpdate);
        }
    };

    // Extract just dates for DroppablePoseurRow
    const dates = useMemo(() => workingDates.map(d => d.date), [workingDates]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className={`min-w-full ${isShiftPressed ? 'cursor-ew-resize' : ''}`}
                ref={containerRef}
                onWheel={handleWheel}
            >
                {/* Header with years, weeks/months and dates */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                    {/* Row 0: Years (only shown if multiple years or long view) */}
                    {(yearGroups.length > 1 || viewMode === '3months' || viewMode === 'year') && (
                        <div className="flex border-b border-slate-700/30">
                            <div className="flex-shrink-0 border-r border-slate-700/50" style={{ width: POSEUR_COLUMN_WIDTH }} />
                            <div className="flex-1 flex">
                                {yearGroups.map((yearGroup, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-center border-r border-slate-700/30 bg-slate-800/50 py-0.5"
                                        style={{ width: yearGroup.totalWidth }}
                                    >
                                        <span className="text-xs font-bold text-blue-400">
                                            {yearGroup.year}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Row 1: Weeks and Months */}
                    <div className="flex border-b border-slate-700/30">
                        {/* Poseur column header */}
                        <div className="flex-shrink-0 px-3 py-1 border-r border-slate-700/50 flex items-center" style={{ width: POSEUR_COLUMN_WIDTH }}>
                            <span className="text-xs font-medium text-slate-500 uppercase">Poseur</span>
                        </div>

                        {/* Week groups */}
                        <div className="flex-1 flex">
                            {weekGroups.map((group, groupIndex) => {
                                // Calculate width including weekend separators
                                const weekendCount = group.hasWeekendBefore.filter(Boolean).length;
                                const totalWidth = group.count * columnWidth + weekendCount * 4;

                                return (
                                    <div
                                        key={groupIndex}
                                        className="flex items-center justify-center border-r border-slate-700/30 bg-slate-800/30"
                                        style={{ width: totalWidth }}
                                    >
                                        <span className="text-[10px] font-semibold text-purple-400">
                                            S{group.week}
                                        </span>
                                        <span className="text-[10px] text-slate-500 ml-1.5">
                                            {group.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 2: Days and Dates */}
                    <div className="flex">
                        {/* Empty space for poseur column */}
                        <div className="flex-shrink-0 border-r border-slate-700/50" style={{ width: POSEUR_COLUMN_WIDTH }} />

                        {/* Date columns (working days only) */}
                        <div className="flex-1 flex">
                            {workingDates.map((dateInfo, i) => {
                                const { day, date: dateStr } = formatDayHeader(dateInfo.date, isCompact);
                                const today = isToday(dateInfo.date);

                                return (
                                    <div key={i} className="flex">
                                        {/* Weekend separator line */}
                                        {dateInfo.weekendBefore && (
                                            <div className="w-1 bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-amber-500/40" />
                                        )}
                                        {/* Day column */}
                                        <div
                                            className={`flex-shrink-0 px-1 py-1 text-center border-r border-slate-700/30 ${
                                                dateInfo.isHoliday ? 'bg-red-500/10' : ''
                                            } ${today ? 'bg-blue-500/10' : ''}`}
                                            style={{ width: columnWidth }}
                                        >
                                            <div className={`text-[10px] font-medium ${dateInfo.isHoliday ? 'text-red-400' : 'text-slate-400'}`}>
                                                {day}
                                            </div>
                                            <div className={`text-xs font-semibold ${today ? 'text-blue-400' : dateInfo.isHoliday ? 'text-red-400' : 'text-slate-300'}`}>
                                                {dateStr}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Poseur rows */}
                {poseurs.map((poseur) => (
                    <DroppablePoseurRow
                        key={poseur.id}
                        poseur={poseur}
                        phases={phasesByPoseur[poseur.id] || []}
                        dates={dates}
                        workingDates={workingDates}
                        columnWidth={columnWidth}
                        poseurColumnWidth={POSEUR_COLUMN_WIDTH}
                        statusColors={CHANTIER_STATUS_COLORS}
                        onPhaseUpdate={onPhaseUpdate}
                        onDateTimeChange={handleDateTimeChange}
                        onDurationChange={handleDurationChange}
                        isCompact={isCompact}
                        onPoseurClick={onPoseurClick}
                        highlightedChantierId={highlightedChantierId}
                        focusedPhaseId={focusedPhaseId}
                        allPhases={allPhases}
                        viewMode={viewMode}
                        onPhaseNavigate={onPhaseNavigate}
                        onPhaseClick={onPhaseClick}
                    />
                ))}

                {/* Unassigned row */}
                <DroppablePoseurRow
                    key="unassigned"
                    poseur={null}
                    phases={phasesByPoseur['unassigned'] || []}
                    dates={dates}
                    workingDates={workingDates}
                    columnWidth={columnWidth}
                    poseurColumnWidth={POSEUR_COLUMN_WIDTH}
                    statusColors={CHANTIER_STATUS_COLORS}
                    onPhaseUpdate={onPhaseUpdate}
                    onDateTimeChange={handleDateTimeChange}
                    onDurationChange={handleDurationChange}
                    isCompact={isCompact}
                    highlightedChantierId={highlightedChantierId}
                    focusedPhaseId={focusedPhaseId}
                    allPhases={allPhases}
                    viewMode={viewMode}
                    onPhaseNavigate={onPhaseNavigate}
                    onPhaseClick={onPhaseClick}
                />

                {/* Separator line */}
                <div className="h-1 bg-gradient-to-r from-slate-700/50 via-amber-500/30 to-slate-700/50" />

                {/* Sans pose row (fourniture seule) - read only, at the end */}
                <SansPoseRow
                    phases={sansPosePhases}
                    workingDates={workingDates}
                    columnWidth={columnWidth}
                    poseurColumnWidth={POSEUR_COLUMN_WIDTH}
                    statusColors={CHANTIER_STATUS_COLORS}
                    isCompact={isCompact}
                    onPhaseUpdate={onPhaseUpdate}
                    onDateTimeChange={handleDateTimeChange}
                    onDurationChange={handleDurationChange}
                    highlightedChantierId={highlightedChantierId}
                    focusedPhaseId={focusedPhaseId}
                    allPhases={allPhases}
                    viewMode={viewMode}
                    onPhaseNavigate={onPhaseNavigate}
                    onPhaseClick={onPhaseClick}
                />
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activePhase && (
                    <DraggablePhase
                        phase={activePhase}
                        statusColors={CHANTIER_STATUS_COLORS}
                        isDragging
                        isCompact={isCompact}
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}
