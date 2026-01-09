import { useMemo } from 'react';
import { getWeekNumber } from '../../lib/dateUtils';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    poseur?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    phases_chantiers?: Tables<'phases_chantiers'>[] | null;
};

interface ChantierCardProps {
    chantier: Chantier;
    isSelected: boolean;
    onClick: () => void;
}

export function ChantierCard({ chantier, isSelected, onClick }: ChantierCardProps) {
    // Get unique week numbers from phases, sorted chronologically
    const phaseWeeks = useMemo(() => {
        if (!chantier.phases_chantiers?.length) return [];

        const weeksMap = new Map<number, Date>();
        chantier.phases_chantiers
            // Filter out placeholder phases (duree_heures = 0)
            .filter(phase => phase.duree_heures > 0)
            .forEach(phase => {
                if (phase.date_debut) {
                    // Parse as local date (not UTC) to avoid timezone shift
                    // "2026-01-12" → local midnight, not UTC midnight
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

    return (
        <button
            onClick={onClick}
            data-testid="chantier-card"
            className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 animate-fadeIn ${isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                }`}
        >
            <div className="flex items-center">
                {/* Colonne 1: Référence (bleu) (10%) */}
                <div className="w-[10%] text-xs text-blue-400 font-semibold truncate">
                    {chantier.reference || '-'}
                </div>

                {/* Colonne 2: Nom (majuscule) (45%) */}
                <div className="w-[45%] min-w-0">
                    <h3 className="font-semibold text-white truncate text-sm uppercase">{chantier.nom}</h3>
                </div>

                {/* Colonne 3: Chargé d'affaire (15%) */}
                <div className="w-[15%] text-xs text-slate-400 truncate">
                    {chantier.charge_affaire && (
                        <span>{chantier.charge_affaire.first_name?.[0]}.{chantier.charge_affaire.last_name}</span>
                    )}
                </div>

                {/* Colonne 4: Poseur (15%) */}
                <div className="w-[15%] text-xs text-slate-400 truncate">
                    {chantier.poseur && (
                        <span>{chantier.poseur.first_name?.[0]}.{chantier.poseur.last_name}</span>
                    )}
                </div>

                {/* Colonne 5: Semaines (15%) */}
                <div className="w-[15%] flex items-center justify-end gap-1">
                    {phaseWeeks.map((week) => (
                        <span
                            key={week}
                            className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium text-xs"
                        >
                            S{week}
                        </span>
                    ))}
                </div>
            </div>
        </button>
    );
}
