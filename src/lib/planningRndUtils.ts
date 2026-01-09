/**
 * Utilitaires pour react-rnd dans le planning
 * Conversion entre pixels et date/heure/durée
 */

import { WORK_HOURS } from './constants';

export interface WorkingDateInfo {
    date: Date;
    isHoliday: boolean;
    weekendBefore: boolean;
}

/**
 * Heures de travail valides (8h-12h matin, 13h-17h après-midi)
 */
export const VALID_HOURS = [8, 9, 10, 11, 13, 14, 15, 16] as const;

/**
 * Nombre d'heures de travail par jour
 */
export const HOURS_PER_DAY = 8;

/**
 * Convertit une heure en fraction du jour de travail (0-1)
 * Working hours: 8-12 (matin) + 13-17 (après-midi) = 8h total
 */
export function hourToFraction(hour: number): number {
    if (hour <= WORK_HOURS.MORNING_START) return 0;
    if (hour >= WORK_HOURS.AFTERNOON_END) return 1;

    // Matin: 8-12 → 0-0.5
    if (hour <= WORK_HOURS.MORNING_END) {
        return (hour - WORK_HOURS.MORNING_START) / HOURS_PER_DAY;
    }

    // Pause déjeuner (12-13): traité comme fin de matinée
    if (hour < WORK_HOURS.AFTERNOON_START) return 0.5;

    // Après-midi: 13-17 → 0.5-1
    return 0.5 + (hour - WORK_HOURS.AFTERNOON_START) / HOURS_PER_DAY;
}

/**
 * Convertit une fraction (0-1) en heure de travail
 */
export function fractionToHour(fraction: number): number {
    if (fraction <= 0) return WORK_HOURS.MORNING_START;
    if (fraction >= 1) return WORK_HOURS.AFTERNOON_END;

    // Matin: 0-0.5 → 8-12
    if (fraction <= 0.5) {
        return WORK_HOURS.MORNING_START + fraction * HOURS_PER_DAY;
    }

    // Après-midi: 0.5-1 → 13-17
    return WORK_HOURS.AFTERNOON_START + (fraction - 0.5) * HOURS_PER_DAY;
}

/**
 * Arrondit une heure à l'heure de travail valide la plus proche
 */
export function snapToValidHour(hour: number): number {
    // Trouver l'heure valide la plus proche
    let closest: number = VALID_HOURS[0];
    let minDiff = Math.abs(hour - closest);

    for (const validHour of VALID_HOURS) {
        const diff = Math.abs(hour - validHour);
        if (diff < minDiff) {
            minDiff = diff;
            closest = validHour;
        }
    }

    return closest;
}

/**
 * Calcule la position X en pixels pour une date et heure données
 */
export function dateTimeToPixels(
    date: string,
    hour: number,
    columnWidth: number,
    workingDates: WorkingDateInfo[]
): number {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Trouver l'index du jour dans workingDates
    let dateIndex = -1;
    for (let i = 0; i < workingDates.length; i++) {
        const workDate = new Date(workingDates[i].date);
        workDate.setHours(0, 0, 0, 0);
        if (workDate.getTime() === targetDate.getTime()) {
            dateIndex = i;
            break;
        }
    }

    // Si la date n'est pas trouvée, retourner 0
    if (dateIndex === -1) return 0;

    // Calculer la position X (avec les séparateurs de weekend)
    let x = 0;
    for (let i = 0; i < dateIndex; i++) {
        if (workingDates[i].weekendBefore) {
            x += 4; // largeur du séparateur weekend
        }
        x += columnWidth;
    }

    // Ajouter le séparateur du jour cible si présent
    if (workingDates[dateIndex].weekendBefore) {
        x += 4;
    }

    // Ajouter le décalage intra-journalier basé sur l'heure
    const fraction = hourToFraction(hour);
    x += fraction * columnWidth;

    return x;
}

/**
 * Convertit une position X en pixels vers date et heure
 */
export function pixelsToDateTime(
    pixelX: number,
    columnWidth: number,
    workingDates: WorkingDateInfo[]
): { date: string; hour: number } | null {
    if (workingDates.length === 0) return null;

    let currentX = 0;

    for (let i = 0; i < workingDates.length; i++) {
        // Ajouter le séparateur weekend si présent
        if (workingDates[i].weekendBefore) {
            currentX += 4;
        }

        const dayStart = currentX;
        const dayEnd = currentX + columnWidth;

        // Si le pixel est dans ce jour
        if (pixelX >= dayStart && pixelX < dayEnd) {
            // Calculer la fraction du jour
            const fraction = (pixelX - dayStart) / columnWidth;
            const hour = fractionToHour(fraction);
            const snappedHour = snapToValidHour(hour);

            // Formater la date en YYYY-MM-DD
            const d = workingDates[i].date;
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            return { date: dateStr, hour: snappedHour };
        }

        currentX += columnWidth;
    }

    // Si au-delà du dernier jour, retourner le dernier jour
    if (pixelX >= currentX && workingDates.length > 0) {
        const lastDate = workingDates[workingDates.length - 1].date;
        const dateStr = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
        return { date: dateStr, hour: WORK_HOURS.AFTERNOON_END };
    }

    return null;
}

/**
 * Convertit une durée en heures vers une largeur en pixels
 */
export function hoursToPixels(hours: number, columnWidth: number): number {
    // Chaque heure = 1/8 de la largeur d'un jour
    return (hours / HOURS_PER_DAY) * columnWidth;
}

/**
 * Convertit une largeur en pixels vers une durée en heures
 */
export function pixelsToHours(widthPixels: number, columnWidth: number): number {
    // Calculer les heures basé sur la largeur
    const hours = (widthPixels / columnWidth) * HOURS_PER_DAY;
    // Arrondir à l'heure la plus proche et garantir minimum 1h
    return Math.max(1, Math.round(hours));
}

/**
 * Calcule la grille de snap pour react-rnd
 * @returns [snapX, snapY] - snap horizontal aux heures, pas de snap vertical
 */
export function getSnapGrid(columnWidth: number): [number, number] {
    // Snap à chaque heure (1/8 de jour)
    const hourSnap = columnWidth / HOURS_PER_DAY;
    return [hourSnap, 1];
}

/**
 * Calcule la largeur minimum en pixels (1 heure)
 */
export function getMinWidth(columnWidth: number): number {
    return columnWidth / HOURS_PER_DAY;
}

/**
 * Calcule la largeur maximum en pixels (40 heures = 5 jours)
 */
export function getMaxWidth(columnWidth: number): number {
    return (40 / HOURS_PER_DAY) * columnWidth;
}
