import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import type { PhaseWithRelations } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

interface UnassignedPhasesPanelProps {
    phases: PhaseWithRelations[];
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    onPhaseClick: (phase: PhaseWithRelations) => void;
}

interface DraggableUnassignedPhaseProps {
    phase: PhaseWithRelations;
    onClick: () => void;
}

function DraggableUnassignedPhase({ phase, onClick }: DraggableUnassignedPhaseProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: phase.id,
    });

    const style = transform
        ? {
              transform: CSS.Translate.toString(transform),
              zIndex: isDragging ? 100 : 1,
          }
        : undefined;

    const hasDate = phase.date_debut && phase.date_debut !== '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            title={!hasDate ? 'Phase non planifiée' : undefined}
            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-700/50 transition-colors ${
                isDragging ? 'opacity-80 shadow-xl cursor-grabbing' : ''
            } ${hasDate ? 'bg-slate-800/50 border-slate-700/50' : 'bg-red-500/10 border-red-500/30'}`}
        >
            <p className="text-sm font-medium text-white truncate">
                {phase.libelle || `Phase ${phase.numero_phase}`}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
                {phase.chantier?.nom}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                {hasDate ? (
                    <>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(phase.date_debut).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                            })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {phase.duree_heures}h
                        </span>
                    </>
                ) : (
                    <span className="flex items-center gap-1 text-amber-500">
                        <AlertCircle className="w-3 h-3" />
                        Non planifié
                    </span>
                )}
            </div>
        </div>
    );
}

export function UnassignedPhasesPanel({ phases, onPhaseClick }: UnassignedPhasesPanelProps) {
    // Group phases by chantier
    const groupedPhases = useMemo(() => {
        const groups: Record<string, { chantier: PhaseWithRelations['chantier']; phases: PhaseWithRelations[] }> = {};

        phases.forEach((phase) => {
            const chantierId = phase.chantier_id;
            if (!groups[chantierId]) {
                groups[chantierId] = {
                    chantier: phase.chantier,
                    phases: [],
                };
            }
            groups[chantierId].phases.push(phase);
        });

        // Sort phases within each group by numero_phase
        Object.values(groups).forEach((group) => {
            group.phases.sort((a, b) => a.numero_phase - b.numero_phase);
        });

        return Object.values(groups);
    }, [phases]);

    // Status icons
    const getStatusIcon = (statut: string): string => {
        const icons: Record<string, string> = {
            nouveau: '🆕',
            planifie: '📅',
            en_cours: '🔄',
            pose_en_cours: '🔨',
            a_terminer: '⏳',
            termine: '✅',
        };
        return icons[statut] || '📦';
    };

    return (
        <div className="w-64 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/30 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    À attribuer
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                        {phases.length}
                    </span>
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 space-y-4">
                {groupedPhases.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500">Toutes les phases sont attribuées</p>
                    </div>
                ) : (
                    groupedPhases.map((group) => (
                        <div key={group.chantier?.id || 'unknown'} className="space-y-2">
                            {/* Chantier header */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    {getStatusIcon(group.chantier?.statut || 'nouveau')}
                                </span>
                                <p className="text-xs font-medium text-slate-400 truncate flex-1">
                                    {group.chantier?.nom || 'Chantier inconnu'}
                                </p>
                            </div>

                            {/* Phases */}
                            <div className="space-y-1.5 pl-2 border-l-2 border-slate-700/50">
                                {group.phases.map((phase) => (
                                    <DraggableUnassignedPhase
                                        key={phase.id}
                                        phase={phase}
                                        onClick={() => onPhaseClick(phase)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
                <p className="text-xs text-slate-500 text-center">
                    Glissez une phase vers un poseur pour l'attribuer
                </p>
            </div>
        </div>
    );
}
