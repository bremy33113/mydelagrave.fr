import {
    MapPin,
    User,
    Building2,
    Calendar,
    Phone,
    Mail,
    Edit,
    Trash2,
    FileText,
    Users,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { ChantierStatusBadge } from '../ui/ChantierStatusBadge';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
};

interface ChantierDetailProps {
    chantier: Chantier;
    onEdit?: () => void;
    onDelete?: () => void;
    onManagePhases?: () => void;
    onManageContacts?: () => void;
}

export function ChantierDetail({
    chantier,
    onEdit,
    onDelete,
    onManagePhases,
    onManageContacts,
}: ChantierDetailProps) {
    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center text-2xl">
                            {chantier.ref_categories_chantier?.icon || '📦'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{chantier.nom}</h2>
                            {chantier.reference && (
                                <p className="text-slate-400">Réf: {chantier.reference}</p>
                            )}
                            <div className="mt-2">
                                <ChantierStatusBadge statut={chantier.statut} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                title="Modifier"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onManagePhases}
                        className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                            <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-white">Phases</p>
                            <p className="text-xs text-slate-400">Gérer le planning</p>
                        </div>
                    </button>

                    <button
                        onClick={onManageContacts}
                        className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-white">Contacts</p>
                            <p className="text-xs text-slate-400">Gérer les intervenants</p>
                        </div>
                    </button>
                </div>

                {/* Coordonnées chantier */}
                {(chantier.client || chantier.adresse_livraison) && (
                    <section className="glass-card p-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Coordonnées chantier
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Client */}
                            {chantier.client && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 uppercase">Client principal</p>
                                    <p className="text-base font-medium text-white">{chantier.client.nom}</p>
                                    {chantier.client.entreprise && (
                                        <p className="text-sm text-slate-400">{chantier.client.entreprise}</p>
                                    )}
                                    {chantier.client.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Mail className="w-3 h-3" />
                                            <a
                                                href={`mailto:${chantier.client.email}`}
                                                className="hover:text-blue-400 transition-colors truncate"
                                            >
                                                {chantier.client.email}
                                            </a>
                                        </div>
                                    )}
                                    {chantier.client.telephone && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Phone className="w-3 h-3" />
                                            <a
                                                href={`tel:${chantier.client.telephone}`}
                                                className="hover:text-blue-400 transition-colors"
                                            >
                                                {chantier.client.telephone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Adresse livraison */}
                            {chantier.adresse_livraison && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 uppercase">Adresse de livraison</p>
                                    <p className="text-sm text-white">{chantier.adresse_livraison}</p>
                                    {chantier.adresse_livraison_latitude && chantier.adresse_livraison_longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${chantier.adresse_livraison_latitude},${chantier.adresse_livraison_longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            Voir sur Google Maps
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Dates & Charge d'affaires */}
                <section className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Informations
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Date début</p>
                            <div className="flex items-center gap-2 text-white">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDate(chantier.date_debut)}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Date fin</p>
                            <div className="flex items-center gap-2 text-white">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDate(chantier.date_fin)}
                            </div>
                        </div>
                        {chantier.charge_affaire && (
                            <div className="col-span-2">
                                <p className="text-xs text-slate-500 mb-1">Chargé d'affaires</p>
                                <div className="flex items-center gap-2 text-white">
                                    <User className="w-4 h-4 text-slate-400" />
                                    {chantier.charge_affaire.first_name} {chantier.charge_affaire.last_name}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Completion status */}
                <section className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        État de complétion
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg ${chantier.reserves_levees
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            {chantier.reserves_levees ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm">Réserves levées</span>
                        </div>
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg ${chantier.doe_fourni
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            {chantier.doe_fourni ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm">DOE fourni</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
