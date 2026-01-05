interface MobileStatusBadgeProps {
    status: string;
    className?: string;
}

const statusGradients: Record<string, string> = {
    // Statuts chantier
    nouveau: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    en_cours: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    planifie: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    pose_en_cours: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    a_terminer: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    termine: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    // Statuts réserve
    ouverte: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    en_cours_traitement: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    levee: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    rejetee: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
};

const statusLabels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    planifie: 'Planifié',
    pose_en_cours: 'Pose en cours',
    a_terminer: 'À terminer',
    termine: 'Terminé',
    ouverte: 'Ouverte',
    en_cours_traitement: 'En cours',
    levee: 'Levée',
    rejetee: 'Rejetée',
};

export function MobileStatusBadge({ status, className = '' }: MobileStatusBadgeProps) {
    const gradient = statusGradients[status] || statusGradients.nouveau;
    const label = statusLabels[status] || status;

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${className}`}
            style={{ background: gradient }}
        >
            {label}
        </span>
    );
}

export function getCategoryGradient(category: string | null): string {
    switch (category) {
        case 'labo':
            return 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)';
        case 'en':
            return 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)';
        case 'hospitalier':
            return 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)';
        default:
            return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    }
}

export function getCategoryIcon(category: string | null): string {
    switch (category) {
        case 'labo':
            return 'L';
        case 'en':
            return 'E';
        case 'hospitalier':
            return 'H';
        default:
            return 'A';
    }
}
