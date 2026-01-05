import { ReactNode } from 'react';

interface MobileGlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function MobileGlassCard({ children, className = '', onClick }: MobileGlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
        >
            {children}
        </div>
    );
}
