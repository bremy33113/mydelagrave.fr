import { useState, useMemo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, AlertCircle, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { PhaseWithRelations } from '../../pages/PlanningPage';
import type { Tables } from '../../lib/database.types';

type FilterPeriod = 7 | 15 | 21 | 'all';

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
    highlightedChantierId: string | null;
    onChantierHighlight: (chantierId: string | null) => void;
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
            className={`py-1 px-1.5 rounded border cursor-pointer hover:bg-slate-700/50 transition-colors ${
                isDragging ? 'opacity-80 shadow-xl cursor-grabbing' : ''
            } ${hasDate ? 'bg-slate-800/50 border-slate-700/50' : 'bg-red-500/10 border-red-500/30'}`}
        >
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-700/50 px-0.5 rounded">
                    {groupePhase}.{phase.numero_phase}
                </span>
                <p className="text-xs font-medium text-white truncate flex-1">
                    {phase.libelle || `Sous-phase ${phase.numero_phase}`}
                </p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
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
    forceExpanded?: boolean | null;
}

function PhaseTree({ group, onPhaseClick, forceExpanded }: PhaseTreeProps) {
    const [expanded, setExpanded] = useState(true);

    // Sync with forceExpanded when it changes
    useEffect(() => {
        if (forceExpanded !== null && forceExpanded !== undefined) {
            setExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    return (
        <div className="space-y-0.5">
            {/* Phase header (clickable to expand/collapse) */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-1.5 py-1 px-1.5 rounded bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors text-left"
            >
                {expanded ? (
                    <ChevronDown className="w-3 h-3 text-purple-400 flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                )}
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1 rounded flex-shrink-0">
                    P{group.groupePhase}
                </span>
                <span className="text-xs font-medium text-white truncate flex-1">
                    {group.phaseLabel}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-700/50 px-1 rounded">
                    {group.subPhases.length}
                </span>
            </button>

            {/* Sub-phases (tree children) */}
            {expanded && (
                <div className="space-y-1 pl-3 ml-1.5 border-l-2 border-purple-500/30">
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

export function UnassignedPhasesPanel({ groupedPhases, onPhaseClick, highlightedChantierId, onChantierHighlight }: UnassignedPhasesPanelProps) {
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
    const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

    // Filter phases based on selected period
    const { filteredPhases, totalCount, filteredCount } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate total count (all unassigned)
        const total = groupedPhases.reduce((sum, g) => sum + g.subPhases.length, 0);

        if (filterPeriod === 'all') {
            return { filteredPhases: groupedPhases, totalCount: total, filteredCount: total };
        }

        // Filter by period
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + filterPeriod);

        const filtered = groupedPhases.map(group => {
            const filteredSubPhases = group.subPhases.filter(phase => {
                if (!phase.date_debut) return true; // Include non-planned phases
                const phaseDate = new Date(phase.date_debut);
                return phaseDate >= today && phaseDate <= endDate;
            });
            return { ...group, subPhases: filteredSubPhases };
        }).filter(group => group.subPhases.length > 0);

        const count = filtered.reduce((sum, g) => sum + g.subPhases.length, 0);

        return { filteredPhases: filtered, totalCount: total, filteredCount: count };
    }, [groupedPhases, filterPeriod]);

    // Group phases by chantier for display
    const byChantier = filteredPhases.reduce((acc, group) => {
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

    const filterOptions: { value: FilterPeriod; label: string }[] = [
        { value: 7, label: '7j' },
        { value: 15, label: '15j' },
        { value: 21, label: '21j' },
        { value: 'all', label: 'Tous' },
    ];

    return (
        <div className="w-72 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/30 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50 space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    À attribuer
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        {filterPeriod === 'all' ? totalCount : `${filteredCount}/${totalCount}`}
                    </span>
                </h3>

                {/* Filter buttons */}
                <div className="flex gap-1">
                    {/* Expand/Collapse all button */}
                    <button
                        onClick={() => setAllExpanded(prev => prev === null ? false : !prev)}
                        className="px-2 py-1 text-xs font-medium rounded transition-colors bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300"
                        title={allExpanded === false ? 'Tout déplier' : 'Tout replier'}
                    >
                        <ChevronsUpDown className="w-3.5 h-3.5" />
                    </button>
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilterPeriod(option.value)}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                filterPeriod === option.value
                                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 space-y-4">
                {Object.keys(byChantier).length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500">
                            {totalCount === 0
                                ? 'Toutes les sous-phases sont attribuées'
                                : `Aucune sous-phase dans les ${filterPeriod} prochains jours`}
                        </p>
                    </div>
                ) : (
                    Object.entries(byChantier).map(([chantierId, data]) => {
                        const isHighlighted = highlightedChantierId === chantierId;
                        return (
                        <div key={chantierId} className="space-y-2">
                            {/* Chantier header */}
                            <button
                                onClick={() => onChantierHighlight(isHighlighted ? null : chantierId)}
                                className={`w-full flex items-center gap-2 pb-1 border-b transition-all cursor-pointer ${
                                    isHighlighted
                                        ? 'border-blue-500 bg-blue-500/10 -mx-2 px-2 py-1 rounded-lg'
                                        : 'border-slate-700/30 hover:border-slate-600'
                                }`}
                            >
                                <p className={`text-xs truncate flex-1 text-left ${
                                    isHighlighted ? 'text-blue-400' : 'text-slate-300'
                                }`}>
                                    {data.ref && (
                                        <span className="font-bold">{data.ref}</span>
                                    )}
                                    {data.ref && data.nom && ' - '}
                                    <span className={data.ref ? 'font-normal' : 'font-semibold'}>{data.nom}</span>
                                </p>
                                {isHighlighted && (
                                    <span className="text-xs text-blue-400">✓</span>
                                )}
                            </button>

                            {/* Phases tree */}
                            <div className="space-y-2">
                                {data.phases.map((phaseGroup) => (
                                    <PhaseTree
                                        key={`${phaseGroup.chantierId}-${phaseGroup.groupePhase}`}
                                        group={phaseGroup}
                                        onPhaseClick={onPhaseClick}
                                        forceExpanded={allExpanded}
                                    />
                                ))}
                            </div>
                        </div>
                    );})
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
