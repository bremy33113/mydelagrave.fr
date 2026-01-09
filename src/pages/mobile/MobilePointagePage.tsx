import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { formatLocalDate } from '../../lib/dateUtils';
import { Play, Square, Car, Wrench, Calendar, ChevronRight } from 'lucide-react';
import { MobileTimePicker } from '../../components/mobile/MobileTimePicker';
import type { Tables } from '../../lib/database.types';

type Pointage = Tables<'pointages'>;

interface Chantier {
    id: string;
    nom: string;
    reference: string | null;
}

type TimerType = 'trajet' | 'travail';

export function MobilePointagePage() {
    const navigate = useNavigate();
    const { userId } = useUserRole();

    const [chantiers, setChantiers] = useState<Chantier[]>([]);
    const [pointagesJour, setPointagesJour] = useState<Pointage[]>([]);
    const [loading, setLoading] = useState(true);

    // État du chronomètre
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerType, setTimerType] = useState<TimerType | null>(null);
    const [timerChantier, setTimerChantier] = useState<Chantier | null>(null);
    const [timerStart, setTimerStart] = useState<Date | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Sélection pour démarrer
    const [selectedChantier, setSelectedChantier] = useState<string>('');
    const [selectedType, setSelectedType] = useState<TimerType>('travail');
    const [typeTrajet, setTypeTrajet] = useState<'domicile_chantier' | 'entre_chantiers' | 'chantier_domicile'>('domicile_chantier');

    // Mode saisie : chrono ou manuel
    const [saisieMode, setSaisieMode] = useState<'chrono' | 'manuel'>('chrono');
    const [manuelPeriode, setManuelPeriode] = useState<'matin' | 'apres_midi'>('matin');
    const [manuelHeureDebut, setManuelHeureDebut] = useState('08:00');
    const [manuelHeureFin, setManuelHeureFin] = useState('12:00');
    const [savingManuel, setSavingManuel] = useState(false);

    const timerIntervalRef = useRef<number | null>(null);

    const today = new Date();
    const todayStr = formatLocalDate(today);

    const fetchData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // Charger les chantiers du poseur
            const { data: phasesData } = await supabase
                .from('phases_chantiers')
                .select('chantier:chantiers!chantier_id(id, nom, reference)')
                .eq('poseur_id', userId)
                .gte('date_fin', todayStr);

            const chantiersUniques = new Map<string, Chantier>();
            (phasesData || []).forEach((p: { chantier: Chantier | null }) => {
                if (p.chantier) {
                    chantiersUniques.set(p.chantier.id, p.chantier);
                }
            });
            const chantiersList = Array.from(chantiersUniques.values());
            setChantiers(chantiersList);

            if (chantiersList.length > 0 && !selectedChantier) {
                setSelectedChantier(chantiersList[0].id);
            }

            // Charger les pointages du jour
            const { data: pointagesData } = await supabase
                .from('pointages')
                .select('*')
                .eq('poseur_id', userId)
                .eq('date', todayStr)
                .order('created_at', { ascending: true });

            setPointagesJour((pointagesData as Pointage[]) || []);

        } catch (err) {
            console.error('Erreur chargement données:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, todayStr, selectedChantier]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Mise à jour du chronomètre
    useEffect(() => {
        if (timerRunning && timerStart) {
            timerIntervalRef.current = window.setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - timerStart.getTime()) / 1000);
                setElapsedSeconds(diff);
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [timerRunning, timerStart]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatMinutesToHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const startTimer = () => {
        if (!selectedChantier) return;

        const chantier = chantiers.find(c => c.id === selectedChantier);
        if (!chantier) return;

        setTimerChantier(chantier);
        setTimerType(selectedType);
        setTimerStart(new Date());
        setElapsedSeconds(0);
        setTimerRunning(true);
    };

    const stopTimer = async () => {
        console.log('⏱️ stopTimer called', { timerRunning, timerStart, timerChantier, timerType, userId });

        if (!timerRunning || !timerStart || !timerChantier || !timerType || !userId) {
            console.log('⏱️ stopTimer - conditions not met, returning');
            return;
        }

        const now = new Date();
        const durationMinutes = Math.round((now.getTime() - timerStart.getTime()) / 60000);

        // Déterminer la période
        const heureDebut = timerStart.getHours();
        const periode = heureDebut < 12 ? 'matin' : 'apres_midi';

        console.log('⏱️ stopTimer - inserting pointage', { durationMinutes, periode, todayStr });

        try {
            const { data, error } = await supabase.from('pointages').insert({
                poseur_id: userId,
                chantier_id: timerChantier.id,
                date: todayStr,
                periode,
                type: timerType,
                heure_debut: timerStart.toTimeString().substring(0, 5),
                heure_fin: now.toTimeString().substring(0, 5),
                duree_minutes: durationMinutes,
                mode_saisie: 'chrono',
                type_trajet: timerType === 'trajet' ? typeTrajet : null
            });

            console.log('⏱️ stopTimer - insert result', { data, error });

            // Rafraîchir les données
            await fetchData();
        } catch (err) {
            console.error('Erreur enregistrement pointage:', err);
        }

        setTimerRunning(false);
        setTimerType(null);
        setTimerChantier(null);
        setTimerStart(null);
        setElapsedSeconds(0);
    };

    // Sauvegarder pointage manuel
    const saveManuelPointage = async () => {
        if (!selectedChantier || !userId) return;

        // Calculer la durée en minutes
        const [h1, m1] = manuelHeureDebut.split(':').map(Number);
        const [h2, m2] = manuelHeureFin.split(':').map(Number);
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        const durationMinutes = minutes2 - minutes1;

        if (durationMinutes <= 0) {
            alert('L\'heure de fin doit être après l\'heure de début');
            return;
        }

        setSavingManuel(true);

        try {
            const { error } = await supabase.from('pointages').insert({
                poseur_id: userId,
                chantier_id: selectedChantier,
                date: todayStr,
                periode: manuelPeriode,
                type: selectedType,
                heure_debut: manuelHeureDebut,
                heure_fin: manuelHeureFin,
                duree_minutes: durationMinutes,
                mode_saisie: 'manuel',
                type_trajet: selectedType === 'trajet' ? typeTrajet : null
            });

            if (error) throw error;

            // Rafraîchir les données
            await fetchData();

            // Reset les champs
            if (manuelPeriode === 'matin') {
                setManuelHeureDebut('08:00');
                setManuelHeureFin('12:00');
            } else {
                setManuelHeureDebut('13:00');
                setManuelHeureFin('17:00');
            }
        } catch (err) {
            console.error('Erreur enregistrement pointage manuel:', err);
        } finally {
            setSavingManuel(false);
        }
    };

    // Calculer durée manuelle pour affichage
    const calculateManuelDuration = () => {
        const [h1, m1] = manuelHeureDebut.split(':').map(Number);
        const [h2, m2] = manuelHeureFin.split(':').map(Number);
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        const diff = minutes2 - minutes1;
        if (diff <= 0) return '0h';
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    };

    // Totaux du jour
    const totauxJour = pointagesJour.reduce(
        (acc, p) => {
            if (p.type === 'trajet') {
                acc.trajet += p.duree_minutes;
            } else {
                acc.travail += p.duree_minutes;
            }
            return acc;
        },
        { trajet: 0, travail: 0 }
    );

    const goToWeekSummary = () => {
        navigate('/m/pointage/semaine');
    };

    if (loading) {
        return (
            <MobileLayout title="POINTAGE" showBottomNav>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title="POINTAGE"
            subtitle={today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            showBottomNav
        >
            <div className="p-4 space-y-4">
                {/* Chronomètre en cours */}
                {timerRunning && timerChantier && (
                    <MobileGlassCard className="p-4 border-2 border-emerald-500/50">
                        <div className="flex items-center gap-2 mb-3">
                            {timerType === 'trajet' ? (
                                <Car size={18} className="text-amber-400" />
                            ) : (
                                <Wrench size={18} className="text-emerald-400" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {timerType === 'trajet' ? 'Trajet en cours' : 'Travail en cours'}
                            </span>
                        </div>

                        <p className="text-sm font-medium text-white mb-2">
                            {timerChantier.nom}
                        </p>

                        <p className="text-4xl font-mono font-bold text-emerald-400 text-center my-4">
                            {formatDuration(elapsedSeconds)}
                        </p>

                        <p className="text-xs text-slate-500 text-center mb-4">
                            Démarré à {timerStart?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        <button
                            onClick={stopTimer}
                            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Square size={20} fill="currentColor" />
                            Arrêter
                        </button>
                    </MobileGlassCard>
                )}

                {/* Démarrer nouveau pointage */}
                {!timerRunning && (
                    <MobileGlassCard className="p-4 space-y-4">
                        {/* Toggle Chrono/Manuel */}
                        <div className="flex bg-slate-800/60 rounded-xl p-1">
                            <button
                                onClick={() => setSaisieMode('chrono')}
                                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    saisieMode === 'chrono'
                                        ? 'bg-sky-500 text-white shadow-lg'
                                        : 'text-slate-400'
                                }`}
                            >
                                Chrono
                            </button>
                            <button
                                onClick={() => setSaisieMode('manuel')}
                                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    saisieMode === 'manuel'
                                        ? 'bg-sky-500 text-white shadow-lg'
                                        : 'text-slate-400'
                                }`}
                            >
                                Manuel
                            </button>
                        </div>

                        {/* Sélection chantier */}
                        <div>
                            <label className="block text-[9px] text-slate-500 mb-1">Chantier</label>
                            <select
                                value={selectedChantier}
                                onChange={(e) => setSelectedChantier(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                            >
                                {chantiers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom} {c.reference && `(${c.reference})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type de pointage */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedType('travail')}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all ${
                                    selectedType === 'travail'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400'
                                }`}
                            >
                                <Wrench size={16} />
                                Travail
                            </button>
                            <button
                                onClick={() => setSelectedType('trajet')}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all ${
                                    selectedType === 'trajet'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400'
                                }`}
                            >
                                <Car size={16} />
                                Trajet
                            </button>
                        </div>

                        {/* Type de trajet */}
                        {selectedType === 'trajet' && (
                            <div>
                                <label className="block text-[9px] text-slate-500 mb-1">Type de trajet</label>
                                <select
                                    value={typeTrajet}
                                    onChange={(e) => setTypeTrajet(e.target.value as typeof typeTrajet)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                                >
                                    <option value="domicile_chantier">Domicile → Chantier</option>
                                    <option value="entre_chantiers">Entre chantiers</option>
                                    <option value="chantier_domicile">Chantier → Domicile</option>
                                </select>
                            </div>
                        )}

                        {/* Mode Chrono */}
                        {saisieMode === 'chrono' && (
                            <button
                                onClick={startTimer}
                                disabled={!selectedChantier}
                                className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play size={20} fill="currentColor" />
                                Démarrer
                            </button>
                        )}

                        {/* Mode Manuel */}
                        {saisieMode === 'manuel' && (
                            <>
                                {/* Période */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setManuelPeriode('matin');
                                            setManuelHeureDebut('08:00');
                                            setManuelHeureFin('12:00');
                                        }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                            manuelPeriode === 'matin'
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-slate-800/50 text-slate-400'
                                        }`}
                                    >
                                        Matin
                                    </button>
                                    <button
                                        onClick={() => {
                                            setManuelPeriode('apres_midi');
                                            setManuelHeureDebut('13:00');
                                            setManuelHeureFin('17:00');
                                        }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                            manuelPeriode === 'apres_midi'
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-slate-800/50 text-slate-400'
                                        }`}
                                    >
                                        Après-midi
                                    </button>
                                </div>

                                {/* Horaires - Rouleaux scrollables */}
                                <div className="flex gap-3">
                                    <MobileTimePicker
                                        label="Début"
                                        value={manuelHeureDebut}
                                        onChange={setManuelHeureDebut}
                                    />
                                    <MobileTimePicker
                                        label="Fin"
                                        value={manuelHeureFin}
                                        onChange={setManuelHeureFin}
                                    />
                                </div>

                                {/* Durée calculée */}
                                <div className="text-center text-emerald-400 font-bold">
                                    Durée : {calculateManuelDuration()}
                                </div>

                                {/* Bouton enregistrer */}
                                <button
                                    onClick={saveManuelPointage}
                                    disabled={!selectedChantier || savingManuel}
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingManuel ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </>
                        )}
                    </MobileGlassCard>
                )}

                {/* Résumé du jour */}
                <MobileGlassCard className="p-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        Aujourd'hui
                    </h2>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                            <Car size={20} className="mx-auto text-amber-400 mb-1" />
                            <p className="text-lg font-bold text-amber-400">
                                {formatMinutesToHours(totauxJour.trajet)}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase">Trajet</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                            <Wrench size={20} className="mx-auto text-emerald-400 mb-1" />
                            <p className="text-lg font-bold text-emerald-400">
                                {formatMinutesToHours(totauxJour.travail)}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase">Travail</p>
                        </div>
                    </div>

                    {/* Liste des pointages */}
                    {pointagesJour.length > 0 && (
                        <div className="space-y-2">
                            {pointagesJour.map(p => {
                                const chantier = chantiers.find(c => c.id === p.chantier_id);
                                return (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0"
                                    >
                                        {p.type === 'trajet' ? (
                                            <Car size={14} className="text-amber-400" />
                                        ) : (
                                            <Wrench size={14} className="text-emerald-400" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate">
                                                {chantier?.nom || 'Chantier inconnu'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {p.heure_debut} - {p.heure_fin}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">
                                            {formatMinutesToHours(p.duree_minutes)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Lien vers récap semaine */}
                <button
                    onClick={goToWeekSummary}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl text-slate-400 active:bg-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={20} />
                        <span className="text-sm font-medium">Récapitulatif de la semaine</span>
                    </div>
                    <ChevronRight size={20} />
                </button>
            </div>
        </MobileLayout>
    );
}
