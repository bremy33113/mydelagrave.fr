import { useState, useEffect, useCallback, useMemo } from 'react';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { formatLocalDate } from '../../lib/dateUtils';
import {
    ChevronLeft,
    ChevronRight,
    Car,
    Wrench,
    Plus,
    X,
    Check,
    Clock,
    Pencil,
    Trash2,
    FileText,
    Send,
    Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tables } from '../../lib/database.types';

type Pointage = Tables<'pointages'>;

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
    } | null;
}

interface PhaseDay {
    phase: PhaseWithChantier;
    date: string;
    dayLabel: string;
    heureDebut: string;
    heureFin: string;
    pointages: Pointage[];
    totalPointage: number;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function MobileFeuillePointage() {
    const { userId } = useUserRole();

    const [phaseDays, setPhaseDays] = useState<PhaseDay[]>([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [loading, setLoading] = useState(true);

    // Modal pointage
    const [pointageModalOpen, setPointageModalOpen] = useState(false);
    const [selectedPhaseDay, setSelectedPhaseDay] = useState<PhaseDay | null>(null);
    const [editingPointage, setEditingPointage] = useState<Pointage | null>(null);
    const [pointageType, setPointageType] = useState<'travail' | 'trajet'>('travail');
    const [pointageDuree, setPointageDuree] = useState('04:00');
    const [pointagePeriode, setPointagePeriode] = useState<'matin' | 'apres_midi'>('matin');
    const [pointageSaving, setPointageSaving] = useState(false);
    const [pointageSuccess, setPointageSuccess] = useState(false);
    const [rapportOpen, setRapportOpen] = useState(false);
    const [savingRapport, setSavingRapport] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Calculer les dates de la semaine (Lun-Ven)
    const weekDates = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);

        const days: Date[] = [];
        for (let i = 0; i < 5; i++) {
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

    // Obtenir les jours entre deux dates
    const getDaysBetween = (start: string, end: string, weekStart: string, weekEnd: string): string[] => {
        const days: string[] = [];
        const startDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        const weekStartDate = new Date(weekStart + 'T00:00:00');
        const weekEndDate = new Date(weekEnd + 'T00:00:00');

        const current = new Date(Math.max(startDate.getTime(), weekStartDate.getTime()));
        const last = new Date(Math.min(endDate.getTime(), weekEndDate.getTime()));

        while (current <= last) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lun-Ven
                days.push(formatLocalDate(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    // Calculer les heures pour un jour donné d'une phase multi-jours
    const getHoursForDay = (phase: PhaseWithChantier, dayStr: string): { start: string; end: string } => {
        const phaseStart = phase.date_debut.split('T')[0];
        const phaseEnd = phase.date_fin.split('T')[0];
        const isSingleDay = phaseStart === phaseEnd;
        const isFirstDay = dayStr === phaseStart;
        const isLastDay = dayStr === phaseEnd;

        if (isSingleDay) {
            return { start: phase.heure_debut, end: phase.heure_fin };
        }
        if (isFirstDay) {
            return { start: phase.heure_debut, end: '17:00' };
        }
        if (isLastDay) {
            return { start: '08:00', end: phase.heure_fin };
        }
        return { start: '08:00', end: '17:00' };
    };

    const fetchData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const startDate = formatLocalDate(weekDates[0]);
            const endDate = formatLocalDate(weekDates[4]);

            // Charger les phases (même requête que MobilePlanningV2)
            const { data: phasesData } = await supabase
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
                    chantier:chantiers!chantier_id(id, nom, reference, adresse_livraison)
                `)
                .eq('poseur_id', userId)
                .lte('date_debut', endDate)
                .gte('date_fin', startDate)
                .order('date_debut', { ascending: true });

            const phases = (phasesData as PhaseWithChantier[]) || [];

            // Charger les pointages de la semaine
            const { data: pointagesData } = await supabase
                .from('pointages')
                .select('*')
                .eq('poseur_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            const pointages = (pointagesData as Pointage[]) || [];

            // Créer les entrées par jour (comme dans le planning)
            const result: PhaseDay[] = [];

            phases.forEach(phase => {
                if (!phase.chantier) return;

                const days = getDaysBetween(
                    phase.date_debut.split('T')[0],
                    phase.date_fin.split('T')[0],
                    startDate,
                    endDate
                );

                days.forEach(dayStr => {
                    const dateObj = new Date(dayStr + 'T00:00:00');
                    const dayLabel = `${DAYS_FR[dateObj.getDay()]} ${dateObj.getDate()}`;
                    const hours = getHoursForDay(phase, dayStr);

                    // Pointages pour ce chantier ce jour
                    const dayPointages = pointages.filter(
                        p => p.chantier_id === phase.chantier!.id && p.date === dayStr
                    );
                    const totalPointage = dayPointages.reduce((sum, p) => sum + p.duree_minutes, 0);

                    result.push({
                        phase,
                        date: dayStr,
                        dayLabel,
                        heureDebut: hours.start,
                        heureFin: hours.end,
                        pointages: dayPointages,
                        totalPointage
                    });
                });
            });

            // Trier par date puis par heure
            result.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.heureDebut.localeCompare(b.heureDebut);
            });

            setPhaseDays(result);

        } catch (err) {
            console.error('Erreur chargement données:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, weekDates]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatMinutes = (minutes: number) => {
        if (minutes === 0) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const parseDuration = (duree: string): number => {
        const [h, m] = duree.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    // Convertir minutes en format hh:mm
    const minutesToTime = (minutes: number): string => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const openPointageModal = (phaseDay: PhaseDay, pointageToEdit?: Pointage) => {
        setSelectedPhaseDay(phaseDay);
        setEditingPointage(pointageToEdit || null);

        if (pointageToEdit) {
            // Mode édition
            setPointageType(pointageToEdit.type as 'travail' | 'trajet');
            setPointageDuree(minutesToTime(pointageToEdit.duree_minutes));
            setPointagePeriode(pointageToEdit.periode as 'matin' | 'apres_midi');
        } else {
            // Mode création
            setPointageType('travail');
            setPointageDuree('04:00');
            const hour = parseInt(phaseDay.heureDebut.split(':')[0], 10);
            setPointagePeriode(hour < 12 ? 'matin' : 'apres_midi');
        }

        setPointageSuccess(false);
        setPointageModalOpen(true);
    };

    const savePointage = async () => {
        if (!userId || !selectedPhaseDay) return;

        const duration = parseDuration(pointageDuree);
        if (duration <= 0) {
            alert('La durée doit être supérieure à 0');
            return;
        }

        setPointageSaving(true);
        try {
            const heureDebut = pointagePeriode === 'matin' ? '08:00' : '13:00';
            const totalMinutes = (pointagePeriode === 'matin' ? 8 * 60 : 13 * 60) + duration;
            const heureFin = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

            if (editingPointage) {
                // Mode édition
                const { error } = await supabase.from('pointages')
                    .update({
                        periode: pointagePeriode,
                        type: pointageType,
                        heure_debut: heureDebut,
                        heure_fin: heureFin,
                        duree_minutes: duration
                    })
                    .eq('id', editingPointage.id);

                if (error) throw error;
            } else {
                // Mode création
                const { error } = await supabase.from('pointages').insert({
                    poseur_id: userId,
                    chantier_id: selectedPhaseDay.phase.chantier!.id,
                    date: selectedPhaseDay.date,
                    periode: pointagePeriode,
                    type: pointageType,
                    heure_debut: heureDebut,
                    heure_fin: heureFin,
                    duree_minutes: duration,
                    mode_saisie: 'manuel',
                    type_trajet: null
                });

                if (error) throw error;
            }

            setPointageSuccess(true);
            setTimeout(() => {
                setPointageModalOpen(false);
                setPointageSuccess(false);
                setEditingPointage(null);
                fetchData();
            }, 1000);
        } catch (err) {
            console.error('Erreur pointage:', err);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setPointageSaving(false);
        }
    };

    const deletePointage = async (pointageId: string) => {
        if (!confirm('Supprimer ce pointage ?')) return;

        try {
            const { error } = await supabase
                .from('pointages')
                .delete()
                .eq('id', pointageId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error('Erreur suppression:', err);
            alert('Erreur lors de la suppression');
        }
    };

    // Enregistrer le rapport dans les documents des chantiers
    const saveRapportToDocuments = async () => {
        if (savingRapport) return;
        setSavingRapport(true);

        try {
            // Récupérer le nom de l'utilisateur pour le PDF
            let userNom = '';
            let userPrenom = '';

            if (userId) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('id', userId)
                    .single();

                if (userData) {
                    userNom = userData.last_name || '';
                    userPrenom = userData.first_name || '';
                }
            }

            // Générer le PDF en base64
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();

            // En-tête DELAGRAVE
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('DELAGRAVE', 14, 15);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('350 rue Bilingue', 14, 20);
            doc.text('27610 Romilly sur Andelle', 14, 24);
            doc.text('Tél : 02.32.49.74.02', 14, 28);

            // Titre centré
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Feuille de Pointage', pageWidth / 2, 20, { align: 'center' });

            // Période
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const dateDebut = weekDates[0].toLocaleDateString('fr-FR');
            const dateFin = weekDates[4].toLocaleDateString('fr-FR');
            doc.text(`Semaine du ${dateDebut} au ${dateFin}`, pageWidth / 2, 28, { align: 'center' });

            // Nom et Prénom employé
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Nom', pageWidth - 70, 15);
            doc.text('Prénom', pageWidth - 70, 22);
            doc.setFont('helvetica', 'normal');
            doc.text(userNom.toUpperCase(), pageWidth - 45, 15);
            doc.text(userPrenom.toUpperCase(), pageWidth - 45, 22);

            // Préparer les données du tableau
            const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            const tableData: (string | number)[][] = [];

            days.forEach((dayName, index) => {
                const dateIdx = index < 5 ? index : -1;
                const dateStr = dateIdx >= 0 ? formatLocalDate(weekDates[dateIdx]) : null;
                const dayPhases = dateStr ? (phasesByDay[dateStr] || []) : [];

                let trajetMatin = 0, travailMatin = 0, trajetPM = 0, travailPM = 0;
                let chantierMatin = '', chantierPM = '';
                let nomMatin = '', nomPM = '';

                dayPhases.forEach(pd => {
                    pd.pointages.forEach(p => {
                        if (p.periode === 'matin') {
                            if (p.type === 'trajet') trajetMatin += p.duree_minutes;
                            else travailMatin += p.duree_minutes;
                            if (!chantierMatin && pd.phase.chantier?.reference) {
                                chantierMatin = pd.phase.chantier.reference;
                                nomMatin = pd.phase.chantier.nom || '';
                            }
                        } else {
                            if (p.type === 'trajet') trajetPM += p.duree_minutes;
                            else travailPM += p.duree_minutes;
                            if (!chantierPM && pd.phase.chantier?.reference) {
                                chantierPM = pd.phase.chantier.reference;
                                nomPM = pd.phase.chantier.nom || '';
                            }
                        }
                    });
                });

                const totalTrajetJour = trajetMatin + trajetPM;
                const totalTravailJour = travailMatin + travailPM;

                tableData.push([
                    dayName, 'Trajet', chantierMatin, nomMatin.substring(0, 25),
                    trajetMatin > 0 ? formatMinutes(trajetMatin) : '',
                    chantierPM, nomPM.substring(0, 25),
                    trajetPM > 0 ? formatMinutes(trajetPM) : '',
                    totalTrajetJour > 0 ? formatMinutes(totalTrajetJour) : '', ''
                ]);

                tableData.push([
                    '', 'Travail', chantierMatin, nomMatin.substring(0, 25),
                    travailMatin > 0 ? formatMinutes(travailMatin) : '',
                    chantierPM, nomPM.substring(0, 25),
                    travailPM > 0 ? formatMinutes(travailPM) : '',
                    '', totalTravailJour > 0 ? formatMinutes(totalTravailJour) : ''
                ]);
            });

            const tableWidth = 228;
            const marginLeft = (pageWidth - tableWidth) / 2;

            autoTable(doc, {
                startY: 35,
                margin: { left: marginLeft },
                head: [[
                    'Jour', 'Type',
                    { content: 'MATIN', colSpan: 3 },
                    { content: 'APRÈS-MIDI', colSpan: 3 },
                    { content: 'Total', colSpan: 2 }
                ], [
                    '', '',
                    'N° Chantier', 'Nom', 'Heures',
                    'N° Chantier', 'Nom', 'Heures',
                    'Trajet', 'Travail'
                ]],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, lineColor: [0, 0, 0] },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 20 }, 1: { cellWidth: 16 }, 2: { cellWidth: 22 }, 3: { cellWidth: 40 },
                    4: { cellWidth: 16, halign: 'center' }, 5: { cellWidth: 22 }, 6: { cellWidth: 40 },
                    7: { cellWidth: 16, halign: 'center' }, 8: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                    9: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
                }
            });

            const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Trajet : ${formatMinutes(totaux.trajet)}`, marginLeft, finalY);
            doc.text(`Total Travail : ${formatMinutes(totaux.travail)}`, marginLeft + 80, finalY);
            doc.text(`TOTAL : ${formatMinutes(totaux.travail + totaux.trajet)}`, marginLeft + 160, finalY);

            doc.setFont('helvetica', 'normal');
            doc.text('Validation :', marginLeft, finalY + 15);
            doc.rect(marginLeft, finalY + 18, 60, 20);
            doc.text('Observations :', marginLeft + 80, finalY + 15);
            doc.rect(marginLeft + 80, finalY + 18, 148, 20);

            // Convertir en base64
            const pdfBase64 = doc.output('datauristring');

            // Récupérer les chantiers uniques de la semaine
            const chantierIds = [...new Set(phaseDays
                .filter(pd => pd.phase.chantier?.id)
                .map(pd => pd.phase.chantier!.id)
            )];

            if (chantierIds.length === 0) {
                alert('Aucun chantier trouvé pour enregistrer le rapport');
                setSavingRapport(false);
                return;
            }

            const fileName = `Pointage_S${weekNumber}_${userNom.toUpperCase()}_${userPrenom}.pdf`;
            const fileSize = Math.round(pdfBase64.length * 0.75); // Approximation taille base64

            // Enregistrer dans chaque chantier
            for (const chantierId of chantierIds) {
                await supabase.from('documents_chantiers').insert({
                    chantier_id: chantierId,
                    type: 'feuille_pointage',
                    nom: fileName,
                    description: `Feuille de pointage Semaine ${weekNumber} - ${userPrenom} ${userNom}`,
                    storage_path: pdfBase64,
                    file_size: fileSize,
                    mime_type: 'application/pdf',
                    uploaded_by: userId
                });
            }

            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                setRapportOpen(false);
            }, 1500);

        } catch (err) {
            console.error('Erreur sauvegarde rapport:', err);
            alert('Erreur lors de la sauvegarde du rapport');
        } finally {
            setSavingRapport(false);
        }
    };

    // Totaux
    const totaux = useMemo(() => {
        let travail = 0;
        let trajet = 0;
        phaseDays.forEach(pd => {
            pd.pointages.forEach(p => {
                if (p.type === 'travail') travail += p.duree_minutes;
                else trajet += p.duree_minutes;
            });
        });
        return { travail, trajet };
    }, [phaseDays]);

    // Grouper par jour pour affichage
    const phasesByDay = useMemo(() => {
        const grouped: Record<string, PhaseDay[]> = {};
        phaseDays.forEach(pd => {
            if (!grouped[pd.date]) grouped[pd.date] = [];
            grouped[pd.date].push(pd);
        });
        return grouped;
    }, [phaseDays]);

    if (loading) {
        return (
            <MobileLayout title="FEUILLE POINTAGE" showBack showBottomNav>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title="FEUILLE POINTAGE"
            subtitle={`S${weekNumber} - ${phaseDays.length} RDV`}
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

                    <div className="text-center">
                        <p className="text-xs font-bold text-white">
                            Semaine {weekNumber}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' - '}
                            {weekDates[4].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>

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

                {/* Totaux semaine */}
                <MobileGlassCard className="p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <Wrench size={14} className="text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">
                                    {formatMinutes(totaux.travail)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Car size={14} className="text-amber-400" />
                                <span className="text-sm font-bold text-amber-400">
                                    {formatMinutes(totaux.trajet)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-lg font-black text-sky-400">
                                    {formatMinutes(totaux.travail + totaux.trajet)}
                                </span>
                                <span className="text-[9px] text-slate-500 ml-1">TOTAL</span>
                            </div>
                            <button
                                onClick={() => setRapportOpen(true)}
                                className="p-2 bg-sky-500/20 rounded-xl text-sky-400 active:scale-95"
                            >
                                <FileText size={18} />
                            </button>
                        </div>
                    </div>
                </MobileGlassCard>

                {/* Liste par jour */}
                {phaseDays.length === 0 ? (
                    <MobileGlassCard className="p-8 text-center">
                        <Clock size={32} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">Aucun rendez-vous cette semaine</p>
                    </MobileGlassCard>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(phasesByDay).map(([date, phases]) => {
                            const dateObj = new Date(date + 'T00:00:00');
                            const dayName = DAYS_FULL[dateObj.getDay()];
                            const dayNum = dateObj.getDate();
                            const isToday = date === formatLocalDate(new Date());

                            return (
                                <MobileGlassCard key={date} className="p-4">
                                    {/* Header jour */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`text-center ${isToday ? 'text-sky-400' : 'text-white'}`}>
                                            <span className={`block text-2xl font-black ${
                                                isToday ? 'text-sky-400' : 'text-white'
                                            }`}>
                                                {dayNum}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">
                                                {dayName}
                                            </span>
                                        </div>
                                        <div className="flex-1 border-l border-slate-700/50 pl-3">
                                            {/* Chantiers du jour */}
                                            <div className="space-y-4">
                                                {phases.map((pd, idx) => {
                                                    // Séparer pointages par type et période
                                                    const trajetsMatin = pd.pointages.filter(p => p.type === 'trajet' && p.periode === 'matin');
                                                    const trajetsAM = pd.pointages.filter(p => p.type === 'trajet' && p.periode === 'apres_midi');
                                                    const travailMatin = pd.pointages.filter(p => p.type === 'travail' && p.periode === 'matin');
                                                    const travailAM = pd.pointages.filter(p => p.type === 'travail' && p.periode === 'apres_midi');

                                                    return (
                                                        <div key={`${pd.phase.id}-${date}-${idx}`}>
                                                            {/* Ligne chantier */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-sm font-bold text-white">
                                                                    {pd.phase.chantier?.reference && (
                                                                        <span className="text-sky-400">{pd.phase.chantier.reference}</span>
                                                                    )}
                                                                    {pd.phase.chantier?.reference && pd.phase.chantier?.nom && ' - '}
                                                                    <span className="text-white">{pd.phase.chantier?.nom}</span>
                                                                </p>
                                                                <button
                                                                    onClick={() => openPointageModal(pd)}
                                                                    className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 active:scale-95"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>

                                                            {/* Pointages détaillés par période */}
                                                            <div className="space-y-1.5 text-sm">
                                                                {/* MATIN : Trajet puis Travail */}
                                                                {trajetsMatin.map(p => (
                                                                    <div key={p.id} className="flex items-center gap-2 bg-amber-500/5 rounded-lg px-2 py-1">
                                                                        <Car size={14} className="text-amber-400 flex-shrink-0" />
                                                                        <span className="text-slate-500 text-xs">Matin:</span>
                                                                        <span className="text-amber-400 font-medium flex-1">
                                                                            {formatMinutes(p.duree_minutes)}
                                                                        </span>
                                                                        <button onClick={() => openPointageModal(pd, p)} className="p-1 text-slate-500 hover:text-sky-400">
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button onClick={() => deletePointage(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {travailMatin.map(p => (
                                                                    <div key={p.id} className="flex items-center gap-2 bg-emerald-500/5 rounded-lg px-2 py-1">
                                                                        <Wrench size={14} className="text-emerald-400 flex-shrink-0" />
                                                                        <span className="text-slate-500 text-xs">Matin:</span>
                                                                        <span className="text-emerald-400 font-medium flex-1">
                                                                            {formatMinutes(p.duree_minutes)}
                                                                        </span>
                                                                        <button onClick={() => openPointageModal(pd, p)} className="p-1 text-slate-500 hover:text-sky-400">
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button onClick={() => deletePointage(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* PM : Travail puis Trajet */}
                                                                {travailAM.map(p => (
                                                                    <div key={p.id} className="flex items-center gap-2 bg-emerald-500/5 rounded-lg px-2 py-1">
                                                                        <Wrench size={14} className="text-emerald-400 flex-shrink-0" />
                                                                        <span className="text-slate-500 text-xs">PM:</span>
                                                                        <span className="text-emerald-400 font-medium flex-1">
                                                                            {formatMinutes(p.duree_minutes)}
                                                                        </span>
                                                                        <button onClick={() => openPointageModal(pd, p)} className="p-1 text-slate-500 hover:text-sky-400">
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button onClick={() => deletePointage(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {trajetsAM.map(p => (
                                                                    <div key={p.id} className="flex items-center gap-2 bg-amber-500/5 rounded-lg px-2 py-1">
                                                                        <Car size={14} className="text-amber-400 flex-shrink-0" />
                                                                        <span className="text-slate-500 text-xs">PM:</span>
                                                                        <span className="text-amber-400 font-medium flex-1">
                                                                            {formatMinutes(p.duree_minutes)}
                                                                        </span>
                                                                        <button onClick={() => openPointageModal(pd, p)} className="p-1 text-slate-500 hover:text-sky-400">
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button onClick={() => deletePointage(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* Message si aucun pointage */}
                                                                {pd.pointages.length === 0 && (
                                                                    <div className="flex items-center gap-2 text-slate-600 text-xs italic">
                                                                        Aucun pointage
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </MobileGlassCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Pointage */}
            {pointageModalOpen && selectedPhaseDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPointageModalOpen(false)}>
                    <div
                        className="w-full max-w-sm bg-slate-900 rounded-3xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-black text-white">
                                    {editingPointage ? 'Modifier' : 'Pointage'}
                                </h2>
                                <p className="text-xs text-sky-400 truncate max-w-[200px]">
                                    {selectedPhaseDay.phase.chantier?.reference || selectedPhaseDay.phase.chantier?.nom}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    {selectedPhaseDay.dayLabel}
                                </p>
                            </div>
                            <button
                                onClick={() => setPointageModalOpen(false)}
                                className="p-2 rounded-full bg-slate-800 text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {pointageSuccess ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                    <Check size={28} className="text-emerald-400" />
                                </div>
                                <p className="text-emerald-400 font-bold">Enregistré !</p>
                            </div>
                        ) : (
                            <>
                                {/* Type */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPointageType('travail')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointageType === 'travail'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <Wrench size={16} />
                                            Travail
                                        </button>
                                        <button
                                            onClick={() => setPointageType('trajet')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointageType === 'trajet'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <Car size={16} />
                                            Trajet
                                        </button>
                                    </div>
                                </div>

                                {/* Période */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Période
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPointagePeriode('matin')}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointagePeriode === 'matin'
                                                    ? 'bg-sky-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Matin
                                        </button>
                                        <button
                                            onClick={() => setPointagePeriode('apres_midi')}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointagePeriode === 'apres_midi'
                                                    ? 'bg-sky-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Après-midi
                                        </button>
                                    </div>
                                </div>

                                {/* Durée */}
                                <div className="mb-5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Durée (hh:mm)
                                    </label>
                                    <input
                                        type="time"
                                        value={pointageDuree}
                                        onChange={(e) => setPointageDuree(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-bold text-lg"
                                    />
                                </div>

                                {/* Enregistrer */}
                                <button
                                    onClick={savePointage}
                                    disabled={pointageSaving}
                                    className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-transform disabled:opacity-50"
                                >
                                    {pointageSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Rapport */}
            {rapportOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800">
                        <h2 className="text-lg font-black text-white">
                            Rapport Semaine {weekNumber}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={saveRapportToDocuments}
                                disabled={savingRapport}
                                className={`p-2 rounded-full ${
                                    saveSuccess
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-sky-500/20 text-sky-400'
                                } active:scale-95 disabled:opacity-50`}
                                title="Envoyer le rapport"
                            >
                                {savingRapport ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : saveSuccess ? (
                                    <Check size={20} />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                            <button
                                onClick={() => setRapportOpen(false)}
                                className="p-2 rounded-full bg-slate-800 text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Contenu rapport */}
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {/* En-tête rapport */}
                        <div className="text-center border-b border-slate-700 pb-4">
                            <h3 className="text-xl font-black text-white">FEUILLE DE POINTAGE</h3>
                            <p className="text-slate-400">
                                Semaine {weekNumber} • {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Totaux */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Récapitulatif</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                                        <Wrench size={16} />
                                    </div>
                                    <p className="text-lg font-black text-emerald-400">{formatMinutes(totaux.travail)}</p>
                                    <p className="text-[10px] text-slate-500">TRAVAIL</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                                        <Car size={16} />
                                    </div>
                                    <p className="text-lg font-black text-amber-400">{formatMinutes(totaux.trajet)}</p>
                                    <p className="text-[10px] text-slate-500">TRAJET</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-1 text-sky-400 mb-1">
                                        <Clock size={16} />
                                    </div>
                                    <p className="text-lg font-black text-sky-400">{formatMinutes(totaux.travail + totaux.trajet)}</p>
                                    <p className="text-[10px] text-slate-500">TOTAL</p>
                                </div>
                            </div>
                        </div>

                        {/* Détail par jour */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-slate-500">Détail par jour</h4>
                            {Object.entries(phasesByDay).map(([date, phases]) => {
                                const dateObj = new Date(date + 'T00:00:00');
                                const dayName = DAYS_FULL[dateObj.getDay()];
                                const dayNum = dateObj.getDate();

                                // Calculer totaux du jour
                                let dayTravail = 0;
                                let dayTrajet = 0;
                                phases.forEach(pd => {
                                    pd.pointages.forEach(p => {
                                        if (p.type === 'travail') dayTravail += p.duree_minutes;
                                        else dayTrajet += p.duree_minutes;
                                    });
                                });

                                return (
                                    <div key={date} className="bg-slate-800/30 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white">
                                                {dayName} {dayNum}
                                            </span>
                                            <span className="text-sm font-bold text-sky-400">
                                                {formatMinutes(dayTravail + dayTrajet)}
                                            </span>
                                        </div>
                                        {phases.map((pd, idx) => (
                                            <div key={idx} className="text-sm text-slate-400 ml-2 mb-1">
                                                <span className="text-slate-300">
                                                    {pd.phase.chantier?.reference || pd.phase.chantier?.nom}
                                                </span>
                                                {pd.pointages.length > 0 && (
                                                    <span className="ml-2">
                                                        {pd.pointages.map(p => (
                                                            <span key={p.id} className={`mr-2 ${p.type === 'trajet' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                {p.type === 'trajet' ? '🚗' : '🔧'} {formatMinutes(p.duree_minutes)}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Signature */}
                        <div className="border-t border-slate-700 pt-4 mt-6">
                            <p className="text-xs text-slate-500 text-center">
                                Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>
    );
}
