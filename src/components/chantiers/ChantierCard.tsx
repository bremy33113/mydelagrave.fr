import { useMemo, useState, useEffect } from 'react';
import { ChevronRight, Wrench, Briefcase, CalendarX2 } from 'lucide-react';
import { getWeekNumber, formatLocalDate } from '../../lib/dateUtils';
import type { Tables } from '../../lib/database.types';

type PhaseWithPoseur = Tables<'phases_chantiers'> & {
    poseur?: Tables<'users'> | null;
};

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    poseur?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    phases_chantiers?: PhaseWithPoseur[] | null;
};

interface ChantierCardProps {
    chantier: Chantier;
    isSelected: boolean;
    onClick: () => void;
    filterByPoseurId?: string; // Pour poseur: ne montrer que ses phases
    forceExpanded?: boolean; // Contrôle global expand/collapse
}

// Format date courte: JJ/MM/YY
function formatDateShort(dateStr: string): string {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

export function ChantierCard({ chantier, isSelected, onClick, filterByPoseurId, forceExpanded }: ChantierCardProps) {
    // État local pour expand/collapse
    const [isExpanded, setIsExpanded] = useState(forceExpanded ?? true);

    // Synchroniser avec forceExpanded quand il change
    useEffect(() => {
        if (forceExpanded !== undefined) {
            setIsExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    // Get upcoming phases (date_debut >= today OR in current week), sorted by groupe_phase then numero_phase
    const displayPhases = useMemo(() => {
        if (!chantier.phases_chantiers?.length) return [];

        const today = formatLocalDate(new Date());
        const currentWeek = getWeekNumber(new Date());

        return chantier.phases_chantiers
            .filter(phase => {
                if (phase.duree_heures <= 0) return false;

                // Filtrer par poseur si demandé
                if (filterByPoseurId && phase.poseur_id !== filterByPoseurId) return false;

                // Inclure les phases futures OU de la semaine en cours
                const [year, month, day] = phase.date_debut.split('-').map(Number);
                const phaseDate = new Date(year, month - 1, day);
                const phaseWeek = getWeekNumber(phaseDate);

                return phase.date_debut >= today || phaseWeek === currentWeek;
            })
            .sort((a, b) => {
                // Trier par groupe_phase, puis numero_phase
                if (a.groupe_phase !== b.groupe_phase) {
                    return a.groupe_phase - b.groupe_phase;
                }
                return a.numero_phase - b.numero_phase;
            })
            .map(phase => {
                const [year, month, day] = phase.date_debut.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return {
                    id: phase.id,
                    groupe_phase: phase.groupe_phase,
                    numero_phase: phase.numero_phase,
                    poseur: phase.poseur,
                    week: getWeekNumber(date),
                    date_debut: phase.date_debut,
                    duree_heures: phase.duree_heures,
                    libelle: phase.libelle,
                };
            });
    }, [chantier.phases_chantiers, filterByPoseurId]);

    return (
        <button
            onClick={onClick}
            data-testid="chantier-card"
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 animate-fadeIn ${isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                }`}
        >
            {/* Ligne principale du chantier */}
            <div className="flex items-center">
                {/* Chevron expand/collapse ou icône agenda barré - 5% */}
                <div style={{ width: '5%' }} className="flex items-center justify-center" title={displayPhases.length === 0 ? 'Aucune phase planifiée' : undefined}>
                    {displayPhases.length > 0 ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="cursor-pointer hover:text-white"
                        >
                            <ChevronRight
                                className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        </span>
                    ) : (
                        <CalendarX2 className="w-4 h-4 text-red-400/60" />
                    )}
                </div>

                {/* Référence - 10% */}
                <div style={{ width: '10%' }} className="text-xs text-blue-400 font-semibold truncate">
                    {chantier.reference || '-'}
                </div>

                {/* Nom du chantier - 55% */}
                <div style={{ width: '55%' }} className="font-semibold text-white truncate text-sm uppercase">
                    {chantier.nom}
                </div>

                {/* Icône + Chargé d'affaire - 20% */}
                <div style={{ width: '20%' }} className="flex items-center gap-1 text-xs text-slate-400 truncate">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    {chantier.charge_affaire ? (
                        <span>{chantier.charge_affaire.first_name} {chantier.charge_affaire.last_name}</span>
                    ) : (
                        <span className="text-slate-500">-</span>
                    )}
                </div>

                {/* Colonne vide - 10% */}
                <div style={{ width: '10%' }} />
            </div>

            {/* Lignes des phases */}
            {isExpanded && displayPhases.length > 0 && (
                <div className="mt-1 space-y-0.5">
                    {displayPhases.map(phase => (
                        <div key={phase.id} className="flex items-center text-xs">
                            {/* Flèche vers la droite - 5% */}
                            <div style={{ width: '5%' }} className="flex items-center justify-center text-slate-500">
                                →
                            </div>

                            {/* N° Semaine - 5% */}
                            <div style={{ width: '5%' }} className="text-emerald-400 font-bold">
                                S{phase.week}
                            </div>

                            {/* N° sous-phase - 5% */}
                            <div style={{ width: '5%' }} className="text-purple-400 font-medium">
                                {phase.groupe_phase}.{phase.numero_phase}
                            </div>

                            {/* Date début - 15% */}
                            <div style={{ width: '15%' }} className="text-slate-400">
                                {formatDateShort(phase.date_debut)}
                            </div>

                            {/* Nbre d'heures - 15% */}
                            <div style={{ width: '15%' }} className="text-green-400 font-medium">
                                {phase.duree_heures}h
                            </div>

                            {/* Nom phase - 25% */}
                            <div style={{ width: '25%' }} className="text-slate-300 truncate">
                                {phase.libelle || `Phase ${phase.groupe_phase}.${phase.numero_phase}`}
                            </div>

                            {/* Icône clé + Nom Poseur - 15% */}
                            <div style={{ width: '15%' }} className="flex items-center gap-1 text-slate-400 truncate">
                                <Wrench className="w-3 h-3 text-slate-500" />
                                {phase.poseur ? (
                                    <span>{phase.poseur.first_name} {phase.poseur.last_name}</span>
                                ) : (
                                    <span className="text-slate-500">-</span>
                                )}
                            </div>

                            {/* Vide - 15% */}
                            <div style={{ width: '15%' }} />
                        </div>
                    ))}
                </div>
            )}
        </button>
    );
}
