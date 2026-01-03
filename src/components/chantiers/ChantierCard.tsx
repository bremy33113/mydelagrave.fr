import { MapPin, User, Building2, Calendar } from 'lucide-react';
import { ChantierStatusBadge } from '../ui/ChantierStatusBadge';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
};

interface ChantierCardProps {
    chantier: Chantier;
    isSelected: boolean;
    onClick: () => void;
}

export function ChantierCard({ chantier, isSelected, onClick }: ChantierCardProps) {
    const categoryIcon = chantier.ref_categories_chantier?.icon || '📦';

    const formatDate = (date: string | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 animate-fadeIn ${isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{categoryIcon}</span>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{chantier.nom}</h3>
                        {chantier.reference && (
                            <p className="text-xs text-slate-400">{chantier.reference}</p>
                        )}
                    </div>
                </div>
                <ChantierStatusBadge statut={chantier.statut} />
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-sm">
                {/* Client */}
                {chantier.client && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                            {chantier.client.entreprise || chantier.client.nom}
                        </span>
                    </div>
                )}

                {/* Address */}
                {chantier.adresse_livraison && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{chantier.adresse_livraison}</span>
                    </div>
                )}

                {/* Charge d'affaires */}
                {chantier.charge_affaire && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                            {chantier.charge_affaire.first_name} {chantier.charge_affaire.last_name}
                        </span>
                    </div>
                )}

                {/* Dates */}
                {chantier.date_debut && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                            {formatDate(chantier.date_debut)}
                            {chantier.date_fin && ` → ${formatDate(chantier.date_fin)}`}
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
}
