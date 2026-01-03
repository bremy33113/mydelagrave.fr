import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger',
    loading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            Icon: Trash2,
        },
        warning: {
            iconBg: 'bg-yellow-500/20',
            iconColor: 'text-yellow-400',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
            Icon: AlertTriangle,
        },
        info: {
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            Icon: AlertTriangle,
        },
    };

    const style = variantStyles[variant];
    const IconComponent = style.Icon;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="glass-card w-full max-w-md p-6 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-6 h-6 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${style.buttonBg} disabled:opacity-50`}
                                disabled={loading}
                            >
                                {loading ? 'Suppression...' : confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
