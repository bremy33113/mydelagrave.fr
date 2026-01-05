import { useState, useEffect } from 'react';
import { X, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (job: Tables<'ref_job'>) => void;
    initialLabel?: string;
}

// Emojis prédéfinis pour les métiers/fonctions
const JOB_EMOJIS = [
    '👔', '💼', '👷', '📐', '🔧', '📋', '👤', '🏗️', '📊', '💰',
    '🎯', '📝', '🔨', '⚙️', '🛠️', '📦', '🚚', '🏠', '🔌', '💡',
];

// Couleurs prédéfinies
const JOB_COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
];

// Génère un code à partir du label
function generateCode(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retire accents
        .replace(/[^a-z0-9]+/g, '_')     // Remplace espaces/spéciaux par _
        .replace(/^_|_$/g, '');          // Retire _ au début/fin
}

export function CreateJobModal({
    isOpen,
    onClose,
    onSuccess,
    initialLabel = '',
}: CreateJobModalProps) {
    const [loading, setLoading] = useState(false);
    const [label, setLabel] = useState(initialLabel);
    const [code, setCode] = useState('');
    const [icon, setIcon] = useState('👤');
    const [color, setColor] = useState('#3B82F6');

    // Réinitialiser le formulaire quand la modal s'ouvre
    useEffect(() => {
        if (isOpen) {
            setLabel(initialLabel);
            setCode(generateCode(initialLabel));
            setIcon('👤');
            setColor('#3B82F6');
        }
    }, [isOpen, initialLabel]);

    // Mettre à jour le code quand le label change
    useEffect(() => {
        setCode(generateCode(label));
    }, [label]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!label.trim()) {
            alert('Le label est obligatoire');
            return;
        }

        if (!code.trim()) {
            alert('Le code est obligatoire');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('ref_job')
                .insert([{
                    code,
                    label: label.trim(),
                    icon,
                    color,
                }])
                .select()
                .single();

            if (error) {
                if (error.message.includes('duplicate') || error.message.includes('unique')) {
                    throw new Error('Ce code de fonction existe déjà');
                }
                throw new Error(error.message);
            }

            if (data) {
                onSuccess(data as Tables<'ref_job'>);
                onClose();
            }
        } catch (err) {
            console.error('Erreur création fonction:', err);
            alert('Erreur: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="glass-card w-full max-w-md p-6 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        Nouvelle fonction
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Label */}
                    <div>
                        <label className="input-label">
                            Label *
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Ex: Chef de projet"
                            className="input-field"
                            autoFocus
                            data-testid="job-label-input"
                        />
                    </div>

                    {/* Code (auto-généré) */}
                    <div>
                        <label className="input-label">
                            Code (auto-généré)
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="chef_de_projet"
                            className="input-field font-mono text-sm"
                            data-testid="job-code-input"
                        />
                    </div>

                    {/* Icône */}
                    <div>
                        <label className="input-label">
                            Icône
                        </label>
                        <div className="grid grid-cols-10 gap-1 p-3 bg-slate-800/50 rounded-lg" data-testid="job-emoji-grid">
                            {JOB_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={`text-xl p-2 rounded-lg transition-all ${
                                        icon === emoji
                                            ? 'bg-blue-500/30 ring-2 ring-blue-500'
                                            : 'hover:bg-slate-700/50'
                                    }`}
                                    data-testid={`job-emoji-${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                            Sélectionné: <span className="text-lg">{icon}</span>
                        </p>
                    </div>

                    {/* Couleur */}
                    <div>
                        <label className="input-label">
                            Couleur
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 p-2 bg-slate-800/50 rounded-lg flex-1" data-testid="job-color-grid">
                                {JOB_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-7 h-7 rounded-lg transition-all ${
                                            color === c
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                                                : 'hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: c }}
                                        data-testid={`job-color-${c}`}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                title="Couleur personnalisée"
                            />
                        </div>
                    </div>

                    {/* Prévisualisation */}
                    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2">Prévisualisation :</p>
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                                style={{ backgroundColor: color + '20', color: color }}
                            >
                                {icon} {label || 'Label...'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                            disabled={loading || !label.trim()}
                            data-testid="job-submit-button"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                'Créer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
