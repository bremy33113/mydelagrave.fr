import { Edit, Trash2, Clock, Users } from 'lucide-react';
import { ChantierStatusTimeline } from './ChantierStatusTimeline';
import type { Chantier } from './types';

interface ChantierDetailHeaderProps {
    chantier: Chantier;
    onEdit?: () => void;
    onDelete?: () => void;
    onManagePhases?: () => void;
    onManageContacts?: () => void;
    onStatusChange?: (newStatus: string) => void;
}

export function ChantierDetailHeader({
    chantier,
    onEdit,
    onDelete,
    onManagePhases,
    onManageContacts,
    onStatusChange,
}: ChantierDetailHeaderProps) {
    return (
        <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-start justify-between gap-4">
                {/* Infos chantier */}
                <div className="flex items-start gap-4 flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center text-2xl">
                        {chantier.ref_categories_chantier?.icon || '📦'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{chantier.nom}</h2>
                        {chantier.reference && (
                            <p className="text-slate-400">Réf: {chantier.reference}</p>
                        )}
                        {chantier.ref_categories_chantier && (
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">
                                    <span>{chantier.ref_categories_chantier.icon}</span>
                                    {chantier.ref_categories_chantier.label}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                title="Modifier"
                                data-testid="btn-edit-chantier"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Supprimer"
                                data-testid="btn-delete-chantier"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onManagePhases}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
                            title="Gérer les phases"
                        >
                            <Clock className="w-4 h-4" />
                            Phases
                        </button>
                        <button
                            onClick={onManageContacts}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                            title="Gérer les contacts"
                        >
                            <Users className="w-4 h-4" />
                            Contacts
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline de statut - en bas à gauche */}
            <div className="mt-4">
                <ChantierStatusTimeline
                    chantierId={chantier.id}
                    currentStatus={chantier.statut}
                    onStatusChange={onStatusChange}
                />
            </div>
        </div>
    );
}
