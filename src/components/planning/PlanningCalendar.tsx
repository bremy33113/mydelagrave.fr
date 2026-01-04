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
import { DraggablePhase } from './DraggablePhase';
import type { PhaseWithRelations, ViewMode } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface PlanningCalendarProps {
    phases: PhaseWithRelations[];
    poseurs: Tables<'users'>[];
    dateRange: { start: Date; end: Date };
    viewMode: ViewMode;
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    onNavigate: (days: number) => void;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
    nouveau: 'bg-blue-500/80 border-blue-400',
    planifie: 'bg-purple-500/80 border-purple-400',
    en_cours: 'bg-amber-500/80 border-amber-400',
    pose_en_cours: 'bg-pink-500/80 border-pink-400',
    a_terminer: 'bg-orange-500/80 border-orange-400',
    termine: 'bg-green-500/80 border-green-400',
};

// French public holidays for 2025-2027
const HOLIDAYS = [
    // 2025
    '2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08', '2025-05-29',
    '2025-06-09', '2025-07-14', '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25',
    // 2026
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
    '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
    // 2027
    '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08',
    '2027-05-17', '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
];

// Format date as YYYY-MM-DD in local timezone (not UTC)
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate N working days starting from a date (excluding weekends)
function getWorkingDaysFromStart(start: Date, count: number): { date: Date; isHoliday: boolean; weekendBefore: boolean }[] {
    const dates: { date: Date; isHoliday: boolean; weekendBefore: boolean }[] = [];
    const current = new Date(start);
    let lastWasWeekend = false;

    while (dates.length < count) {
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
            lastWasWeekend = true;
        } else {
            const dateStr = formatLocalDate(current);
            const isHoliday = HOLIDAYS.includes(dateStr);
            dates.push({
                date: new Date(current),
                isHoliday,
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
const MAX_COLUMN_WIDTH = 100;
const POSEUR_COLUMN_WIDTH = 160;

// Get ISO week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

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

            // Calculate how many days can fit
            const maxPossibleDays = Math.floor(availableWidth / minWidth);
            const minPossibleDays = Math.floor(availableWidth / MAX_COLUMN_WIDTH);

            // Base days according to viewMode (minimum)
            let baseDays: number;
            let maxDays: number;
            switch (viewMode) {
                case 'week':
                    baseDays = 5;
                    maxDays = 10;
                    break;
                case '3weeks':
                    baseDays = 15;
                    maxDays = 20;
                    break;
                case 'month':
                    baseDays = 20;
                    maxDays = 25;
                    break;
                case '3months':
                    baseDays = 65; // ~3 mois de jours ouvrés
                    maxDays = 70;
                    break;
                case 'year':
                    baseDays = 260; // ~1 an de jours ouvrés (52 semaines * 5 jours)
                    maxDays = 265;
                    break;
                default:
                    baseDays = 5;
                    maxDays = 40;
            }

            // Take the maximum between baseDays and what can fit
            // But cap at maxPossibleDays and maxDays
            const actualDays = Math.min(
                maxPossibleDays,
                maxDays,
                Math.max(baseDays, minPossibleDays)
            );

            // Ensure at least 3 days
            const finalDays = Math.max(3, actualDays);

            // Calculate column width to fill available space
            const calculatedWidth = Math.floor(availableWidth / finalDays);
            const finalWidth = Math.max(minWidth, Math.min(MAX_COLUMN_WIDTH, calculatedWidth));

            setState({ daysCount: finalDays, columnWidth: finalWidth });
        };

        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, [containerRef, viewMode]);

    return state;
}

export function PlanningCalendar({
    phases,
    poseurs,
    dateRange,
    viewMode,
    onPhaseUpdate,
    onNavigate,
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

    // Group phases by poseur
    const phasesByPoseur = useMemo(() => {
        const grouped: Record<string, PhaseWithRelations[]> = {};

        // Initialize with all poseurs
        poseurs.forEach((p) => {
            grouped[p.id] = [];
        });

        // Add "unassigned" group
        grouped['unassigned'] = [];

        // Distribute phases
        phases.forEach((phase) => {
            const key = phase.poseur_id || 'unassigned';
            if (grouped[key]) {
                grouped[key].push(phase);
            }
        });

        return grouped;
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
                        statusColors={STATUS_COLORS}
                        onPhaseUpdate={onPhaseUpdate}
                        isCompact={isCompact}
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
                    statusColors={STATUS_COLORS}
                    onPhaseUpdate={onPhaseUpdate}
                    isCompact={isCompact}
                />
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activePhase && (
                    <DraggablePhase
                        phase={activePhase}
                        statusColors={STATUS_COLORS}
                        isDragging
                        isCompact={isCompact}
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}
