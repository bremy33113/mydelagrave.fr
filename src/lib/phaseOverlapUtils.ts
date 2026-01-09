/**
 * Utilitaires pour la détection et gestion des chevauchements de phases
 */

import { calculateEndDateTime } from './dateUtils';
import type { Tables } from './database.types';

type Phase = Tables<'phases_chantiers'>;

/**
 * Parse une heure au format HH:MM:SS en nombre
 */
function parseHour(hourStr: string | null | undefined): number {
    if (!hourStr) return 8;
    return parseInt(hourStr.split(':')[0], 10) || 8;
}

/**
 * Convertit date + heure en timestamp comparable
 */
function toTimestamp(date: string, hour: number): number {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
}

/**
 * Compare deux dates+heures pour déterminer l'ordre chronologique
 * Retourne: -1 si a < b, 0 si égaux, 1 si a > b
 */
export function comparePhaseDates(
    dateA: string,
    hourA: number,
    dateB: string,
    hourB: number
): number {
    const tsA = toTimestamp(dateA, hourA);
    const tsB = toTimestamp(dateB, hourB);

    if (tsA < tsB) return -1;
    if (tsA > tsB) return 1;
    return 0;
}

/**
 * Vérifie si phaseB commence avant que phaseA ne finisse (chevauchement)
 * @param phaseAEnd - Date/heure de fin de la phase A
 * @param phaseBStart - Date/heure de début de la phase B
 */
export function hasOverlap(
    phaseAEndDate: string,
    phaseAEndHour: number,
    phaseBStartDate: string,
    phaseBStartHour: number
): boolean {
    const endA = toTimestamp(phaseAEndDate, phaseAEndHour);
    const startB = toTimestamp(phaseBStartDate, phaseBStartHour);
    // Chevauchement si B commence avant que A ne finisse
    return startB < endA;
}

/**
 * Calcule les updates nécessaires pour éviter les chevauchements en cascade
 *
 * @param phaseId - ID de la phase modifiée
 * @param newDateFin - Nouvelle date de fin de la phase modifiée
 * @param newHeureFin - Nouvelle heure de fin de la phase modifiée
 * @param allPhases - Toutes les phases du planning
 * @returns Tableau d'updates à appliquer aux phases suivantes
 */
export function calculateCascadeUpdates(
    phaseId: string,
    newDateFin: string,
    newHeureFin: number,
    allPhases: Phase[]
): Array<{ id: string; updates: Partial<Phase> }> {
    const updates: Array<{ id: string; updates: Partial<Phase> }> = [];

    // Trouver la phase modifiée
    const modifiedPhase = allPhases.find(p => p.id === phaseId);
    if (!modifiedPhase) return updates;

    // Si pas de groupe_phase, pas de propagation
    if (!modifiedPhase.groupe_phase) return updates;

    // Filtrer les phases du même chantier ET même groupe_phase
    const sameGroupPhases = allPhases.filter(p =>
        p.chantier_id === modifiedPhase.chantier_id &&
        p.groupe_phase === modifiedPhase.groupe_phase &&
        p.id !== phaseId
    );

    if (sameGroupPhases.length === 0) return updates;

    // Trier par date_debut + heure_debut
    const sortedPhases = [...sameGroupPhases].sort((a, b) => {
        const hourA = parseHour(a.heure_debut);
        const hourB = parseHour(b.heure_debut);
        return comparePhaseDates(a.date_debut, hourA, b.date_debut, hourB);
    });

    // Filtrer pour ne garder que les phases qui commencent APRÈS ou EN MÊME TEMPS que la fin originale
    // et qui pourraient être affectées par la nouvelle date de fin
    const modifiedPhaseStartHour = parseHour(modifiedPhase.heure_debut);
    const modifiedPhaseStart = toTimestamp(modifiedPhase.date_debut, modifiedPhaseStartHour);

    const potentiallyAffected = sortedPhases.filter(p => {
        const pStart = toTimestamp(p.date_debut, parseHour(p.heure_debut));
        // Phase qui commence après le début de la phase modifiée
        return pStart > modifiedPhaseStart;
    });

    // Maintenant, vérifier les chevauchements en cascade
    let currentEndDate = newDateFin;
    let currentEndHour = newHeureFin;

    for (const phase of potentiallyAffected) {
        const phaseStartDate = phase.date_debut;
        const phaseStartHour = parseHour(phase.heure_debut);

        // Vérifier s'il y a chevauchement
        if (hasOverlap(currentEndDate, currentEndHour, phaseStartDate, phaseStartHour)) {
            // Calculer la nouvelle date de début = date de fin de la phase précédente
            // On commence juste après la fin de la phase précédente
            let newStartDate = currentEndDate;
            let newStartHour = currentEndHour;

            // Si l'heure de fin est 12h, on commence à 13h (après pause déjeuner)
            if (currentEndHour === 12) {
                newStartHour = 13;
            }
            // Si l'heure de fin est 17h, on commence le lendemain à 8h
            else if (currentEndHour >= 17) {
                const nextDay = new Date(currentEndDate);
                nextDay.setDate(nextDay.getDate() + 1);
                // Sauter les weekends
                while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
                    nextDay.setDate(nextDay.getDate() + 1);
                }
                newStartDate = formatDate(nextDay);
                newStartHour = 8;
            }

            // Calculer la nouvelle date de fin
            const { endDate, endHour } = calculateEndDateTime(newStartDate, newStartHour, phase.duree_heures);

            updates.push({
                id: phase.id,
                updates: {
                    date_debut: newStartDate,
                    date_fin: endDate,
                    heure_debut: `${newStartHour.toString().padStart(2, '0')}:00:00`,
                    heure_fin: `${endHour.toString().padStart(2, '0')}:00:00`,
                }
            });

            // Mettre à jour pour la vérification de la phase suivante
            currentEndDate = endDate;
            currentEndHour = endHour;
        } else {
            // Pas de chevauchement, arrêter la cascade
            // (les phases suivantes ne peuvent pas chevaucher non plus)
            break;
        }
    }

    return updates;
}

/**
 * Formate une date en YYYY-MM-DD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
