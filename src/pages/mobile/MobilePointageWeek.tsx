import { useState, useEffect, useCallback, useMemo } from 'react';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { ChevronLeft, ChevronRight, Car, Wrench, FileDown, Check } from 'lucide-react';
import type { Tables } from '../../lib/database.types';

type Pointage = Tables<'pointages'>;

interface Chantier {
    id: string;
    nom: string;
    reference: string | null;
}

interface User {
    first_name: string | null;
    last_name: string | null;
}

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Helper pour formater date locale (YYYY-MM-DD) sans problème de fuseau horaire
const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function MobilePointageWeek() {
    const { userId } = useUserRole();

    const [pointages, setPointages] = useState<Pointage[]>([]);
    const [chantiers, setChantiers] = useState<Map<string, Chantier>>(new Map());
    const [user, setUser] = useState<User | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Calculer les dates de la semaine
    const weekDates = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }

        return days;
    }, [weekOffset]);

    const weekNumber = useMemo(() => {
        const date = weekDates[0];
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }, [weekDates]);

    const fetchData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const startDate = formatLocalDate(weekDates[0]);
            const endDate = formatLocalDate(weekDates[6]);

            console.log('📅 MobilePointageWeek - weekDates:', weekDates.map(d => formatLocalDate(d)));
            console.log('📅 MobilePointageWeek - fetching:', { startDate, endDate });

            // Charger les pointages de la semaine
            const { data: pointagesData } = await supabase
                .from('pointages')
                .select('*')
                .eq('poseur_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })
                .order('created_at', { ascending: true });

            console.log('📅 MobilePointageWeek - pointages loaded:', pointagesData);
            setPointages((pointagesData as Pointage[]) || []);

            // Charger les chantiers associés
            const chantierIds = [...new Set((pointagesData || []).map(p => p.chantier_id))];
            if (chantierIds.length > 0) {
                const { data: chantiersData } = await supabase
                    .from('chantiers')
                    .select('id, nom, reference')
                    .in('id', chantierIds);

                const chantiersMap = new Map<string, Chantier>();
                (chantiersData || []).forEach((c: Chantier) => {
                    chantiersMap.set(c.id, c);
                });
                setChantiers(chantiersMap);
            }

            // Charger l'utilisateur
            const { data: userData } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('id', userId)
                .single();

            setUser(userData as User);

        } catch (err) {
            console.error('Erreur chargement données:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, weekDates]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Grouper par jour
    const pointagesByDay = useMemo(() => {
        const grouped: Record<string, Pointage[]> = {};
        weekDates.forEach(day => {
            grouped[formatLocalDate(day)] = [];
        });
        pointages.forEach(p => {
            if (grouped[p.date]) {
                grouped[p.date].push(p);
            }
        });
        return grouped;
    }, [pointages, weekDates]);

    // Totaux par jour et semaine
    const totaux = useMemo(() => {
        const result: Record<string, { trajet: number; travail: number }> = {};
        let totalTrajet = 0;
        let totalTravail = 0;

        weekDates.forEach(day => {
            const dateKey = formatLocalDate(day);
            const dayPointages = pointagesByDay[dateKey] || [];

            const dayTotals = dayPointages.reduce(
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

            result[dateKey] = dayTotals;
            totalTrajet += dayTotals.trajet;
            totalTravail += dayTotals.travail;
        });

        return { byDay: result, totalTrajet, totalTravail };
    }, [weekDates, pointagesByDay]);

    const formatMinutes = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const formatMinutesShort = (minutes: number) => {
        if (minutes === 0) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const generatePDF = async () => {
        setGenerating(true);

        try {
            // Import dynamique de jsPDF et autoTable
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default;
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = autoTableModule.default;

            const doc = new jsPDF();

            // Header
            doc.setFontSize(16);
            doc.text('DELAGRAVE - Feuille de Pointage', 14, 20);

            doc.setFontSize(10);
            const initiales = user
                ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
                : 'XX';
            const nomComplet = user
                ? `${user.first_name || ''} ${user.last_name || ''}`
                : 'Inconnu';

            doc.text(`Nom: ${nomComplet}`, 14, 30);
            doc.text(
                `Semaine ${weekNumber} - Du ${weekDates[0].toLocaleDateString('fr-FR')} au ${weekDates[6].toLocaleDateString('fr-FR')}`,
                14,
                36
            );

            // Tableau des pointages
            const tableData: (string | number)[][] = [];

            console.log('📄 PDF - pointagesByDay:', pointagesByDay);
            console.log('📄 PDF - chantiers Map:', Array.from(chantiers.entries()));

            weekDates.slice(0, 5).forEach((day, index) => {
                const dateKey = formatLocalDate(day);
                const dayPointages = pointagesByDay[dateKey] || [];

                console.log(`📄 PDF - ${DAYS_FR[index]} (${dateKey}):`, dayPointages.length, 'pointages');

                const trajetMatin = dayPointages.filter(p => p.type === 'trajet' && p.periode === 'matin');
                const travailMatin = dayPointages.filter(p => p.type === 'travail' && p.periode === 'matin');
                const trajetAM = dayPointages.filter(p => p.type === 'trajet' && p.periode === 'apres_midi');
                const travailAM = dayPointages.filter(p => p.type === 'travail' && p.periode === 'apres_midi');

                console.log(`📄 PDF - ${DAYS_FR[index]} details:`, {
                    trajetMatin: trajetMatin.length,
                    travailMatin: travailMatin.length,
                    trajetAM: trajetAM.length,
                    travailAM: travailAM.length,
                    dayPointagesTypes: dayPointages.map(p => ({ type: p.type, periode: p.periode, chantier_id: p.chantier_id }))
                });

                const dayTotal = totaux.byDay[dateKey];

                // Ligne trajet
                tableData.push([
                    DAYS_FR[index],
                    'Trajet',
                    trajetMatin.length > 0 ? chantiers.get(trajetMatin[0].chantier_id)?.reference || '' : '',
                    formatMinutesShort(trajetMatin.reduce((s, p) => s + p.duree_minutes, 0)),
                    trajetAM.length > 0 ? chantiers.get(trajetAM[0].chantier_id)?.reference || '' : '',
                    formatMinutesShort(trajetAM.reduce((s, p) => s + p.duree_minutes, 0)),
                    ''
                ]);

                // Ligne travail
                tableData.push([
                    '',
                    'Travail',
                    travailMatin.length > 0 ? chantiers.get(travailMatin[0].chantier_id)?.reference || '' : '',
                    formatMinutesShort(travailMatin.reduce((s, p) => s + p.duree_minutes, 0)),
                    travailAM.length > 0 ? chantiers.get(travailAM[0].chantier_id)?.reference || '' : '',
                    formatMinutesShort(travailAM.reduce((s, p) => s + p.duree_minutes, 0)),
                    formatMinutes(dayTotal.trajet + dayTotal.travail)
                ]);
            });

            // Générer le tableau
            autoTable(doc, {
                startY: 45,
                head: [['Jour', 'Type', 'Réf. Matin', 'Durée', 'Réf. AM', 'Durée', 'Total']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] }
            });

            // Totaux - récupérer la position finale via le document
            // @ts-expect-error - lastAutoTable ajouté par autoTable
            const finalY = (doc.lastAutoTable?.finalY || 150) + 10;
            doc.setFontSize(10);
            doc.text(`Total Trajet: ${formatMinutes(totaux.totalTrajet)}`, 14, finalY);
            doc.text(`Total Travail: ${formatMinutes(totaux.totalTravail)}`, 14, finalY + 6);
            doc.setFontSize(12);
            doc.text(
                `TOTAL SEMAINE: ${formatMinutes(totaux.totalTrajet + totaux.totalTravail)}`,
                14,
                finalY + 14
            );

            // Footer
            doc.setFontSize(8);
            doc.text(
                `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
                14,
                280
            );

            // Sauvegarder
            const filename = `${weekDates[0].getFullYear()}-SEM${weekNumber.toString().padStart(2, '0')}-${initiales}.pdf`;
            doc.save(filename);

        } catch (err) {
            console.error('Erreur génération PDF:', err);
            alert('Erreur lors de la génération du PDF. Assurez-vous que jspdf est installé.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <MobileLayout title="RÉCAP SEMAINE" showBack showBottomNav>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title="RÉCAP SEMAINE"
            subtitle={`S${weekNumber} - ${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
            showBack
            showBottomNav
        >
            <div className="p-4 space-y-4">
                {/* Navigation semaine */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setWeekOffset(w => w - 1)}
                        className="p-2 rounded-xl bg-slate-800/50 text-slate-400 active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        onClick={() => setWeekOffset(0)}
                        className={`text-sm font-bold px-4 py-2 rounded-xl ${
                            weekOffset === 0 ? 'text-sky-400 bg-sky-500/10' : 'text-white bg-slate-800/50'
                        }`}
                    >
                        Semaine {weekNumber}
                    </button>

                    <button
                        onClick={() => setWeekOffset(w => w + 1)}
                        disabled={weekOffset >= 0}
                        className={`p-2 rounded-xl ${
                            weekOffset >= 0
                                ? 'bg-slate-900/50 text-slate-700 cursor-not-allowed'
                                : 'bg-slate-800/50 text-slate-400 active:scale-95'
                        }`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Résumé par jour */}
                <div className="space-y-2">
                    {weekDates.map((day, index) => {
                        const dateKey = formatLocalDate(day);
                        const dayTotals = totaux.byDay[dateKey];
                        const dayPointages = pointagesByDay[dateKey] || [];
                        const isToday = day.toDateString() === new Date().toDateString();
                        const hasData = dayPointages.length > 0;

                        return (
                            <MobileGlassCard
                                key={dateKey}
                                className={`p-3 ${isToday ? 'border border-sky-500/50' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                            isToday ? 'bg-sky-500 text-white' : 'bg-slate-800/50 text-slate-400'
                                        }`}>
                                            {day.getDate()}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase">
                                                {DAYS_FR[index]}
                                            </p>
                                            {hasData && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                                                        <Car size={10} />
                                                        {formatMinutesShort(dayTotals.trajet)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                                        <Wrench size={10} />
                                                        {formatMinutesShort(dayTotals.travail)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {hasData ? (
                                            <>
                                                <span className="text-sm font-bold text-white">
                                                    {formatMinutes(dayTotals.trajet + dayTotals.travail)}
                                                </span>
                                                <Check size={16} className="text-emerald-400" />
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-600">-</span>
                                        )}
                                    </div>
                                </div>
                            </MobileGlassCard>
                        );
                    })}
                </div>

                {/* Totaux semaine */}
                <MobileGlassCard className="p-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        Totaux semaine
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                            <Car size={20} className="mx-auto text-amber-400 mb-1" />
                            <p className="text-xl font-bold text-amber-400">
                                {formatMinutes(totaux.totalTrajet)}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase">Trajet</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                            <Wrench size={20} className="mx-auto text-emerald-400 mb-1" />
                            <p className="text-xl font-bold text-emerald-400">
                                {formatMinutes(totaux.totalTravail)}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase">Travail</p>
                        </div>
                    </div>

                    <div className="bg-sky-500/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-sky-400">
                            {formatMinutes(totaux.totalTrajet + totaux.totalTravail)}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Total semaine</p>
                    </div>
                </MobileGlassCard>

                {/* Bouton génération PDF */}
                <button
                    onClick={generatePDF}
                    disabled={generating || pointages.length === 0}
                    className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Génération...
                        </>
                    ) : (
                        <>
                            <FileDown size={20} />
                            Générer PDF
                        </>
                    )}
                </button>
            </div>
        </MobileLayout>
    );
}
