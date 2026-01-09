import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, X, Check, Truck } from 'lucide-react';
import { calculateEndDateTime } from '../../lib/dateUtils';
import type { PhaseWithRelations } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface DraggablePhaseProps {
    phase: PhaseWithRelations;
    statusColors: Record<string, string>;
    onPhaseUpdate?: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    isDragging?: boolean;
    isCompact?: boolean;
    isHighlighted?: boolean;
    isFocused?: boolean;
    siblingPhases?: PhaseWithRelations[];
    onPhaseNavigate?: (phaseId: string) => void;
    onPhaseClick?: (phaseId: string) => void;
    showNavigationArrows?: boolean;
}

export function DraggablePhase({
    phase,
    statusColors,
    onPhaseUpdate,
    isDragging = false,
    isCompact: _isCompact = false,
    isHighlighted = false,
    isFocused = false,
    siblingPhases,
    onPhaseNavigate,
    onPhaseClick,
    showNavigationArrows = false,
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

    // Special style for "fourniture seule" (delivery only, no installation)
    const isFournitureSeule = phase.chantier?.type === 'fourniture';
    const statusColor = isFournitureSeule
        ? 'bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-amber-600/90 border-amber-400'
        : statusColors[phase.chantier?.statut || 'nouveau'] || statusColors.nouveau;

    // Calculate previous/next phases for navigation
    const sortedSiblings = useMemo(() => {
        if (!siblingPhases || siblingPhases.length <= 1) return null;
        return [...siblingPhases].sort((a, b) => {
            const aKey = (a.groupe_phase || 1) * 100 + a.numero_phase;
            const bKey = (b.groupe_phase || 1) * 100 + b.numero_phase;
            return aKey - bKey;
        });
    }, [siblingPhases]);

    const currentIndex = sortedSiblings?.findIndex(p => p.id === phase.id) ?? -1;
    const prevPhase = currentIndex > 0 && sortedSiblings ? sortedSiblings[currentIndex - 1] : null;
    const nextPhase = currentIndex >= 0 && sortedSiblings && currentIndex < sortedSiblings.length - 1 ? sortedSiblings[currentIndex + 1] : null;

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

    // Check if phase is unassigned (no poseur, but NOT fourniture seule)
    const isUnassigned = !phase.poseur_id && !isFournitureSeule;

    // Striped background style:
    // - Fourniture seule: amber stripes (dark overlay)
    // - Unassigned phases: green stripes
    // - Assigned phases: solid color
    const stripedStyle = isFournitureSeule
        ? {
              backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 4px,
                  rgba(0,0,0,0.15) 4px,
                  rgba(0,0,0,0.15) 8px
              )`,
          }
        : isUnassigned
        ? {
              backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 4px,
                  rgba(34,197,94,0.2) 4px,
                  rgba(34,197,94,0.2) 8px
              )`,
          }
        : undefined;

    // Focused phase style (strongest - for the specific phase being navigated to)
    const focusedStyle = isFocused
        ? {
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.9), 0 0 20px 8px rgba(59, 130, 246, 0.6)',
              animation: 'pulse 1s ease-in-out infinite',
          }
        : undefined;

    // Highlight glow style (lighter - for sibling phases of same chantier)
    const highlightStyle = isHighlighted && !isFocused
        ? {
              boxShadow: '0 0 8px 2px rgba(59, 130, 246, 0.4), 0 0 16px 4px rgba(59, 130, 246, 0.2)',
          }
        : undefined;

    // Normal display mode
    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...stripedStyle, ...focusedStyle, ...highlightStyle }}
            {...attributes}
            {...listeners}
            className={`h-full rounded-md border cursor-grab active:cursor-grabbing ${
                isUnassigned ? 'bg-slate-700/30 border-green-500/50' : statusColor
            } ${
                isDragging ? 'opacity-80 shadow-xl scale-105' : 'hover:brightness-110'
            } ${isFocused ? 'ring-4 ring-blue-500 ring-offset-1 ring-offset-slate-900 z-20' : isHighlighted ? 'ring-2 ring-blue-400/60 ring-offset-1 ring-offset-slate-900 z-10' : ''} transition-all`}
            onClick={() => onPhaseClick?.(phase.id)}
            onDoubleClick={() => setIsEditing(true)}
            title={`${phase.chantier?.nom || 'Chantier'} - ${phase.libelle || 'Phase'}\n${phase.date_debut} → ${phase.date_fin}\n${phase.duree_heures}h${isFournitureSeule ? '\n🚚 Fourniture seule' : ''}`}
        >
            <div className="h-full flex items-center justify-center px-1 gap-0.5">
                {/* Navigation arrow left */}
                {showNavigationArrows && prevPhase && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPhaseNavigate?.(prevPhase.id); }}
                        className="p-0.5 rounded bg-black/30 hover:bg-black/50 flex-shrink-0"
                        title={`Phase ${prevPhase.groupe_phase || 1}.${prevPhase.numero_phase}`}
                    >
                        <ChevronLeft className="w-3 h-3 text-white" />
                    </button>
                )}
                {isFournitureSeule && <Truck className="w-3 h-3 text-white/80 flex-shrink-0" />}
                <span className="text-[10px] bg-black/30 px-1 rounded text-white/80 flex-shrink-0">
                    {phase.groupe_phase || 1}.{phase.numero_phase}
                </span>
                <p className="text-xs font-medium text-white text-center truncate flex-1">
                    {phase.chantier?.reference || phase.chantier?.nom?.slice(0, 15) || 'Chantier'}
                </p>
                {/* Navigation arrow right */}
                {showNavigationArrows && nextPhase && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPhaseNavigate?.(nextPhase.id); }}
                        className="p-0.5 rounded bg-black/30 hover:bg-black/50 flex-shrink-0"
                        title={`Phase ${nextPhase.groupe_phase || 1}.${nextPhase.numero_phase}`}
                    >
                        <ChevronRight className="w-3 h-3 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}
