import { useRef, useState, useCallback } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import {
    pixelsToDateTime,
    pixelsToHours,
    getSnapGrid,
    getMinWidth,
    getMaxWidth,
    WorkingDateInfo,
} from '../../lib/planningRndUtils';
import type { PhaseWithRelations } from '../../pages/PlanningPage';

interface RndPhaseProps {
    phase: PhaseWithRelations;
    initialLeft: number;
    initialWidth: number;
    columnWidth: number;
    workingDates: WorkingDateInfo[];
    onDateTimeChange: (phaseId: string, newDate: string, newHour: number) => Promise<void>;
    onDurationChange: (phaseId: string, newDuration: number) => Promise<void>;
    children: React.ReactNode;
    rowHeight: number;
}

export function RndPhase({
    phase,
    initialLeft,
    initialWidth,
    columnWidth,
    workingDates,
    onDateTimeChange,
    onDurationChange,
    children,
    rowHeight,
}: RndPhaseProps) {
    const [isInteracting, setIsInteracting] = useState(false);
    const [previewData, setPreviewData] = useState<{ x: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate snap grid
    const snapGrid = getSnapGrid(columnWidth);

    // Get constraints
    const minWidth = getMinWidth(columnWidth);
    const maxWidth = getMaxWidth(columnWidth);

    // Handle drag start
    const handleDragStart: RndDragCallback = () => {
        setIsInteracting(true);
        setPreviewData({ x: initialLeft, width: initialWidth });
    };

    // Handle drag (update preview only, let react-rnd handle visual)
    const handleDrag: RndDragCallback = (_e, d) => {
        setPreviewData(prev => prev ? { ...prev, x: Math.max(0, d.x) } : null);
    };

    // Handle drag end - update the phase date/time
    const handleDragStop: RndDragCallback = useCallback((_e, d) => {
        setIsInteracting(false);
        setPreviewData(null);

        // Only update if position actually changed
        const deltaX = Math.abs(d.x - initialLeft);
        if (deltaX < 2) return;

        // Convert pixel position to date/time
        const result = pixelsToDateTime(d.x, columnWidth, workingDates);
        if (result) {
            // Fire and forget - don't await
            onDateTimeChange(phase.id, result.date, result.hour);
        }
    }, [phase.id, initialLeft, columnWidth, workingDates, onDateTimeChange]);

    // Handle resize start
    const handleResizeStart = () => {
        setIsInteracting(true);
        setPreviewData({ x: initialLeft, width: initialWidth });
    };

    // Handle resize (update preview only, let react-rnd handle visual)
    const handleResize: RndResizeCallback = (_e, _dir, ref) => {
        setPreviewData(prev => prev ? { ...prev, width: ref.offsetWidth } : null);
    };

    // Handle resize end - update the phase duration
    const handleResizeStop: RndResizeCallback = useCallback((_e, _dir, ref) => {
        setIsInteracting(false);
        setPreviewData(null);

        const newWidth = ref.offsetWidth;
        // Only update if width actually changed
        const deltaW = Math.abs(newWidth - initialWidth);
        if (deltaW < 2) return;

        // Convert pixel width to hours
        const newHours = pixelsToHours(newWidth, columnWidth);
        // Fire and forget - don't await
        onDurationChange(phase.id, newHours);
    }, [phase.id, initialWidth, columnWidth, onDurationChange]);

    // Calculate preview info during interaction
    const previewInfo = previewData ? (() => {
        const dateTime = pixelsToDateTime(previewData.x, columnWidth, workingDates);
        const hours = pixelsToHours(previewData.width, columnWidth);
        if (!dateTime) return null;
        return {
            date: dateTime.date,
            hour: dateTime.hour,
            duration: hours,
        };
    })() : null;

    return (
        <div ref={containerRef} className="absolute inset-0">
            <Rnd
                position={{ x: initialLeft, y: 0 }}
                size={{ width: initialWidth, height: rowHeight }}
                dragAxis="x"
                dragGrid={snapGrid}
                resizeGrid={snapGrid}
                enableResizing={{
                    top: false,
                    right: true,
                    bottom: false,
                    left: false,
                    topRight: false,
                    bottomRight: false,
                    bottomLeft: false,
                    topLeft: false,
                }}
                minWidth={minWidth}
                maxWidth={maxWidth}
                bounds="parent"
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResize={handleResize}
                onResizeStop={handleResizeStop}
                className={`${isInteracting ? 'z-50' : 'z-10'}`}
                style={{
                    transition: isInteracting ? 'none' : 'left 0.15s ease-out, width 0.15s ease-out',
                }}
                resizeHandleStyles={{
                    right: {
                        width: '8px',
                        right: '-4px',
                        cursor: 'ew-resize',
                    },
                }}
                resizeHandleClasses={{
                    right: 'hover:bg-blue-500/50 rounded transition-colors',
                }}
            >
                <div className="h-full w-full relative">
                    {children}

                    {/* Preview tooltip during interaction */}
                    {previewInfo && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white whitespace-nowrap shadow-lg z-50">
                            {previewInfo.date} {previewInfo.hour}h - {previewInfo.duration}h
                        </div>
                    )}

                    {/* Resize handle indicator */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-1 h-4 bg-white/50 rounded" />
                    </div>
                </div>
            </Rnd>
        </div>
    );
}
