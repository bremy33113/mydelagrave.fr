import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Loader2, Clock } from 'lucide-react';

interface Phase {
    id: string;
    groupe_phase: number;
    numero_phase: number;
    libelle: string | null;
}

export function MobileRapportForm() {
    const { id: chantierId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userId } = useUserRole();

    const [phases, setPhases] = useState<Phase[]>([]);
    const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
    const [heureArrivee, setHeureArrivee] = useState('08:00');
    const [heureDepart, setHeureDepart] = useState('17:00');
    const [travaux, setTravaux] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPhases = useCallback(async () => {
        if (!chantierId || !userId) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('phases_chantiers')
                .select('id, groupe_phase, numero_phase, libelle')
                .eq('chantier_id', chantierId)
                .eq('poseur_id', userId)
                .order('groupe_phase', { ascending: true })
                .order('numero_phase', { ascending: true });

            if (fetchError) throw fetchError;
            setPhases((data as Phase[]) || []);

            // Sélectionner la première phase par défaut
            if (data && data.length > 0) {
                setSelectedPhaseId(data[0].id);
            }
        } catch (err) {
            console.error('Erreur chargement phases:', err);
        } finally {
            setLoading(false);
        }
    }, [chantierId, userId]);

    useEffect(() => {
        fetchPhases();
    }, [fetchPhases]);

    const handleSubmit = async () => {
        if (!chantierId || !userId) return;
        if (!travaux.trim()) {
            setError('Veuillez décrire les travaux effectués');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('notes_chantiers')
                .insert({
                    chantier_id: chantierId,
                    type: 'rapport',
                    contenu: travaux.trim(),
                    phase_id: selectedPhaseId || null,
                    heure_arrivee: heureArrivee,
                    heure_depart: heureDepart,
                    created_by: userId,
                    deleted_at: null
                });

            if (insertError) throw insertError;

            navigate(`/m/chantier/${chantierId}`, { replace: true });
        } catch (err) {
            console.error('Erreur création rapport:', err);
            setError('Erreur lors de la création du rapport');
        } finally {
            setSaving(false);
        }
    };

    // Calculer la durée
    const calculateDuration = () => {
        const [h1, m1] = heureArrivee.split(':').map(Number);
        const [h2, m2] = heureDepart.split(':').map(Number);
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        const diff = minutes2 - minutes1;
        if (diff <= 0) return '0h';
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    };

    if (loading) {
        return (
            <MobileLayout title="RAPPORT" showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="RAPPORT JOURNALIER" showBack>
            <div className="p-4 space-y-4">
                <MobileGlassCard className="p-4 space-y-4">
                    {/* Sélection de la phase/intervention */}
                    {phases.length > 0 && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                Intervention
                            </label>
                            <select
                                value={selectedPhaseId}
                                onChange={(e) => setSelectedPhaseId(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 appearance-none"
                            >
                                {phases.map(phase => (
                                    <option key={phase.id} value={phase.id}>
                                        {phase.groupe_phase}.{phase.numero_phase} - {phase.libelle || 'Sans libellé'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Horaires */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Horaires
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-[9px] text-slate-500 mb-1">Arrivée</label>
                                <input
                                    type="time"
                                    value={heureArrivee}
                                    onChange={(e) => setHeureArrivee(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[9px] text-slate-500 mb-1">Départ</label>
                                <input
                                    type="time"
                                    value={heureDepart}
                                    onChange={(e) => setHeureDepart(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-emerald-400">
                            <Clock size={14} />
                            <span className="text-sm font-medium">Durée: {calculateDuration()}</span>
                        </div>
                    </div>

                    {/* Description des travaux */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Travaux effectués
                        </label>
                        <textarea
                            value={travaux}
                            onChange={(e) => setTravaux(e.target.value)}
                            placeholder="Décrivez les travaux réalisés aujourd'hui..."
                            rows={5}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                        />
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl px-4 py-3 text-rose-400 text-sm">
                            {error}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Boutons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={saving}
                        className="flex-1 py-4 bg-slate-800/50 text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Envoi...
                            </>
                        ) : (
                            'Envoyer'
                        )}
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
}
