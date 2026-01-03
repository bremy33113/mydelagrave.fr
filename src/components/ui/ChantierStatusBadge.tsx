interface ChantierStatusBadgeProps {
    statut: string;
    label?: string;
    icon?: string;
    color?: string;
}

const defaultStatuses: Record<string, { label: string; icon: string; color: string }> = {
    nouveau: { label: 'Nouveau', icon: '🆕', color: '#3B82F6' },
    en_cours: { label: 'En cours', icon: '🔄', color: '#F59E0B' },
    planifie: { label: 'Planifié', icon: '📅', color: '#8B5CF6' },
    pose_en_cours: { label: 'Pose en cours', icon: '🔨', color: '#EC4899' },
    a_terminer: { label: 'À terminer', icon: '⏳', color: '#F97316' },
    termine: { label: 'Terminé', icon: '✅', color: '#10B981' },
};

export function ChantierStatusBadge({ statut, label, icon, color }: ChantierStatusBadgeProps) {
    const status = defaultStatuses[statut] || {
        label: label || statut,
        icon: icon || '❓',
        color: color || '#64748B',
    };

    return (
        <span
            className="status-badge"
            style={{
                backgroundColor: `${status.color}20`,
                color: status.color,
                border: `1px solid ${status.color}40`,
            }}
        >
            <span>{status.icon}</span>
            <span>{label || status.label}</span>
        </span>
    );
}
