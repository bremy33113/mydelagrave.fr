/**
 * Utilitaires de date pour MyDelagrave
 */

import { FRENCH_HOLIDAYS, WORK_HOURS } from './constants';

/**
 * Formate une date en YYYY-MM-DD en timezone locale (pas UTC)
 * Évite les problèmes de décalage de jour avec toISOString()
 */
export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Vérifie si une date est un jour férié français
 */
export function isHoliday(date: Date | string): boolean {
    const dateStr = typeof date === 'string' ? date : formatLocalDate(date);
    return FRENCH_HOLIDAYS.includes(dateStr as typeof FRENCH_HOLIDAYS[number]);
}

/**
 * Vérifie si une date est un jour ouvré (lun-ven, hors jours fériés)
 */
export function isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    // Weekend
    if (day === 0 || day === 6) return false;
    // Jour férié
    if (isHoliday(date)) return false;
    return true;
}

/**
 * Retourne le prochain jour ouvré à partir d'une date
 */
export function getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    while (!isWorkingDay(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
}

/**
 * Calcule la date et heure de fin à partir d'une date de début et d'une durée en heures
 * Respecte les heures de travail (8h-12h, 13h-17h) et les jours ouvrés
 */
export function calculateEndDateTime(
    startDate: string,
    startHour: number,
    durationHours: number
): { endDate: string; endHour: number } {
    let remainingHours = durationHours;
    const currentDate = new Date(startDate);
    let currentHour = startHour;

    // Ajuster l'heure de départ si en dehors des heures de travail
    if (currentHour < WORK_HOURS.MORNING_START) {
        currentHour = WORK_HOURS.MORNING_START;
    }
    if (currentHour >= WORK_HOURS.MORNING_END && currentHour < WORK_HOURS.AFTERNOON_START) {
        currentHour = WORK_HOURS.AFTERNOON_START;
    }
    if (currentHour >= WORK_HOURS.AFTERNOON_END) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentHour = WORK_HOURS.MORNING_START;
    }

    // Avancer jusqu'au prochain jour ouvré si nécessaire
    while (!isWorkingDay(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Consommer les heures de travail
    while (remainingHours > 0) {
        if (currentHour >= WORK_HOURS.MORNING_START && currentHour < WORK_HOURS.MORNING_END) {
            const morningHours = Math.min(WORK_HOURS.MORNING_END - currentHour, remainingHours);
            remainingHours -= morningHours;
            currentHour = WORK_HOURS.MORNING_END;

            if (remainingHours > 0) {
                const afternoonHours = Math.min(
                    WORK_HOURS.AFTERNOON_END - WORK_HOURS.AFTERNOON_START,
                    remainingHours
                );
                remainingHours -= afternoonHours;
                currentHour = WORK_HOURS.AFTERNOON_START + afternoonHours;
            }
        } else if (currentHour >= WORK_HOURS.AFTERNOON_START && currentHour < WORK_HOURS.AFTERNOON_END) {
            const afternoonHours = Math.min(WORK_HOURS.AFTERNOON_END - currentHour, remainingHours);
            remainingHours -= afternoonHours;
            currentHour += afternoonHours;
        }

        // Passer au jour suivant si nécessaire
        if (remainingHours > 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            while (!isWorkingDay(currentDate)) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            currentHour = WORK_HOURS.MORNING_START;
        }
    }

    return {
        endDate: formatLocalDate(currentDate),
        endHour: currentHour,
    };
}

/**
 * Formate une date en format court français (ex: "lun. 06 janv. 26")
 */
export function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
}

/**
 * Formate une date en format long français (ex: "Lundi 6 janvier 2026")
 */
export function formatDateLong(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formate une date en format jour/mois (ex: "06/01")
 */
export function formatDateDayMonth(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
    });
}

/**
 * Formate une heure (ex: 8 -> "08:00", 13.5 -> "13:30")
 */
export function formatHour(hour: number): string {
    const hours = Math.floor(hour);
    const minutes = Math.round((hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse une heure au format HH:MM:SS en nombre d'heures
 */
export function parseHourString(hourStr: string | null | undefined): number {
    if (!hourStr) return WORK_HOURS.MORNING_START;
    const parts = hourStr.split(':');
    return parseInt(parts[0], 10) || WORK_HOURS.MORNING_START;
}

/**
 * Génère les dates d'une semaine à partir d'une date
 */
export function getWeekDates(startOfWeek: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
    }
    return dates;
}

/**
 * Retourne le numéro de semaine ISO 8601 (1-53)
 * La semaine 1 est celle contenant le premier jeudi de l'année
 */
export function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Retourne le lundi de la semaine contenant la date donnée
 */
export function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Compare deux dates (sans l'heure)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return formatLocalDate(date1) === formatLocalDate(date2);
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date | string): boolean {
    const dateStr = typeof date === 'string' ? date : formatLocalDate(date);
    return dateStr === formatLocalDate(new Date());
}

/**
 * Calcule le nombre de jours ouvrés entre deux dates
 */
export function countWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;

    const current = new Date(start);
    while (current <= end) {
        if (isWorkingDay(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}
