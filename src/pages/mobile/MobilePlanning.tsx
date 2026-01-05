import { useState, useEffect, useMemo, useCallback } from 'react';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { ChevronLeft, ChevronRight, MapPin, Phone, Navigation, Clock } from 'lucide-react';

interface Phase {
    id: string;
    date_debut: string;
    date_fin: string;
    chantier: {
        id: string;
        nom: string;
        adresse_livraison: string;
        latitude: number | null;
        longitude: number | null;
        client: { nom: string; telephone: string | null } | null;
    } | null;
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function MobilePlanning() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const { userId } = useUserRole();

    // Calculer les dates de la semaine
    const weekDates = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }

        return { monday, sunday, days };
    }, [weekOffset]);

    // Numéro de semaine
    const weekNumber = useMemo(() => {
        const date = new Date(weekDates.monday);
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }, [weekDates]);

    // Limite: max S+2 vers le futur
    const canGoNext = weekOffset < 2;
    const canGoPrev = true; // Illimité vers le passé

    const fetchPhases = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const startDate = weekDates.monday.toISOString().split('T')[0];
            const endDate = weekDates.sunday.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('phases_chantiers')
                .select(`
                    id,
                    date_debut,
                    date_fin,
                    chantier:chantier_id(
                        id,
                        nom,
                        adresse_livraison,
                        latitude,
                        longitude,
                        client:client_id(nom, telephone)
                    )
                `)
                .eq('poseur_id', userId)
                .gte('date_debut', startDate)
                .lte('date_debut', endDate)
                .order('date_debut', { ascending: true });

            if (error) throw error;
            setPhases(data || []);
        } catch (err) {
            console.error('Erreur chargement planning:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, weekDates]);

    useEffect(() => {
        if (userId) {
            fetchPhases();
        }
    }, [userId, fetchPhases]);

    const goToPrevWeek = () => {
        if (canGoPrev) setWeekOffset((w) => w - 1);
    };

    const goToNextWeek = () => {
        if (canGoNext) setWeekOffset((w) => w + 1);
    };

    const goToCurrentWeek = () => {
        setWeekOffset(0);
    };

    // Grouper les phases par jour
    const phasesByDay = useMemo(() => {
        const grouped: Record<string, Phase[]> = {};

        weekDates.days.forEach((day) => {
            const dateKey = day.toISOString().split('T')[0];
            grouped[dateKey] = [];
        });

        phases.forEach((phase) => {
            const dateKey = phase.date_debut.split('T')[0];
            if (grouped[dateKey]) {
                grouped[dateKey].push(phase);
            }
        });

        return grouped;
    }, [phases, weekDates]);

    const formatDateHeader = (date: Date) => {
        const dayName = DAYS_FR[date.getDay()];
        const dayNum = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'short' });
        return `${dayName} ${dayNum} ${month}`;
    };

    const formatWeekLabel = () => {
        const startDay = weekDates.monday.getDate();
        const endDay = weekDates.sunday.getDate();
        const month = weekDates.monday.toLocaleDateString('fr-FR', { month: 'short' });
        return `Sem. ${weekNumber} (${startDay}-${endDay} ${month})`;
    };

    const openGPS = (lat: number | null, lng: number | null, address: string) => {
        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else if (address) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
        }
    };

    const callPhone = (phone: string | null) => {
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    return (
        <MobileLayout title="Mon Planning">
            <div className="p-4 space-y-4">
                {/* Navigation semaine */}
                <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                    <button
                        onClick={goToPrevWeek}
                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={goToCurrentWeek}
                        className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                            weekOffset === 0
                                ? 'text-blue-400'
                                : 'text-white hover:bg-slate-700/50'
                        }`}
                    >
                        {formatWeekLabel()}
                    </button>

                    <button
                        onClick={goToNextWeek}
                        disabled={!canGoNext}
                        className={`p-2 rounded-lg transition-colors ${
                            canGoNext
                                ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                                : 'text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Indicateur semaine courante */}
                {weekOffset !== 0 && (
                    <button
                        onClick={goToCurrentWeek}
                        className="w-full text-center text-sm text-blue-400 hover:text-blue-300"
                    >
                        Revenir à la semaine courante
                    </button>
                )}

                {/* Planning par jour */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {weekDates.days.map((day) => {
                            const dateKey = day.toISOString().split('T')[0];
                            const dayPhases = phasesByDay[dateKey] || [];
                            const isToday = new Date().toDateString() === day.toDateString();
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                            return (
                                <div key={dateKey}>
                                    {/* En-tête du jour */}
                                    <div
                                        className={`flex items-center gap-2 mb-2 ${
                                            isToday ? 'text-blue-400' : isWeekend ? 'text-slate-500' : 'text-slate-400'
                                        }`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full ${
                                                isToday ? 'bg-blue-400' : 'bg-slate-600'
                                            }`}
                                        />
                                        <span className="text-sm font-medium">
                                            {formatDateHeader(day)}
                                        </span>
                                        {isToday && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                Aujourd'hui
                                            </span>
                                        )}
                                    </div>

                                    {/* Phases du jour */}
                                    {dayPhases.length === 0 ? (
                                        <div className="text-sm text-slate-500 pl-4 py-2">
                                            {isWeekend ? 'Week-end' : 'Aucun chantier'}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 pl-4">
                                            {dayPhases.map((phase) => (
                                                <div
                                                    key={phase.id}
                                                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                                                >
                                                    {/* Horaires */}
                                                    <div className="flex items-center gap-1.5 text-sm text-green-400 mb-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>
                                                            {new Date(phase.date_debut).toLocaleTimeString('fr-FR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                            {' - '}
                                                            {new Date(phase.date_fin).toLocaleTimeString('fr-FR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Nom du chantier */}
                                                    <h3 className="font-semibold text-white">
                                                        {phase.chantier?.nom || 'Chantier inconnu'}
                                                    </h3>

                                                    {/* Client */}
                                                    {phase.chantier?.client?.nom && (
                                                        <p className="text-sm text-slate-400">
                                                            {phase.chantier.client.nom}
                                                        </p>
                                                    )}

                                                    {/* Adresse */}
                                                    {phase.chantier?.adresse_livraison && (
                                                        <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-400">
                                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {phase.chantier.adresse_livraison}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Actions rapides */}
                                                    <div className="flex items-center gap-2 mt-3">
                                                        {phase.chantier?.client?.telephone && (
                                                            <button
                                                                onClick={() => callPhone(phase.chantier?.client?.telephone || null)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                                Appeler
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() =>
                                                                openGPS(
                                                                    phase.chantier?.latitude || null,
                                                                    phase.chantier?.longitude || null,
                                                                    phase.chantier?.adresse_livraison || ''
                                                                )
                                                            }
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                                                        >
                                                            <Navigation className="w-4 h-4" />
                                                            GPS
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
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
