import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import type { PhaseWithRelations } from '../../pages/PlanningPage';

interface DraggablePhaseProps {
    phase: PhaseWithRelations;
    statusColors: Record<string, string>;
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
    isDragging = false,
    isCompact: _isCompact = false,
    isHighlighted = false,
    isFocused = false,
    siblingPhases,
    onPhaseNavigate,
    onPhaseClick,
    showNavigationArrows = false,
}: DraggablePhaseProps) {
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
            title={`${phase.chantier?.nom || 'Chantier'} - ${phase.libelle || 'Phase'}\n${phase.date_debut} → ${phase.date_fin}\n${phase.duree_heures}h${isFournitureSeule ? '\n🚚 Fourniture seule' : ''}\n(Glisser horizontalement pour déplacer, étirer le bord droit pour modifier la durée)`}
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
