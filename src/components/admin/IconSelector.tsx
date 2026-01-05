interface IconSelectorProps {
    value: string;
    onChange: (icon: string) => void;
}

const DEFAULT_ICONS = [
    // Personnes & Métiers
    '👤', '👷', '👔', '💼', '📐',
    // Bâtiment & Construction
    '🏗️', '🏠', '🏢', '🏥', '🔨',
    // Documents & Bureau
    '📋', '📄', '📊', '💰', '📝',
    // Outils & Technique
    '🔧', '⚙️', '🛠️', '🔌', '💡',
];

export function IconSelector({ value, onChange }: IconSelectorProps) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-10 gap-1 p-2 bg-slate-800/50 rounded-lg">
                {DEFAULT_ICONS.map((icon) => (
                    <button
                        key={icon}
                        type="button"
                        onClick={() => onChange(icon)}
                        className={`text-xl p-2 rounded-lg transition-all ${
                            value === icon
                                ? 'bg-blue-500/30 ring-2 ring-blue-500'
                                : 'hover:bg-slate-700/50'
                        }`}
                    >
                        {icon}
                    </button>
                ))}
            </div>
            <p className="text-xs text-slate-400">
                Sélectionné: <span className="text-lg">{value || '—'}</span>
            </p>
        </div>
    );
}
