import { KPICard } from './KPICard';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'>;

interface KPIBarProps {
    chantiers: Chantier[];
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
}

export function KPIBar({ chantiers, activeFilter, onFilterChange }: KPIBarProps) {
    // Calculer les KPIs
    const total = chantiers.length;
    const nouveaux = chantiers.filter((c) => c.statut === 'nouveau').length;
    const nonPlanifies = chantiers.filter(
        (c) => !c.date_debut && c.statut !== 'termine'
    ).length;
    const nonAttribues = chantiers.filter(
        (c) => !c.charge_affaire_id && c.statut !== 'termine'
    ).length;
    const enCours = chantiers.filter(
        (c) => c.statut === 'en_cours' || c.statut === 'pose_en_cours'
    ).length;
    const planifies = chantiers.filter((c) => c.statut === 'planifie').length;
    const aTerminer = chantiers.filter((c) => c.statut === 'a_terminer').length;
    const termines = chantiers.filter((c) => c.statut === 'termine').length;

    const kpis = [
        {
            id: null,
            title: 'Total',
            value: total,
            icon: '📊',
            color: '#94A3B8',
        },
        {
            id: 'nouveau',
            title: 'Nouveaux',
            value: nouveaux,
            icon: '🆕',
            color: '#3B82F6',
        },
        {
            id: 'non_planifie',
            title: 'Non planifiés',
            value: nonPlanifies,
            icon: '📅',
            color: '#EF4444',
        },
        {
            id: 'non_attribue',
            title: 'Non attribués',
            value: nonAttribues,
            icon: '👤',
            color: '#F97316',
        },
        {
            id: 'en_cours',
            title: 'En cours',
            value: enCours,
            icon: '🔨',
            color: '#EC4899',
        },
        {
            id: 'planifie',
            title: 'Planifiés',
            value: planifies,
            icon: '📅',
            color: '#8B5CF6',
        },
        {
            id: 'a_terminer',
            title: 'À terminer',
            value: aTerminer,
            icon: '⏳',
            color: '#F59E0B',
        },
        {
            id: 'termine',
            title: 'Terminés',
            value: termines,
            icon: '✅',
            color: '#10B981',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {kpis.map((kpi) => (
                <KPICard
                    key={kpi.id ?? 'total'}
                    title={kpi.title}
                    value={kpi.value}
                    icon={kpi.icon}
                    color={kpi.color}
                    isActive={activeFilter === kpi.id}
                    onClick={() =>
                        onFilterChange(activeFilter === kpi.id ? null : kpi.id)
                    }
                />
            ))}
        </div>
    );
}
