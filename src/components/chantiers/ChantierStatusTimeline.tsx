import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatLocalDate } from '../../lib/dateUtils';

interface Phase {
    id: string;
    date_debut: string;
    date_fin: string;
    duree_heures: number;
    poseur_id: string | null;
}

interface ChantierStatusTimelineProps {
    chantierId: string;
    currentStatus: string;
    onStatusChange?: (newStatus: string) => void;
    canInteract?: boolean; // Si le user peut interagir (poseur, charge_affaire, admin, superviseur)
}

const STATUSES = [
    { code: 'nouveau', label: 'Nouveau', icon: '🆕' },
    { code: 'en_cours', label: 'En cours', icon: '🔄' },
    { code: 'planifie', label: 'Planifié', icon: '📅' },
    { code: 'pose_en_cours', label: 'En chantier', icon: '🔨' },
    { code: 'a_terminer', label: 'À terminer', icon: '⏳' },
    { code: 'termine', label: 'Terminé', icon: '✅' },
];

export function ChantierStatusTimeline({
    chantierId,
    currentStatus,
    onStatusChange,
    canInteract = true,
}: ChantierStatusTimelineProps) {
    const currentIndex = STATUSES.findIndex(s => s.code === currentStatus);

    // Chargement direct des phases depuis Supabase pour fiabilité
    const [loadedPhases, setLoadedPhases] = useState<Phase[]>([]);

    useEffect(() => {
        const fetchPhases = async () => {
            const { data } = await supabase
                .from('phases_chantiers')
                .select('id, date_debut, date_fin, duree_heures, poseur_id')
                .eq('chantier_id', chantierId)
                .gt('duree_heures', 0);

            if (data) setLoadedPhases(data as Phase[]);
        };

        fetchPhases();
    }, [chantierId]);

    // Calculer les conditions basées sur les phases
    const phaseConditions = useMemo(() => {
        const today = formatLocalDate(new Date());
        const yesterday = formatLocalDate(new Date(Date.now() - 86400000));

        // A des phases planifiées
        const hasAnyPhases = loadedPhases.length > 0;

        // Toutes les phases ont un poseur assigné
        const allPhasesHavePoseur = hasAnyPhases && loadedPhases.every(
            (p) => p.poseur_id !== null
        );

        // Phase active aujourd'hui
        const hasPhaseToday = loadedPhases.some(
            (p) => p.date_debut <= today && p.date_fin >= today
        );

        // Phase terminée hier
        const phaseEndedYesterday = loadedPhases.some(
            (p) => p.date_fin === yesterday
        );

        // Phases à venir (après aujourd'hui)
        const hasUpcomingPhases = loadedPhases.some(
            (p) => p.date_debut > today
        );

        return { hasAnyPhases, allPhasesHavePoseur, hasPhaseToday, phaseEndedYesterday, hasUpcomingPhases };
    }, [loadedPhases]);

    // Transitions automatiques basées sur les phases
    useEffect(() => {
        const { hasPhaseToday, phaseEndedYesterday, hasUpcomingPhases } = phaseConditions;

        // Planifié + phase aujourd'hui → En chantier (automatique)
        if (currentStatus === 'planifie' && hasPhaseToday) {
            handleStatusClick('pose_en_cours', true);
        }

        // En chantier + phase terminée hier + phases à venir → En cours (retour)
        if (currentStatus === 'pose_en_cours' && phaseEndedYesterday && hasUpcomingPhases && !hasPhaseToday) {
            handleStatusClick('en_cours', true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStatus, phaseConditions]);

    // Déterminer l'animation pour un statut donné
    const getStatusAnimation = (statusCode: string): { animation: string; canClick: boolean } => {
        const { hasAnyPhases, allPhasesHavePoseur, hasPhaseToday, phaseEndedYesterday, hasUpcomingPhases } = phaseConditions;

        // Bloquer "Planifié" si aucune phase OU poseur non attribué
        if (statusCode === 'planifie') {
            if (!hasAnyPhases || !allPhasesHavePoseur) {
                return { animation: '', canClick: false };
            }
        }

        // Animation sur "En chantier" (pose_en_cours)
        if (statusCode === 'pose_en_cours') {
            // Vert: statut actuel = pose_en_cours ET phase active
            if (currentStatus === 'pose_en_cours' && hasPhaseToday) {
                return { animation: 'animate-pulse ring-4 ring-green-500/50', canClick: canInteract };
            }
            // Rouge: phase active mais statut pas correct (nouveau ou en_cours)
            if ((currentStatus === 'nouveau' || currentStatus === 'en_cours') && hasPhaseToday) {
                return { animation: 'animate-pulse ring-4 ring-red-500/50', canClick: false };
            }
        }

        // Animation sur "À terminer" (a_terminer)
        if (statusCode === 'a_terminer') {
            // Orange: phase terminée hier ET pas de phases à venir
            if (phaseEndedYesterday && !hasUpcomingPhases && !hasPhaseToday) {
                return { animation: 'animate-pulse ring-4 ring-orange-500/50', canClick: canInteract };
            }
        }

        return { animation: '', canClick: canInteract };
    };

    const handleStatusClick = async (statusCode: string, isAuto = false) => {
        if (statusCode === currentStatus) return;

        // Si c'est un clic manuel et non auto, vérifier canInteract
        if (!isAuto && !canInteract) return;

        // Vérifier si le bouton est cliquable pour ce statut
        const { canClick } = getStatusAnimation(statusCode);
        if (!isAuto && !canClick) return;

        try {
            const { error } = await supabase
                .from('chantiers')
                .update({ statut: statusCode })
                .eq('id', chantierId);

            if (error) throw error;
            onStatusChange?.(statusCode);
        } catch (err) {
            console.error('Erreur mise à jour statut:', err);
        }
    };

    return (
        <div className="w-full max-w-md py-1" data-testid="status-timeline">
            <div className="relative flex items-start justify-between">
                {/* Ligne de connexion de fond (grise) - centrée sur les icônes (16px = moitié de 32px) */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700" />

                {/* Ligne de progression (colorée) */}
                {currentIndex >= 0 && (
                    <div
                        className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                        style={{
                            width: `${(currentIndex / (STATUSES.length - 1)) * 100}%`,
                        }}
                    />
                )}

                {/* Points de statut */}
                {STATUSES.map((status, index) => {
                    const isPast = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;
                    const { animation, canClick } = getStatusAnimation(status.code);

                    return (
                        <button
                            key={status.code}
                            onClick={() => handleStatusClick(status.code)}
                            disabled={!canClick}
                            className={`relative z-10 flex flex-col items-center gap-1 transition-all duration-300 group ${
                                canClick ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                            title={canClick ? `Passer en "${status.label}"` : `${status.label} (non modifiable)`}
                        >
                            {/* Point */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                                    animation ? animation : ''
                                } ${
                                    isCurrent
                                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 ring-4 ring-blue-500/30 scale-110 shadow-lg shadow-blue-500/30'
                                        : isPast
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md'
                                        : 'bg-slate-700 hover:bg-slate-600 hover:scale-105'
                                } ${isFuture && canClick ? 'group-hover:ring-2 group-hover:ring-slate-500' : ''}`}
                            >
                                {status.icon}
                            </div>

                            {/* Label */}
                            <span
                                className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                                    isCurrent
                                        ? 'text-blue-400'
                                        : isPast
                                        ? 'text-green-400'
                                        : 'text-slate-500 group-hover:text-slate-400'
                                }`}
                            >
                                {status.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
