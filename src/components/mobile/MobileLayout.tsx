import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Building2, Monitor } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMobileMode } from '../../hooks/useMobileMode';

interface MobileLayoutProps {
    children: ReactNode;
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    userEmail?: string;
}

export function MobileLayout({ children, title, showBack, onBack, userEmail }: MobileLayoutProps) {
    const navigate = useNavigate();
    const { forceMobile, toggleForceMobile, showDevToggle } = useMobileMode();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-app-bg flex flex-col">
            {/* Header fixe */}
            <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {showBack ? (
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-400" />
                            </button>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {userEmail && (
                            <span className="text-xs text-slate-400 truncate max-w-[100px] hidden sm:block">
                                {userEmail.split('@')[0]}
                            </span>
                        )}

                        {/* Toggle vers mode desktop (dev only) */}
                        {showDevToggle && forceMobile && (
                            <button
                                onClick={toggleForceMobile}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="Revenir en mode desktop"
                            >
                                <Monitor className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Déconnexion"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenu scrollable */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
