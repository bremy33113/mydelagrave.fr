import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, X, Check } from 'lucide-react';
import type { PhaseWithRelations } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface DraggablePhaseProps {
    phase: PhaseWithRelations;
    statusColors: Record<string, string>;
    onPhaseUpdate?: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    isDragging?: boolean;
    isCompact?: boolean;
}

// French public holidays for 2026
const HOLIDAYS_2026 = [
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
    '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
];

// Working hours
const WORK_START_MORNING = 8;
const WORK_END_MORNING = 12;
const WORK_START_AFTERNOON = 13;
const WORK_END_AFTERNOON = 17;

function isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    const dateStr = date.toISOString().split('T')[0];
    return !HOLIDAYS_2026.includes(dateStr);
}

function calculateEndDateTime(startDate: string, startHour: number, durationHours: number): { endDate: string; endHour: number } {
    let remainingHours = durationHours;
    const currentDate = new Date(startDate);
    let currentHour = startHour;

    if (currentHour < WORK_START_MORNING) currentHour = WORK_START_MORNING;
    if (currentHour >= WORK_END_MORNING && currentHour < WORK_START_AFTERNOON) currentHour = WORK_START_AFTERNOON;
    if (currentHour >= WORK_END_AFTERNOON) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentHour = WORK_START_MORNING;
    }

    while (!isWorkingDay(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    while (remainingHours > 0) {
        if (currentHour >= WORK_START_MORNING && currentHour < WORK_END_MORNING) {
            const morningHours = Math.min(WORK_END_MORNING - currentHour, remainingHours);
            remainingHours -= morningHours;
            currentHour = WORK_END_MORNING;

            if (remainingHours > 0) {
                const afternoonHours = Math.min(WORK_END_AFTERNOON - WORK_START_AFTERNOON, remainingHours);
                remainingHours -= afternoonHours;
                currentHour = WORK_START_AFTERNOON + afternoonHours;
            }
        } else if (currentHour >= WORK_START_AFTERNOON && currentHour < WORK_END_AFTERNOON) {
            const afternoonHours = Math.min(WORK_END_AFTERNOON - currentHour, remainingHours);
            remainingHours -= afternoonHours;
            currentHour += afternoonHours;
        }

        if (remainingHours > 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            while (!isWorkingDay(currentDate)) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            currentHour = WORK_START_MORNING;
        }
    }

    return { endDate: currentDate.toISOString().split('T')[0], endHour: currentHour };
}

export function DraggablePhase({
    phase,
    statusColors,
    onPhaseUpdate,
    isDragging = false,
    isCompact: _isCompact = false,
}: DraggablePhaseProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editDate, setEditDate] = useState(phase.date_debut);
    const [editHour, setEditHour] = useState(parseInt(phase.heure_debut?.split(':')[0] || '8'));
    const [editDuration, setEditDuration] = useState(phase.duree_heures);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: phase.id,
    });

    const style = transform
        ? {
              transform: CSS.Translate.toString(transform),
              zIndex: isDragging ? 100 : 1,
          }
        : undefined;

    const statusColor = statusColors[phase.chantier?.statut || 'nouveau'] || statusColors.nouveau;

    const handleSave = async () => {
        if (!onPhaseUpdate) return;

        const { endDate, endHour } = calculateEndDateTime(editDate, editHour, editDuration);

        await onPhaseUpdate(phase.id, {
            date_debut: editDate,
            date_fin: endDate,
            heure_debut: `${editHour.toString().padStart(2, '0')}:00:00`,
            heure_fin: `${endHour.toString().padStart(2, '0')}:00:00`,
            duree_heures: editDuration,
        });

        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditDate(phase.date_debut);
        setEditHour(parseInt(phase.heure_debut?.split(':')[0] || '8'));
        setEditDuration(phase.duree_heures);
        setIsEditing(false);
    };

    // Inline edit mode
    if (isEditing) {
        return (
            <div
                className="h-full rounded-md border border-slate-500 bg-slate-800 p-1 flex flex-col gap-1 relative z-50 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-1">
                    <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="flex-1 px-1 py-0.5 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <select
                        value={editHour}
                        onChange={(e) => setEditHour(parseInt(e.target.value))}
                        className="flex-1 px-1 py-0.5 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                    >
                        {[8, 9, 10, 11, 13, 14, 15, 16].map((h) => (
                            <option key={h} value={h}>{h}h</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 1)}
                        min={1}
                        max={40}
                        className="w-12 px-1 py-0.5 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                    />
                    <span className="text-xs text-white">h</span>
                </div>
                <div className="flex justify-end gap-1">
                    <button
                        onClick={handleCancel}
                        className="p-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-0.5 rounded bg-green-600 hover:bg-green-500 text-white"
                    >
                        <Check className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    // Normal display mode
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`h-full rounded-md border cursor-grab active:cursor-grabbing ${statusColor} ${
                isDragging ? 'opacity-80 shadow-xl scale-105' : 'hover:brightness-110'
            } transition-all`}
            onClick={() => setIsEditing(true)}
            title={`${phase.chantier?.nom || 'Chantier'} - ${phase.libelle || 'Phase'}\n${phase.date_debut} → ${phase.date_fin}\n${phase.duree_heures}h`}
        >
            <div className="h-full flex items-center justify-center px-1 gap-0.5">
                <p className="text-xs font-medium text-white text-center truncate">
                    {phase.chantier?.reference || phase.chantier?.nom?.slice(0, 15) || 'Chantier'}
                </p>
                <ChevronRight className="w-3 h-3 text-white/70 flex-shrink-0" />
            </div>
        </div>
    );
}
