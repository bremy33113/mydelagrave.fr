import { KPICard } from './KPICard';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'> & {
    phases_chantiers?: Tables<'phases_chantiers'>[] | null;
};

interface KPIBarProps {
    chantiers: Chantier[];
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
}

export function KPIBar({ chantiers, activeFilter, onFilterChange }: KPIBarProps) {
    // Calculer les KPIs
    const total = chantiers.length;
    const nouveaux = chantiers.filter((c) => c.statut === 'nouveau').length;
    const nonPlanifies = chantiers.filter((c) => !c.phases_chantiers || c.phases_chantiers.length === 0).length;
    const nonAttribues = chantiers.filter(
        (c) => !c.poseur_id && c.statut !== 'termine'
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
            testId: 'kpi-total',
        },
        {
            id: 'nouveau',
            title: 'Nouveaux',
            value: nouveaux,
            icon: '🆕',
            color: '#3B82F6',
            testId: 'kpi-nouveaux',
        },
        {
            id: 'non_planifie',
            title: 'Non planifiés',
            value: nonPlanifies,
            icon: '📅',
            color: '#EF4444',
            testId: 'kpi-non-planifies',
        },
        {
            id: 'non_attribue',
            title: 'Non attribués',
            value: nonAttribues,
            icon: '👤',
            color: '#F97316',
            testId: 'kpi-non-attribues',
        },
        {
            id: 'en_cours',
            title: 'En cours',
            value: enCours,
            icon: '🔨',
            color: '#EC4899',
            testId: 'kpi-en-cours',
        },
        {
            id: 'planifie',
            title: 'Planifiés',
            value: planifies,
            icon: '📅',
            color: '#8B5CF6',
            testId: 'kpi-planifies',
        },
        {
            id: 'a_terminer',
            title: 'À terminer',
            value: aTerminer,
            icon: '⏳',
            color: '#F59E0B',
            testId: 'kpi-a-terminer',
        },
        {
            id: 'termine',
            title: 'Terminés',
            value: termines,
            icon: '✅',
            color: '#10B981',
            testId: 'kpi-termines',
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
                    testId={kpi.testId}
                    onClick={() =>
                        onFilterChange(activeFilter === kpi.id ? null : kpi.id)
                    }
                />
            ))}
        </div>
    );
}
