import { supabase } from '../../lib/supabase';

interface ChantierStatusTimelineProps {
    chantierId: string;
    currentStatus: string;
    onStatusChange?: (newStatus: string) => void;
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
}: ChantierStatusTimelineProps) {
    const currentIndex = STATUSES.findIndex(s => s.code === currentStatus);

    const handleStatusClick = async (statusCode: string) => {
        if (statusCode === currentStatus) return;

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

                    return (
                        <button
                            key={status.code}
                            onClick={() => handleStatusClick(status.code)}
                            className="relative z-10 flex flex-col items-center gap-1 transition-all duration-300 group cursor-pointer"
                            title={`Passer en "${status.label}"`}
                        >
                            {/* Point */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                                    isCurrent
                                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 ring-4 ring-blue-500/30 scale-110 shadow-lg shadow-blue-500/30'
                                        : isPast
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md'
                                        : 'bg-slate-700 hover:bg-slate-600 hover:scale-105'
                                } ${isFuture ? 'group-hover:ring-2 group-hover:ring-slate-500' : ''}`}
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
