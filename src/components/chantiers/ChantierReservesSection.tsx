import { useState, useEffect } from 'react';
import { ChevronDown, AlertTriangle, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Note } from './types';

interface ChantierReservesSectionProps {
    chantierId: string;
    defaultExpanded?: boolean;
    onPhotoClick?: (url: string) => void;
}

export function ChantierReservesSection({
    chantierId,
    defaultExpanded = false,
    onPhotoClick,
}: ChantierReservesSectionProps) {
    const [reserves, setReserves] = useState<Note[]>([]);
    const [expanded, setExpanded] = useState(defaultExpanded);

    useEffect(() => {
        const fetchReserves = async () => {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('*')
                .eq('chantier_id', chantierId)
                .eq('type', 'reserve')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            setReserves((data as Note[]) || []);
        };
        fetchReserves();
    }, [chantierId]);

    const openReserves = reserves.filter(
        (r) => r.statut_reserve === 'ouverte' || r.statut_reserve === 'en_cours'
    );

    const statusColors = {
        ouverte: 'bg-red-500/20 text-red-400 border-red-500/30',
        en_cours: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        levee: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejetee: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    const statusLabels = {
        ouverte: 'Ouverte',
        en_cours: 'En cours',
        levee: 'Levée',
        rejetee: 'Rejetée',
    };

    return (
        <section className="glass-card p-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                        Réserves ({reserves.length})
                    </h3>
                    {openReserves.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                            {openReserves.length} ouverte(s)
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {expanded && (
                <div className="mt-4 space-y-3">
                    {reserves.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Aucune réserve signalée
                        </p>
                    ) : (
                        reserves.map((reserve) => {
                            const status = reserve.statut_reserve || 'ouverte';

                            return (
                                <div
                                    key={reserve.id}
                                    className={`p-3 rounded-lg border ${statusColors[status as keyof typeof statusColors]}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded font-medium ${statusColors[status as keyof typeof statusColors]}`}
                                                >
                                                    {statusLabels[status as keyof typeof statusLabels]}
                                                </span>
                                                {reserve.localisation && (
                                                    <span className="text-xs text-slate-500">
                                                        📍 {reserve.localisation}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-300 line-clamp-2">
                                                {reserve.contenu || 'Aucune description'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                <span>
                                                    {reserve.creator
                                                        ? `${reserve.creator.first_name || ''} ${reserve.creator.last_name || ''}`.trim()
                                                        : 'Utilisateur'}
                                                </span>
                                                <span>
                                                    {new Date(reserve.created_at).toLocaleDateString('fr-FR')}
                                                </span>
                                                {reserve.date_resolution && (
                                                    <span className="text-green-400">
                                                        Résolu le{' '}
                                                        {new Date(reserve.date_resolution).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                            </div>
                                            {reserve.commentaire_resolution && (
                                                <p className="text-xs text-slate-400 mt-1 italic">
                                                    💬 {reserve.commentaire_resolution}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                <button
                                                    onClick={() => {
                                                        const url = reserve.photo_1_url || reserve.photo_2_url;
                                                        if (url) onPhotoClick?.(url);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                                                    title="Voir photo"
                                                >
                                                    <Image className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </section>
    );
}
