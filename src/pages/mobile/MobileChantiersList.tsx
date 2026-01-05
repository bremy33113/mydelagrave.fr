import { useState, useEffect, useCallback } from 'react';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Search, ChevronRight, RefreshCw, Wrench, Truck } from 'lucide-react';

interface Chantier {
    id: string;
    reference: string | null;
    nom: string;
    adresse_livraison: string;
    date_debut: string | null;
    date_fin: string | null;
    statut: string;
    categorie: string | null;
    type: string | null;
    client: { nom: string } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    labo: 'Laboratoire',
    en: 'Enseignement',
    hospitalier: 'Hospitalier',
    collectivite: 'Collectivité',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    nouveau: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Nouveau' },
    en_preparation: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'En préparation' },
    en_cours: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'En cours' },
    termine: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Terminé' },
    annule: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Annulé' },
};

export function MobileChantiersList() {
    const [chantiers, setChantiers] = useState<Chantier[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const { userId } = useUserRole();

    const fetchChantiers = useCallback(async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('chantiers')
                .select(`
                    id,
                    reference,
                    nom,
                    adresse_livraison,
                    date_debut,
                    date_fin,
                    statut,
                    categorie,
                    type,
                    client:client_id(nom)
                `)
                .eq('charge_affaire_id', userId)
                .is('deleted_at', null)
                .order('date_debut', { ascending: false });

            if (error) throw error;
            setChantiers(data || []);
        } catch (err) {
            console.error('Erreur chargement chantiers:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchChantiers();
    }, [fetchChantiers]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchChantiers();
    };

    const filteredChantiers = chantiers.filter((c) => {
        const searchLower = search.toLowerCase();
        return (
            c.nom.toLowerCase().includes(searchLower) ||
            c.adresse_livraison?.toLowerCase().includes(searchLower) ||
            c.client?.nom?.toLowerCase().includes(searchLower)
        );
    });

    const getWeekNumber = (date: string | null): number | null => {
        if (!date) return null;
        const d = new Date(date);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const getStatusInfo = (statut: string) => {
        return STATUS_COLORS[statut] || STATUS_COLORS.nouveau;
    };

    const getCategoryLabel = (categorie: string | null) => {
        if (!categorie) return null;
        return CATEGORY_LABELS[categorie] || categorie;
    };

    if (loading) {
        return (
            <MobileLayout title="Mes Chantiers">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="Mes Chantiers">
            <div className="p-4 space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Compteur */}
                <p className="text-sm text-slate-400">
                    {filteredChantiers.length} chantier{filteredChantiers.length > 1 ? 's' : ''}
                </p>

                {/* Liste des chantiers */}
                <div className="space-y-3">
                    {filteredChantiers.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>Aucun chantier trouvé</p>
                        </div>
                    ) : (
                        filteredChantiers.map((chantier) => {
                            const status = getStatusInfo(chantier.statut);
                            const weekNum = getWeekNumber(chantier.date_debut);
                            const categoryLabel = getCategoryLabel(chantier.categorie);
                            const isFournitureSeule = chantier.type === 'fourniture';

                            return (
                                <div
                                    key={chantier.id}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 active:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Ligne 1: Reference + Type icon */}
                                            <div className="flex items-center gap-2 mb-1">
                                                {isFournitureSeule ? (
                                                    <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                                ) : (
                                                    <Wrench className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                )}
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {chantier.reference || 'N/A'}
                                                </span>
                                                {/* Status badge */}
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Ligne 2: Nom du chantier */}
                                            <h3 className="font-semibold text-white truncate">
                                                {chantier.nom}
                                            </h3>

                                            {/* Ligne 3: Catégorie + Semaine */}
                                            <div className="flex items-center gap-2 mt-2 text-sm">
                                                {categoryLabel && (
                                                    <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                                                        {categoryLabel}
                                                    </span>
                                                )}
                                                {weekNum && (
                                                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
                                                        S{weekNum}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-2" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </MobileLayout>
    );
}
