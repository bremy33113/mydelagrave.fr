import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Monitor, User, Maximize, Minimize } from 'lucide-react';
import { useMobileMode } from '../../hooks/useMobileMode';
import { MobileBottomNav } from './MobileBottomNav';

interface MobileLayoutProps {
    children: ReactNode;
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    showBottomNav?: boolean;
    subtitle?: string;
}

export function MobileLayout({
    children,
    title,
    showBack,
    onBack,
    showBottomNav = false,
    subtitle
}: MobileLayoutProps) {
    const navigate = useNavigate();
    const { forceMobile, toggleForceMobile, showDevToggle } = useMobileMode();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Détecter si on est en plein écran
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        // Vérifier l'état initial
        setIsFullscreen(!!document.fullscreenElement);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen non supporté:', err);
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
            {/* Header style Gemini Canvas */}
            <header className="sticky top-0 z-40 bg-slate-900/40 backdrop-blur-md border-b border-slate-700/50 p-4 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {showBack ? (
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl bg-slate-800/50"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center font-black text-white">
                                D
                            </div>
                        )}
                        <div>
                            <h1 className="font-black text-sm tracking-tight uppercase">{title}</h1>
                            {subtitle && (
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Bouton plein écran */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-slate-800/50 text-slate-400"
                            title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>

                        {/* Toggle vers mode desktop (dev only) */}
                        {showDevToggle && forceMobile && (
                            <button
                                onClick={toggleForceMobile}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400"
                                title="Revenir en mode desktop"
                            >
                                <Monitor className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/m/profil')}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner"
                        >
                            <User size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenu scrollable */}
            <main className={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-28' : ''}`}>
                {children}
            </main>

            {/* Bottom Navigation */}
            {showBottomNav && <MobileBottomNav />}
        </div>
    );
}
