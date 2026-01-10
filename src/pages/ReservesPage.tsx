import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Search, ExternalLink, Check, Clock, X, MapPin, User, Calendar, Building2, List, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/database.types';

type Reserve = Tables<'notes_chantiers'> & {
    chantier?: { id: string; nom: string; reference: string | null } | null;
    createur?: { first_name: string | null; last_name: string | null } | null;
    traiteur?: { first_name: string | null; last_name: string | null } | null;
};

type StatutFilter = 'tous' | 'ouverte' | 'en_cours' | 'levee' | 'rejetee';

export function ReservesPage() {
    const [reserves, setReserves] = useState<Reserve[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');
    const [chantierFilter, setChantierFilter] = useState<string>('tous');
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    const [groupByChantier, setGroupByChantier] = useState(false);

    // Get current user ID for actions
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string } } | null } }) => {
            setCurrentUserId(session?.user?.id ?? null);
        });
    }, []);

    const fetchReserves = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('*, chantier:chantiers(id, nom, reference), createur:users!notes_chantiers_created_by_fkey(first_name, last_name), traiteur:users!notes_chantiers_traite_par_fkey(first_name, last_name)')
                .eq('type', 'reserve')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setReserves((data as Reserve[]) || []);
        } catch (err) {
            console.error('Error fetching reserves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReserves();
    }, []);

    // Get unique chantiers for filter dropdown
    const chantiers = useMemo(() => {
        const uniqueChantiers = new Map<string, { id: string; nom: string }>();
        reserves.forEach(r => {
            if (r.chantier) {
                uniqueChantiers.set(r.chantier.id, { id: r.chantier.id, nom: r.chantier.nom });
            }
        });
        return Array.from(uniqueChantiers.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [reserves]);

    // Filtered reserves
    const filteredReserves = useMemo(() => {
        return reserves.filter(reserve => {
            // Statut filter
            if (statutFilter !== 'tous' && reserve.statut_reserve !== statutFilter) {
                return false;
            }
            // Chantier filter
            if (chantierFilter !== 'tous' && reserve.chantier?.id !== chantierFilter) {
                return false;
            }
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchContent = reserve.contenu?.toLowerCase().includes(query);
                const matchLoc = reserve.localisation?.toLowerCase().includes(query);
                const matchChantier = reserve.chantier?.nom.toLowerCase().includes(query);
                const matchReference = reserve.chantier?.reference?.toLowerCase().includes(query);
                if (!matchContent && !matchLoc && !matchChantier && !matchReference) {
                    return false;
                }
            }
            return true;
        });
    }, [reserves, statutFilter, chantierFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const ouvertes = reserves.filter(r => r.statut_reserve === 'ouverte').length;
        const enCours = reserves.filter(r => r.statut_reserve === 'en_cours').length;
        const levees = reserves.filter(r => r.statut_reserve === 'levee').length;
        const rejetees = reserves.filter(r => r.statut_reserve === 'rejetee').length;
        return { ouvertes, enCours, levees, rejetees, total: reserves.length };
    }, [reserves]);

    // Grouped reserves by chantier
    const groupedReserves = useMemo(() => {
        const groups = new Map<string, { chantier: { id: string; nom: string; reference: string | null }; reserves: Reserve[] }>();

        filteredReserves.forEach(reserve => {
            const chantierId = reserve.chantier?.id || 'unknown';
            if (!groups.has(chantierId)) {
                groups.set(chantierId, {
                    chantier: reserve.chantier || { id: 'unknown', nom: 'Chantier inconnu', reference: null },
                    reserves: []
                });
            }
            groups.get(chantierId)?.reserves.push(reserve);
        });

        // Sort groups by chantier name
        return Array.from(groups.values()).sort((a, b) => a.chantier.nom.localeCompare(b.chantier.nom));
    }, [filteredReserves]);

    const handleTraiter = async (reserveId: string) => {
        if (!currentUserId) return;
        await supabase
            .from('notes_chantiers')
            .update({
                statut_reserve: 'en_cours',
                traite_par: currentUserId,
                date_traitement: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', reserveId);
        fetchReserves();
    };

    const handleResoudre = async (reserveId: string) => {
        await supabase
            .from('notes_chantiers')
            .update({
                statut_reserve: 'levee',
                date_resolution: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', reserveId);
        fetchReserves();
    };

    const handleRejeter = async (reserveId: string) => {
        await supabase
            .from('notes_chantiers')
            .update({
                statut_reserve: 'rejetee',
                date_resolution: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', reserveId);
        fetchReserves();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatutConfig = (statut: string | null) => {
        switch (statut) {
            case 'ouverte':
                return { label: 'Ouverte', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle };
            case 'en_cours':
                return { label: 'En cours', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock };
            case 'levee':
                return { label: 'Levée', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Check };
            case 'rejetee':
                return { label: 'Rejetée', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: X };
            default:
                return { label: 'Inconnue', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertTriangle };
        }
    };

    const getUserName = (user: { first_name: string | null; last_name: string | null } | null | undefined) => {
        if (!user) return 'Inconnu';
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Inconnu';
    };

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="ml-14">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <AlertTriangle className="w-7 h-7 text-amber-400" />
                        Réserves
                    </h1>
                    <p className="text-slate-400">Gestion des réserves signalées par les poseurs et chargés d'affaires</p>
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <span className="text-sm text-red-400 font-medium">{stats.ouvertes} ouverte(s)</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <span className="text-sm text-amber-400 font-medium">{stats.enCours} en cours</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                        <span className="text-sm text-green-400 font-medium">{stats.levees} levée(s)</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Nom, référence chantier ou description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Statut filter */}
                <select
                    value={statutFilter}
                    onChange={(e) => setStatutFilter(e.target.value as StatutFilter)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="ouverte">Ouvertes</option>
                    <option value="en_cours">En cours</option>
                    <option value="levee">Levées</option>
                    <option value="rejetee">Rejetées</option>
                </select>

                {/* Chantier filter */}
                <select
                    value={chantierFilter}
                    onChange={(e) => setChantierFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="tous">Tous les chantiers</option>
                    {chantiers.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                </select>

                {/* Toggle groupement */}
                <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
                    <button
                        onClick={() => setGroupByChantier(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                            !groupByChantier
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title="Liste plate"
                    >
                        <List className="w-4 h-4" />
                        Liste
                    </button>
                    <button
                        onClick={() => setGroupByChantier(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                            groupByChantier
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-slate-400 hover:text-white'
                        }`}
                        title="Grouper par chantier"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Par chantier
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredReserves.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune réserve trouvée</p>
                    </div>
                ) : groupByChantier ? (
                    /* Vue groupée par chantier */
                    <div className="space-y-6">
                        {groupedReserves.map((group) => {
                            const openCount = group.reserves.filter(r => r.statut_reserve === 'ouverte' || r.statut_reserve === 'en_cours').length;
                            return (
                                <div key={group.chantier.id} className="space-y-3">
                                    {/* En-tête du groupe */}
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
                                        <Building2 className="w-5 h-5 text-blue-400" />
                                        <Link
                                            to={`/?chantier=${group.chantier.id}`}
                                            className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                                        >
                                            {group.chantier.nom}
                                        </Link>
                                        {group.chantier.reference && (
                                            <span className="text-sm text-slate-500">{group.chantier.reference}</span>
                                        )}
                                        <span className="text-sm text-slate-400">
                                            ({group.reserves.length} réserve{group.reserves.length > 1 ? 's' : ''})
                                        </span>
                                        {openCount > 0 && (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                                                {openCount} active{openCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Réserves du groupe */}
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-700/30">
                                        {group.reserves.map((reserve) => {
                                            const config = getStatutConfig(reserve.statut_reserve);
                                            const StatusIcon = config.icon;
                                            return (
                                                <div
                                                    key={reserve.id}
                                                    className="glass-card p-3 animate-fadeIn"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                                                                    <StatusIcon className="w-3 h-3" />
                                                                    {config.label}
                                                                </span>
                                                                {reserve.localisation && (
                                                                    <span className="flex items-center gap-1 text-sm text-slate-400">
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                        {reserve.localisation}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-white text-sm mb-1">{reserve.contenu || 'Pas de description'}</p>
                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {getUserName(reserve.createur)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {formatDate(reserve.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                                <div className="flex gap-1">
                                                                    {reserve.photo_1_url && (
                                                                        <button
                                                                            onClick={() => setPhotoModal(reserve.photo_1_url)}
                                                                            className="w-10 h-10 rounded overflow-hidden border border-slate-700/50 hover:border-blue-500/50"
                                                                        >
                                                                            <img src={reserve.photo_1_url} alt="" className="w-full h-full object-cover" />
                                                                        </button>
                                                                    )}
                                                                    {reserve.photo_2_url && (
                                                                        <button
                                                                            onClick={() => setPhotoModal(reserve.photo_2_url)}
                                                                            className="w-10 h-10 rounded overflow-hidden border border-slate-700/50 hover:border-blue-500/50"
                                                                        >
                                                                            <img src={reserve.photo_2_url} alt="" className="w-full h-full object-cover" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1">
                                                                {reserve.statut_reserve === 'ouverte' && (
                                                                    <button
                                                                        onClick={() => handleTraiter(reserve.id)}
                                                                        className="p-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                                        title="Traiter"
                                                                    >
                                                                        <Clock className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {(reserve.statut_reserve === 'ouverte' || reserve.statut_reserve === 'en_cours') && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleResoudre(reserve.id)}
                                                                            className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                                            title="Lever"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejeter(reserve.id)}
                                                                            className="p-1.5 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                                                                            title="Rejeter"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Vue liste plate */
                    <div className="space-y-3">
                        {filteredReserves.map((reserve) => {
                            const config = getStatutConfig(reserve.statut_reserve);
                            const StatusIcon = config.icon;
                            return (
                                <div
                                    key={reserve.id}
                                    className="glass-card p-4 animate-fadeIn"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Info */}
                                        <div className="flex-1">
                                            {/* Header row */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {config.label}
                                                </span>
                                                {reserve.localisation && (
                                                    <span className="flex items-center gap-1 text-sm text-slate-400">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {reserve.localisation}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-white mb-2">{reserve.contenu || 'Pas de description'}</p>

                                            {/* Meta row */}
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                <Link
                                                    to={`/?chantier=${reserve.chantier?.id}`}
                                                    className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    {reserve.chantier?.nom || 'Chantier inconnu'}
                                                </Link>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {getUserName(reserve.createur)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(reserve.created_at)}
                                                </span>
                                            </div>

                                            {/* Resolution info */}
                                            {(reserve.statut_reserve === 'levee' || reserve.statut_reserve === 'rejetee') && reserve.date_resolution && (
                                                <p className="text-sm text-slate-500 mt-2">
                                                    {reserve.statut_reserve === 'levee' ? 'Résolue' : 'Rejetée'} le {formatDate(reserve.date_resolution)}
                                                    {reserve.traiteur && ` par ${getUserName(reserve.traiteur)}`}
                                                </p>
                                            )}
                                            {reserve.statut_reserve === 'en_cours' && reserve.date_traitement && (
                                                <p className="text-sm text-slate-500 mt-2">
                                                    Prise en charge le {formatDate(reserve.date_traitement)}
                                                    {reserve.traiteur && ` par ${getUserName(reserve.traiteur)}`}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: Photos + Actions */}
                                        <div className="flex items-center gap-3">
                                            {/* Photos */}
                                            {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                <div className="flex gap-2">
                                                    {reserve.photo_1_url && (
                                                        <button
                                                            onClick={() => setPhotoModal(reserve.photo_1_url)}
                                                            className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-colors"
                                                        >
                                                            <img src={reserve.photo_1_url} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    )}
                                                    {reserve.photo_2_url && (
                                                        <button
                                                            onClick={() => setPhotoModal(reserve.photo_2_url)}
                                                            className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-colors"
                                                        >
                                                            <img src={reserve.photo_2_url} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                {reserve.statut_reserve === 'ouverte' && (
                                                    <button
                                                        onClick={() => handleTraiter(reserve.id)}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        Traiter
                                                    </button>
                                                )}
                                                {(reserve.statut_reserve === 'ouverte' || reserve.statut_reserve === 'en_cours') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResoudre(reserve.id)}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Lever
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejeter(reserve.id)}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors text-sm"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Rejeter
                                                        </button>
                                                    </>
                                                )}
                                                {(reserve.statut_reserve === 'levee' || reserve.statut_reserve === 'rejetee') && (
                                                    <span className="text-xs text-slate-500">
                                                        Aucune action
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Photo Modal */}
            {photoModal && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setPhotoModal(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPhotoModal(null)}
                            className="absolute -top-10 right-0 text-white hover:text-slate-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={photoModal}
                            alt="Photo réserve"
                            className="max-w-full max-h-[90vh] rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
