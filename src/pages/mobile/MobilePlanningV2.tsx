import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { MobileStatusBadge, getCategoryGradient, getCategoryIcon } from '../../components/mobile/MobileStatusBadge';
import { MobilePlanningMap } from '../../components/mobile/MobilePlanningMap';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { formatLocalDate } from '../../lib/dateUtils';
import { ChevronLeft, ChevronRight, MapPin, List, Map, Clock, AlertTriangle } from 'lucide-react';

interface PhaseWithChantier {
    id: string;
    groupe_phase: number;
    numero_phase: number;
    libelle: string | null;
    date_debut: string;
    date_fin: string;
    heure_debut: string;
    heure_fin: string;
    duree_heures: number;
    chantier: {
        id: string;
        nom: string;
        reference: string | null;
        adresse_livraison: string | null;
        adresse_livraison_latitude: number | null;
        adresse_livraison_longitude: number | null;
        statut: string;
        categorie: string | null;
        client: { nom: string; telephone: string | null } | null;
    } | null;
}

interface Reserve {
    id: string;
    chantier_id: string;
    statut_reserve: string;
}

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

type ViewMode = 'jour' | 'semaine';
type DisplayMode = 'liste' | 'carte';

export function MobilePlanningV2() {
    const navigate = useNavigate();
    const [phases, setPhases] = useState<PhaseWithChantier[]>([]);
    const [reserves, setReserves] = useState<Reserve[]>([]);
    const [loading, setLoading] = useState(true);
    const [dayOffset, setDayOffset] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>('jour');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('liste');
    const { userId } = useUserRole();

    // Date sélectionnée
    const selectedDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setHours(0, 0, 0, 0);
        return date;
    }, [dayOffset]);

    // Dates de la semaine
    const weekDates = useMemo(() => {
        const dayOfWeek = selectedDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() + mondayOffset);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }

        return days;
    }, [selectedDate]);

    // Numéro de semaine
    const weekNumber = useMemo(() => {
        const date = new Date(weekDates[0]);
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }, [weekDates]);

    // Limite navigation: max S+2
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21); // 3 semaines
    const canGoNext = selectedDate < maxDate;

    const fetchPhases = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            let startDate: string;
            let endDate: string;

            if (viewMode === 'jour') {
                startDate = formatLocalDate(selectedDate);
                endDate = startDate;
            } else {
                startDate = formatLocalDate(weekDates[0]);
                endDate = formatLocalDate(weekDates[6]);
            }

            console.log('📱 MobilePlanningV2 - Fetching phases:', { userId, startDate, endDate, viewMode });

            const { data, error } = await supabase
                .from('phases_chantiers')
                .select(`
                    id,
                    groupe_phase,
                    numero_phase,
                    libelle,
                    date_debut,
                    date_fin,
                    heure_debut,
                    heure_fin,
                    duree_heures,
                    chantier_id,
                    chantier:chantiers!chantier_id(
                        id,
                        nom,
                        reference,
                        adresse_livraison,
                        adresse_livraison_latitude,
                        adresse_livraison_longitude,
                        statut,
                        categorie,
                        client:clients!client_id(nom, telephone)
                    )
                `)
                .eq('poseur_id', userId)
                .gte('date_debut', startDate)
                .lte('date_debut', endDate)
                .order('date_debut', { ascending: true });

            console.log('📱 MobilePlanningV2 - Query result:', { data, error });

            if (error) throw error;
            setPhases((data as PhaseWithChantier[]) || []);

            // Charger les réserves ouvertes pour les chantiers
            const chantierIds = [...new Set((data || []).map((p: PhaseWithChantier) => p.chantier?.id).filter(Boolean))];
            if (chantierIds.length > 0) {
                const { data: reservesData } = await supabase
                    .from('notes_chantiers')
                    .select('id, chantier_id, statut_reserve')
                    .eq('type', 'reserve')
                    .eq('statut_reserve', 'ouverte')
                    .in('chantier_id', chantierIds)
                    .is('deleted_at', null);

                setReserves((reservesData as Reserve[]) || []);
            }
        } catch (err) {
            console.error('Erreur chargement planning:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, selectedDate, weekDates, viewMode]);

    useEffect(() => {
        if (userId) {
            fetchPhases();
        }
    }, [userId, fetchPhases]);

    // Navigation
    const goToPrev = () => {
        if (viewMode === 'jour') {
            setDayOffset(d => d - 1);
        } else {
            setDayOffset(d => d - 7);
        }
    };

    const goToNext = () => {
        if (!canGoNext) return;
        if (viewMode === 'jour') {
            setDayOffset(d => d + 1);
        } else {
            setDayOffset(d => d + 7);
        }
    };

    const goToToday = () => setDayOffset(0);

    // Grouper par jour pour vue semaine
    const phasesByDay = useMemo(() => {
        const grouped: Record<string, PhaseWithChantier[]> = {};
        weekDates.forEach(day => {
            grouped[formatLocalDate(day)] = [];
        });
        phases.forEach(phase => {
            const dateKey = phase.date_debut.split('T')[0];
            if (grouped[dateKey]) {
                grouped[dateKey].push(phase);
            }
        });
        return grouped;
    }, [phases, weekDates]);

    // Compter réserves par chantier
    const getReservesCount = (chantierId: string) => {
        return reserves.filter(r => r.chantier_id === chantierId).length;
    };

    // Formatage
    const formatDateNav = () => {
        if (viewMode === 'jour') {
            return selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
        const start = weekDates[0].getDate();
        const end = weekDates[6].getDate();
        const month = weekDates[0].toLocaleDateString('fr-FR', { month: 'short' });
        return `Semaine ${weekNumber} (${start}-${end} ${month})`;
    };

    const formatTime = (time: string) => time.substring(0, 5);

    const openChantierDetail = (chantierId: string) => {
        navigate(`/m/chantier/${chantierId}`);
    };

    // Rendu d'une carte intervention
    const renderPhaseCard = (phase: PhaseWithChantier) => {
        console.log('📱 renderPhaseCard - phase:', phase);
        const chantier = phase.chantier;
        if (!chantier) {
            console.log('📱 renderPhaseCard - chantier is null!');
            return null;
        }

        const reservesCount = getReservesCount(chantier.id);

        return (
            <MobileGlassCard
                key={phase.id}
                className="p-4"
                onClick={() => openChantierDetail(chantier.id)}
            >
                {/* Header: Statut + Horaires */}
                <div className="flex items-center justify-between mb-3">
                    <MobileStatusBadge status={chantier.statut} />
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                        <Clock size={12} />
                        <span>{formatTime(phase.heure_debut)}-{formatTime(phase.heure_fin)}</span>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="flex gap-3">
                    {/* Icône catégorie */}
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                        style={{ background: getCategoryGradient(chantier.categorie) }}
                    >
                        {getCategoryIcon(chantier.categorie)}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Nom chantier */}
                        <h3 className="font-bold text-white text-sm truncate">
                            {chantier.nom}
                        </h3>

                        {/* Client */}
                        {chantier.client?.nom && (
                            <p className="text-xs text-slate-400 truncate">
                                {chantier.client.nom}
                            </p>
                        )}

                        {/* Adresse */}
                        {chantier.adresse_livraison && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                <MapPin size={10} />
                                <span className="truncate">{chantier.adresse_livraison.split(',')[0]}</span>
                            </div>
                        )}
                    </div>

                    {/* Indicateurs */}
                    <div className="flex flex-col items-end gap-1">
                        {/* Phase */}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                            {phase.groupe_phase}.{phase.numero_phase}
                        </span>

                        {/* Badge réserves */}
                        {reservesCount > 0 && (
                            <div className="flex items-center gap-1 text-rose-400">
                                <AlertTriangle size={12} />
                                <span className="text-[10px] font-bold">{reservesCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Libellé phase + Référence */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide truncate">
                        {phase.libelle || `Phase ${phase.groupe_phase}.${phase.numero_phase}`}
                    </span>
                    {chantier.reference && (
                        <span className="text-[10px] text-slate-500 font-mono">
                            {chantier.reference}
                        </span>
                    )}
                </div>
            </MobileGlassCard>
        );
    };

    return (
        <MobileLayout
            title="PLANNING"
            subtitle={formatDateNav()}
            showBottomNav
        >
            <div className="p-4 space-y-4">
                {/* Toggles Vue */}
                <div className="flex gap-2">
                    {/* Toggle Jour/Semaine */}
                    <div className="flex bg-slate-800/60 rounded-xl p-1 flex-1">
                        <button
                            onClick={() => setViewMode('jour')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'jour'
                                    ? 'bg-sky-500 text-white shadow-lg'
                                    : 'text-slate-400'
                            }`}
                        >
                            Jour
                        </button>
                        <button
                            onClick={() => setViewMode('semaine')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'semaine'
                                    ? 'bg-sky-500 text-white shadow-lg'
                                    : 'text-slate-400'
                            }`}
                        >
                            Semaine
                        </button>
                    </div>

                    {/* Toggle Liste/Carte */}
                    <div className="flex bg-slate-800/60 rounded-xl p-1">
                        <button
                            onClick={() => setDisplayMode('liste')}
                            className={`p-2 rounded-lg transition-all ${
                                displayMode === 'liste'
                                    ? 'bg-sky-500 text-white'
                                    : 'text-slate-400'
                            }`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setDisplayMode('carte')}
                            className={`p-2 rounded-lg transition-all ${
                                displayMode === 'carte'
                                    ? 'bg-sky-500 text-white'
                                    : 'text-slate-400'
                            }`}
                        >
                            <Map size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation Date */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={goToPrev}
                        className="p-2 rounded-xl bg-slate-800/50 text-slate-400 active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        onClick={goToToday}
                        className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                            dayOffset === 0
                                ? 'text-sky-400 bg-sky-500/10'
                                : 'text-white bg-slate-800/50 active:scale-95'
                        }`}
                    >
                        {viewMode === 'jour'
                            ? selectedDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                            : `S${weekNumber}`
                        }
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={!canGoNext}
                        className={`p-2 rounded-xl transition-all ${
                            canGoNext
                                ? 'bg-slate-800/50 text-slate-400 active:scale-95'
                                : 'bg-slate-900/50 text-slate-700 cursor-not-allowed'
                        }`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Contenu */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayMode === 'carte' ? (
                    // Vue Carte
                    <MobilePlanningMap
                        phases={viewMode === 'jour' ? phases : Object.values(phasesByDay).flat()}
                        onChantierClick={openChantierDetail}
                    />
                ) : viewMode === 'jour' ? (
                    // Vue Jour
                    <div className="space-y-3">
                        {phases.length === 0 ? (
                            <MobileGlassCard className="p-8 text-center">
                                <p className="text-slate-400 text-sm">Aucune intervention ce jour</p>
                            </MobileGlassCard>
                        ) : (
                            <>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {phases.length} intervention{phases.length > 1 ? 's' : ''}
                                </p>
                                {phases.map(renderPhaseCard)}
                            </>
                        )}
                    </div>
                ) : (
                    // Vue Semaine
                    <div className="space-y-4">
                        {weekDates.map(day => {
                            const dateKey = formatLocalDate(day);
                            const dayPhases = phasesByDay[dateKey] || [];
                            const isToday = day.toDateString() === today.toDateString();
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                            return (
                                <div key={dateKey}>
                                    {/* En-tête jour */}
                                    <div className={`flex items-center gap-2 mb-2 ${
                                        isToday ? 'text-sky-400' : isWeekend ? 'text-slate-600' : 'text-slate-400'
                                    }`}>
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                            isToday ? 'bg-sky-500 text-white' : 'bg-slate-800/50'
                                        }`}>
                                            {day.getDate()}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {DAYS_SHORT[day.getDay()]}
                                        </span>
                                        {isToday && (
                                            <span className="text-[9px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                                Aujourd'hui
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-600 ml-auto">
                                            {dayPhases.length > 0 && `${dayPhases.length} interv.`}
                                        </span>
                                    </div>

                                    {/* Phases du jour */}
                                    {dayPhases.length === 0 ? (
                                        <p className="text-xs text-slate-600 pl-10 py-1">
                                            {isWeekend ? 'Week-end' : '-'}
                                        </p>
                                    ) : (
                                        <div className="space-y-2 pl-10">
                                            {dayPhases.map(renderPhaseCard)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
