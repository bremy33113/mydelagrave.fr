interface ColorSelectorProps {
    value: string;
    onChange: (color: string) => void;
}

const DEFAULT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#64748B', // slate
];

export function ColorSelector({ value, onChange }: ColorSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-1 p-2 bg-slate-800/50 rounded-lg flex-1">
                {DEFAULT_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`w-7 h-7 rounded-lg transition-all ${
                            value === color
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                                : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
            <input
                type="color"
                value={value || '#3B82F6'}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                title="Couleur personnalisée"
            />
        </div>
    );
}
