/**
 * Constants partagées pour MyDelagrave
 */

// Jours fériés français (2025-2027)
export const FRENCH_HOLIDAYS = [
    // 2025
    '2025-01-01', // Jour de l'An
    '2025-04-21', // Lundi de Pâques
    '2025-05-01', // Fête du Travail
    '2025-05-08', // Victoire 1945
    '2025-05-29', // Ascension
    '2025-06-09', // Lundi de Pentecôte
    '2025-07-14', // Fête Nationale
    '2025-08-15', // Assomption
    '2025-11-01', // Toussaint
    '2025-11-11', // Armistice
    '2025-12-25', // Noël
    // 2026
    '2026-01-01', // Jour de l'An
    '2026-04-06', // Lundi de Pâques
    '2026-05-01', // Fête du Travail
    '2026-05-08', // Victoire 1945
    '2026-05-14', // Ascension
    '2026-05-25', // Lundi de Pentecôte
    '2026-07-14', // Fête Nationale
    '2026-08-15', // Assomption
    '2026-11-01', // Toussaint
    '2026-11-11', // Armistice
    '2026-12-25', // Noël
    // 2027
    '2027-01-01', // Jour de l'An
    '2027-03-29', // Lundi de Pâques
    '2027-05-01', // Fête du Travail
    '2027-05-06', // Ascension
    '2027-05-08', // Victoire 1945
    '2027-05-17', // Lundi de Pentecôte
    '2027-07-14', // Fête Nationale
    '2027-08-15', // Assomption
    '2027-11-01', // Toussaint
    '2027-11-11', // Armistice
    '2027-12-25', // Noël
] as const;

// Heures de travail
export const WORK_HOURS = {
    MORNING_START: 8,
    MORNING_END: 12,
    AFTERNOON_START: 13,
    AFTERNOON_END: 17,
} as const;

// Heures par jour de travail (4h matin + 4h après-midi)
export const HOURS_PER_DAY =
    (WORK_HOURS.MORNING_END - WORK_HOURS.MORNING_START) +
    (WORK_HOURS.AFTERNOON_END - WORK_HOURS.AFTERNOON_START);

// Configuration des fichiers
export const FILE_CONFIG = {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Configuration compression images (notes)
export const IMAGE_COMPRESSION = {
    MOCK_MAX_SIZE: 300,
    MOCK_QUALITY: 0.5,
    PROD_MAX_SIZE: 800,
    PROD_QUALITY: 0.8,
} as const;

// Planning
export const PLANNING_CONFIG = {
    MIN_COLUMN_WIDTH: 120,
    DEFAULT_COLUMN_WIDTH: 150,
    POSEUR_COLUMN_WIDTH: 180,
    MIN_PHASE_DURATION: 1, // heures
    MAX_PHASE_DURATION: 40, // heures (5 jours)
} as const;

// Couleurs des statuts de réserve
export const RESERVE_STATUS_COLORS = {
    ouverte: 'bg-red-500/20 text-red-400 border-red-500/30',
    en_cours: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    levee: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejetee: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
} as const;

// Labels des statuts de réserve
export const RESERVE_STATUS_LABELS = {
    ouverte: 'Ouverte',
    en_cours: 'En cours',
    levee: 'Levée',
    rejetee: 'Rejetée',
} as const;
