import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit, Calendar, User } from 'lucide-react';
import { PhaseGauge } from './PhaseGauge';
import type { Tables } from '../../lib/database.types';

type Phase = Tables<'phases_chantiers'> & {
    poseur?: { id: string; first_name: string | null; last_name: string | null } | null;
};

interface PhaseGroupProps {
    groupNumber: number;
    groupLabel: string;
    budgetHours: number | null;
    subPhases: Phase[];
    onAddSubPhase: (groupNumber: number) => void;
    onEditSubPhase: (phase: Phase) => void;
    onDeleteSubPhase: (phaseId: string) => void;
    onEditGroup: (groupNumber: number) => void;
    onDeleteGroup: (groupNumber: number) => void;
}

// Format date in French short format
function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    });
}

export function PhaseGroup({
    groupNumber,
    groupLabel,
    budgetHours,
    subPhases,
    onAddSubPhase,
    onEditSubPhase,
    onDeleteSubPhase,
    onEditGroup,
    onDeleteGroup,
}: PhaseGroupProps) {
    const [expanded, setExpanded] = useState(true);

    // Calculate consumed hours for this group
    const consumedHours = subPhases.reduce((sum, p) => sum + p.duree_heures, 0);

    return (
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            {/* Group Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 flex-1">
                    {expanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-sm font-medium">
                                Phase {groupNumber}
                            </span>
                            <span className="font-medium text-white">{groupLabel || `Phase ${groupNumber}`}</span>
                        </div>

                        {/* Gauge */}
                        <div className="mt-2 max-w-md">
                            <PhaseGauge
                                consumed={consumedHours}
                                allocated={budgetHours || 0}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Group actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {budgetHours && (
                        <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs">
                            Budget: {budgetHours}h
                        </span>
                    )}
                    <button
                        onClick={() => onEditGroup(groupNumber)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        title="Modifier la phase"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDeleteGroup(groupNumber)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Supprimer la phase et ses sous-phases"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Sub-phases */}
            {expanded && (
                <div className="border-t border-slate-700/50">
                    {subPhases.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            Aucune sous-phase planifiée
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/30">
                            {subPhases.map((phase) => {
                                const startHour = parseInt(phase.heure_debut.split(':')[0]);
                                const endHour = parseInt(phase.heure_fin.split(':')[0]);

                                return (
                                    <div
                                        key={phase.id}
                                        className="p-3 pl-12 flex items-center justify-between group hover:bg-slate-700/20 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs font-mono">
                                                    {groupNumber}.{phase.numero_phase}
                                                </span>
                                                <span className="text-white font-medium truncate">
                                                    {phase.libelle || `Sous-phase ${phase.numero_phase}`}
                                                </span>
                                                {phase.poseur && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">
                                                        <User className="w-3 h-3" />
                                                        {phase.poseur.first_name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDateShort(phase.date_debut)} {startHour}h</span>
                                                <span>→</span>
                                                <span>{formatDateShort(phase.date_fin)} {endHour}h</span>
                                                <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                                                    {phase.duree_heures}h
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEditSubPhase(phase)}
                                                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteSubPhase(phase.id)}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add sub-phase button */}
                    <button
                        onClick={() => onAddSubPhase(groupNumber)}
                        className="w-full p-3 text-sm text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2 border-t border-slate-700/30"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter sous-phase {groupNumber}.{subPhases.length + 1}
                    </button>
                </div>
            )}
        </div>
    );
}
