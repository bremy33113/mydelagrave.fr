import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { LogOut, Clock, FileText, User } from 'lucide-react';

interface UserProfile {
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: string;
}

interface Rapport {
    id: string;
    contenu: string | null;
    heure_arrivee: string | null;
    heure_depart: string | null;
    created_at: string;
    chantier: {
        nom: string;
    } | null;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrateur',
    superviseur: 'Superviseur',
    charge_affaire: "Chargé d'affaires",
    poseur: 'Poseur'
};

export function MobileProfilPage() {
    const navigate = useNavigate();
    const { userId } = useUserRole();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [rapports, setRapports] = useState<Rapport[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // Charger le profil
            const { data: profileData } = await supabase
                .from('users')
                .select('first_name, last_name, email, role')
                .eq('id', userId)
                .single();

            setProfile(profileData as UserProfile);

            // Charger les derniers rapports
            const { data: rapportsData } = await supabase
                .from('notes_chantiers')
                .select(`
                    id,
                    contenu,
                    heure_arrivee,
                    heure_depart,
                    created_at,
                    chantier:chantier_id(nom)
                `)
                .eq('type', 'rapport')
                .eq('created_by', userId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(10);

            setRapports((rapportsData as Rapport[]) || []);

        } catch (err) {
            console.error('Erreur chargement profil:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getInitials = () => {
        if (!profile) return '??';
        const first = profile.first_name?.charAt(0) || '';
        const last = profile.last_name?.charAt(0) || '';
        return (first + last).toUpperCase() || '??';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <MobileLayout title="PROFIL" showBottomNav>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="PROFIL" showBottomNav>
            <div className="p-4 space-y-4">
                {/* Avatar et infos */}
                <MobileGlassCard className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-black mb-4">
                        {getInitials()}
                    </div>

                    <h1 className="text-lg font-bold text-white">
                        {profile?.first_name} {profile?.last_name}
                    </h1>

                    <p className="text-sm text-slate-400 mt-1">
                        {profile?.email}
                    </p>

                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-slate-800/50 rounded-full">
                        <User size={14} className="text-sky-400" />
                        <span className="text-xs font-medium text-sky-400">
                            {profile?.role ? ROLE_LABELS[profile.role] || profile.role : 'Inconnu'}
                        </span>
                    </div>
                </MobileGlassCard>

                {/* Historique des rapports */}
                <MobileGlassCard className="p-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <FileText size={14} />
                        Historique rapports
                    </h2>

                    {rapports.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Aucun rapport envoyé
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {rapports.map(rapport => (
                                <div
                                    key={rapport.id}
                                    className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <Clock size={14} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">
                                            {rapport.chantier?.nom || 'Chantier inconnu'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {formatDate(rapport.created_at)}
                                            {rapport.heure_arrivee && rapport.heure_depart && (
                                                <> • {rapport.heure_arrivee.substring(0, 5)}-{rapport.heure_depart.substring(0, 5)}</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Bouton déconnexion */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-rose-500/20 text-rose-400 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 active:bg-rose-500/30"
                >
                    <LogOut size={20} />
                    Déconnexion
                </button>
            </div>
        </MobileLayout>
    );
}
