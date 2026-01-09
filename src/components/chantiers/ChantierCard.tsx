import { useMemo } from 'react';
import { User } from 'lucide-react';
import { ChantierStatusBadge } from '../ui/ChantierStatusBadge';
import { getWeekNumber } from '../../lib/dateUtils';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    phases_chantiers?: Tables<'phases_chantiers'>[] | null;
};

interface ChantierCardProps {
    chantier: Chantier;
    isSelected: boolean;
    onClick: () => void;
}

export function ChantierCard({ chantier, isSelected, onClick }: ChantierCardProps) {
    const categoryIcon = chantier.ref_categories_chantier?.icon || '📦';

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
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 animate-fadeIn ${isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{categoryIcon}</span>
                    <h3 className="font-semibold text-white truncate text-sm">{chantier.nom}</h3>
                    {chantier.reference && (
                        <span className="text-xs text-slate-500 flex-shrink-0">({chantier.reference})</span>
                    )}
                </div>
                <ChantierStatusBadge statut={chantier.statut} />
            </div>

            {/* Info row */}
            <div className="flex items-center justify-between text-xs text-slate-400">
                {chantier.charge_affaire && (
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                            {chantier.charge_affaire.first_name} {chantier.charge_affaire.last_name}
                        </span>
                    </div>
                )}
                {phaseWeeks.length > 0 && (
                    <div className="flex items-center gap-1">
                        {phaseWeeks.map((week) => (
                            <span
                                key={week}
                                className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium"
                            >
                                S{week}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </button>
    );
}
