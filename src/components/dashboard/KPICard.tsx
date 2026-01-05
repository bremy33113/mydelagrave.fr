interface KPICardProps {
    title: string;
    value: number;
    icon: string;
    color: string;
    onClick?: () => void;
    isActive?: boolean;
    testId?: string;
}

export function KPICard({ title, value, icon, color, onClick, isActive, testId }: KPICardProps) {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className={`glass-card glass-hover p-4 text-left transition-all duration-300 ${isActive
                    ? 'ring-2 ring-offset-2 ring-offset-app-bg'
                    : 'hover:scale-[1.02]'
                }`}
            style={{
                borderColor: isActive ? color : undefined,
                boxShadow: isActive ? `0 0 20px ${color}30` : undefined,
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span
                    className="text-3xl font-bold"
                    style={{ color }}
                >
                    {value}
                </span>
            </div>
            <p className="text-sm text-slate-400">{title}</p>
        </button>
    );
}
