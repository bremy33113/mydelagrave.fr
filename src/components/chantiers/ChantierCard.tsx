import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
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
    showChargeAffaire?: boolean; // Pour admin/superviseur
}

export function ChantierCard({ chantier, isSelected, onClick, showChargeAffaire = false }: ChantierCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get upcoming phases (date_debut >= today), sorted by date
    const upcomingPhases = useMemo(() => {
        if (!chantier.phases_chantiers?.length) return [];

        const today = formatLocalDate(new Date());

        return chantier.phases_chantiers
            .filter(phase => phase.duree_heures > 0 && phase.date_debut >= today)
            .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
            .map(phase => {
                const [year, month, day] = phase.date_debut.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return {
                    id: phase.id,
                    poseur: phase.poseur,
                    week: getWeekNumber(date),
                    date_debut: phase.date_debut,
                };
            });
    }, [chantier.phases_chantiers]);

    // Get past phases (date_debut < today) for fallback display
    const pastWeeks = useMemo(() => {
        if (!chantier.phases_chantiers?.length) return [];

        const today = formatLocalDate(new Date());

        const weeksMap = new Map<number, Date>();
        chantier.phases_chantiers
            .filter(phase => phase.duree_heures > 0 && phase.date_debut < today)
            .forEach(phase => {
                if (phase.date_debut) {
                    const [year, month, day] = phase.date_debut.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    const week = getWeekNumber(date);
                    const existing = weeksMap.get(week);
                    if (!existing || date < existing) {
                        weeksMap.set(week, date);
                    }
                }
            });

        return Array.from(weeksMap.entries())
            .sort((a, b) => a[1].getTime() - b[1].getTime())
            .map(([week]) => week);
    }, [chantier.phases_chantiers]);

    const hasMultipleUpcomingPhases = upcomingPhases.length > 1;
    const hasUpcomingPhases = upcomingPhases.length > 0;

    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Largeurs des colonnes selon si on affiche le chargé d'affaire ou non
    const colWidths = showChargeAffaire
        ? { chevron: '5%', ref: '10%', nom: '50%', ca: '10%', poseur: '10%', semaine: '15%' }
        : { chevron: '5%', ref: '10%', nom: '50%', ca: '0%', poseur: '20%', semaine: '15%' };

    return (
        <button
            onClick={onClick}
            data-testid="chantier-card"
            className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 animate-fadeIn ${isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                }`}
        >
            {/* Ligne principale */}
            <div className="flex items-center">
                {/* Chevron - only if multiple upcoming phases */}
                <div style={{ width: colWidths.chevron }} className="flex items-center justify-center">
                    {hasMultipleUpcomingPhases ? (
                        <ChevronRight
                            className={`w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            onClick={handleChevronClick}
                        />
                    ) : null}
                </div>

                {/* Référence */}
                <div style={{ width: colWidths.ref }} className="text-xs text-blue-400 font-semibold truncate">
                    {chantier.reference || '-'}
                </div>

                {/* Nom */}
                <div style={{ width: colWidths.nom }} className="min-w-0">
                    <h3 className="font-semibold text-white truncate text-sm uppercase">{chantier.nom}</h3>
                </div>

                {/* Chargé d'affaire (conditionnel) */}
                {showChargeAffaire && (
                    <div style={{ width: colWidths.ca }} className="text-xs text-slate-400 truncate">
                        {chantier.charge_affaire ? (
                            <span>{chantier.charge_affaire.first_name?.[0]}.{chantier.charge_affaire.last_name}</span>
                        ) : (
                            <span className="text-slate-500">-</span>
                        )}
                    </div>
                )}

                {/* Poseur de la phase */}
                <div style={{ width: colWidths.poseur }} className="text-xs text-slate-400 truncate">
                    {hasUpcomingPhases ? (
                        upcomingPhases[0].poseur ? (
                            <span>{upcomingPhases[0].poseur.first_name?.[0]}.{upcomingPhases[0].poseur.last_name}</span>
                        ) : (
                            <span className="text-slate-500">-</span>
                        )
                    ) : (
                        // Fallback: poseur du chantier si pas de phases à venir
                        chantier.poseur ? (
                            <span className="text-slate-500">{chantier.poseur.first_name?.[0]}.{chantier.poseur.last_name}</span>
                        ) : (
                            <span className="text-slate-500">-</span>
                        )
                    )}
                </div>

                {/* Semaine */}
                <div style={{ width: colWidths.semaine }} className="flex items-center justify-end gap-1">
                    {hasUpcomingPhases ? (
                        // Afficher la semaine de la première phase à venir
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium text-xs">
                            S{upcomingPhases[0].week}
                        </span>
                    ) : pastWeeks.length > 0 ? (
                        // Fallback: afficher les semaines passées en grisé
                        pastWeeks.map((week) => (
                            <span
                                key={week}
                                className="px-1.5 py-0.5 rounded bg-slate-600/30 text-slate-500 font-medium text-xs"
                            >
                                S{week}
                            </span>
                        ))
                    ) : null}
                </div>
            </div>

            {/* Lignes phases suivantes (si expanded) */}
            {isExpanded && upcomingPhases.slice(1).map(phase => (
                <div key={phase.id} className="flex items-center mt-1">
                    {/* Chevron placeholder */}
                    <div style={{ width: colWidths.chevron }} />

                    {/* Référence placeholder */}
                    <div style={{ width: colWidths.ref }} />

                    {/* Nom placeholder */}
                    <div style={{ width: colWidths.nom }} />

                    {/* CA placeholder (conditionnel) */}
                    {showChargeAffaire && <div style={{ width: colWidths.ca }} />}

                    {/* Poseur de la phase */}
                    <div style={{ width: colWidths.poseur }} className="text-xs text-slate-400 truncate">
                        {phase.poseur ? (
                            <span>{phase.poseur.first_name?.[0]}.{phase.poseur.last_name}</span>
                        ) : (
                            <span className="text-slate-500">-</span>
                        )}
                    </div>

                    {/* Semaine */}
                    <div style={{ width: colWidths.semaine }} className="flex items-center justify-end">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium text-xs">
                            S{phase.week}
                        </span>
                    </div>
                </div>
            ))}
        </button>
    );
}
