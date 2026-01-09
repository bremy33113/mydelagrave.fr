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

// Couleurs des statuts de chantier (planning)
export const CHANTIER_STATUS_COLORS = {
    nouveau: 'bg-blue-500/80 border-blue-400',
    planifie: 'bg-purple-500/80 border-purple-400',
    en_cours: 'bg-amber-500/80 border-amber-400',
    pose_en_cours: 'bg-pink-500/80 border-pink-400',
    a_terminer: 'bg-orange-500/80 border-orange-400',
    termine: 'bg-green-500/80 border-green-400',
} as const;

// Couleurs des statuts de chantier (mobile - avec label)
export const CHANTIER_STATUS_CONFIG = {
    nouveau: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Nouveau' },
    en_preparation: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'En préparation' },
    en_cours: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'En cours' },
    termine: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Terminé' },
    annule: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Annulé' },
} as const;

// Couleurs des rôles utilisateurs
export const ROLE_COLORS = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    superviseur: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    charge_affaire: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    poseur: 'bg-green-500/20 text-green-400 border-green-500/30',
} as const;

// Couleurs des rôles (version simple sans border)
export const ROLE_COLORS_SIMPLE = {
    admin: 'bg-red-500/20 text-red-400',
    superviseur: 'bg-purple-500/20 text-purple-400',
    charge_affaire: 'bg-blue-500/20 text-blue-400',
    poseur: 'bg-green-500/20 text-green-400',
} as const;

// Hiérarchie des rôles (pour le tri)
export const ROLE_HIERARCHY = {
    admin: 4,
    superviseur: 3,
    charge_affaire: 2,
    poseur: 1,
} as const;

// Icônes des types de documents
export const DOCUMENT_TYPE_ICONS = {
    plan: '📐',
    devis: '💰',
    rapport: '📄',
    reserve: '📋',
    feuille_pointage: '📊',
    default: '📎',
} as const;

// Labels des types de documents
export const DOCUMENT_TYPE_LABELS = {
    plan: 'Plan',
    devis: 'Devis',
    rapport: 'Rapport',
    reserve: 'Réserve',
    feuille_pointage: 'Feuille de pointage',
} as const;

// Jours de la semaine (courts)
export const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

// Jours de la semaine (longs)
export const DAYS_LONG = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

// Jours de la semaine (longs, commençant par Lundi)
export const DAYS_LONG_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
