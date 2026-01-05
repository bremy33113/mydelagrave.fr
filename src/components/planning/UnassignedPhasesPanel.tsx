import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { PhaseWithRelations } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

export interface PhaseGroup {
    chantierId: string;
    chantierNom: string;
    chantierRef: string | null;
    groupePhase: number;
    phaseLabel: string;
    subPhases: PhaseWithRelations[];
}

interface UnassignedPhasesPanelProps {
    groupedPhases: PhaseGroup[];
    onPhaseUpdate: (phaseId: string, updates: Partial<Tables<'phases_chantiers'>>) => Promise<void>;
    onPhaseClick: (phase: PhaseWithRelations) => void;
}

interface DraggableSubPhaseProps {
    phase: PhaseWithRelations;
    groupePhase: number;
    onClick: () => void;
}

function DraggableSubPhase({ phase, groupePhase, onClick }: DraggableSubPhaseProps) {
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
            title={!hasDate ? 'Sous-phase non planifiée' : undefined}
            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-700/50 transition-colors ${
                isDragging ? 'opacity-80 shadow-xl cursor-grabbing' : ''
            } ${hasDate ? 'bg-slate-800/50 border-slate-700/50' : 'bg-red-500/10 border-red-500/30'}`}
        >
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-700/50 px-1 rounded">
                    {groupePhase}.{phase.numero_phase}
                </span>
                <p className="text-sm font-medium text-white truncate flex-1">
                    {phase.libelle || `Sous-phase ${phase.numero_phase}`}
                </p>
            </div>
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

interface PhaseTreeProps {
    group: PhaseGroup;
    onPhaseClick: (phase: PhaseWithRelations) => void;
}

function PhaseTree({ group, onPhaseClick }: PhaseTreeProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="space-y-1">
            {/* Phase header (clickable to expand/collapse) */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors text-left"
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                )}
                <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                    P{group.groupePhase}
                </span>
                <span className="text-sm font-medium text-white truncate flex-1">
                    {group.phaseLabel}
                </span>
                <span className="text-xs text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                    {group.subPhases.length}
                </span>
            </button>

            {/* Sub-phases (tree children) */}
            {expanded && (
                <div className="space-y-1.5 pl-4 ml-2 border-l-2 border-purple-500/30">
                    {group.subPhases.map((subPhase) => (
                        <DraggableSubPhase
                            key={subPhase.id}
                            phase={subPhase}
                            groupePhase={group.groupePhase}
                            onClick={() => onPhaseClick(subPhase)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function UnassignedPhasesPanel({ groupedPhases, onPhaseClick }: UnassignedPhasesPanelProps) {
    // Group phases by chantier for display
    const byChantier = groupedPhases.reduce((acc, group) => {
        if (!acc[group.chantierId]) {
            acc[group.chantierId] = {
                nom: group.chantierNom,
                ref: group.chantierRef,
                phases: [],
            };
        }
        acc[group.chantierId].phases.push(group);
        return acc;
    }, {} as Record<string, { nom: string; ref: string | null; phases: PhaseGroup[] }>);

    // Total count of unassigned sub-phases
    const totalCount = groupedPhases.reduce((sum, g) => sum + g.subPhases.length, 0);

    return (
        <div className="w-72 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/30 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    À attribuer
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                        {totalCount}
                    </span>
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 space-y-4">
                {Object.keys(byChantier).length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500">Toutes les sous-phases sont attribuées</p>
                    </div>
                ) : (
                    Object.entries(byChantier).map(([chantierId, data]) => (
                        <div key={chantierId} className="space-y-2">
                            {/* Chantier header */}
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-700/30">
                                <p className="text-xs font-semibold text-slate-300 truncate flex-1">
                                    {data.ref || data.nom}
                                </p>
                            </div>

                            {/* Phases tree */}
                            <div className="space-y-2">
                                {data.phases.map((phaseGroup) => (
                                    <PhaseTree
                                        key={`${phaseGroup.chantierId}-${phaseGroup.groupePhase}`}
                                        group={phaseGroup}
                                        onPhaseClick={onPhaseClick}
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
                    Glissez une sous-phase vers un poseur pour l'attribuer
                </p>
            </div>
        </div>
    );
}
