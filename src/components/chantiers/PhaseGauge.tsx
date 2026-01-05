interface PhaseGaugeProps {
    consumed: number;
    allocated: number;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export function PhaseGauge({ consumed, allocated, showLabel = true, size = 'md' }: PhaseGaugeProps) {
    if (allocated === 0) {
        return (
            <div className="text-xs text-slate-500 italic">
                Pas de budget défini
            </div>
        );
    }

    const percentage = Math.round((consumed / allocated) * 100);
    const isOver = consumed > allocated;
    const displayPercentage = Math.min(percentage, 100);
    const overPercentage = isOver ? Math.min(((consumed - allocated) / allocated) * 100, 50) : 0;

    const heightClass = size === 'sm' ? 'h-2' : 'h-3';

    return (
        <div className="w-full">
            {/* Progress bar */}
            <div className={`relative ${heightClass} rounded-full bg-slate-700/50 overflow-hidden`}>
                {/* Green portion (up to 100%) */}
                <div
                    className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-300"
                    style={{ width: `${displayPercentage}%` }}
                />

                {/* Red hatched portion (overflow) */}
                {isOver && (
                    <div
                        className="absolute inset-y-0 transition-all duration-300"
                        style={{
                            left: '100%',
                            width: `${overPercentage}%`,
                            transform: 'translateX(-100%)',
                            background: `repeating-linear-gradient(
                                -45deg,
                                #22c55e,
                                #22c55e 4px,
                                #ef4444 4px,
                                #ef4444 8px
                            )`,
                        }}
                    />
                )}
            </div>

            {/* Label */}
            {showLabel && (
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${isOver ? 'text-red-400' : 'text-slate-400'}`}>
                        {consumed}h / {allocated}h
                    </span>
                    <span className={`text-xs font-medium ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                        {percentage}%
                    </span>
                </div>
            )}
        </div>
    );
}
