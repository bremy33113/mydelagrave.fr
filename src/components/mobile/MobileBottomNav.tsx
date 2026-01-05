import { Calendar, Clock, User, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
    onFabClick?: () => void;
}

export function MobileBottomNav({ onFabClick }: MobileBottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path: string) => currentPath.startsWith(path);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-2xl border-t border-slate-700/50 pb-8 pt-2">
            <div className="flex justify-around items-center px-4">
                {/* Planning */}
                <button
                    onClick={() => navigate('/m/planning')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/m/planning') ? 'text-sky-400' : 'text-slate-600'}`}
                >
                    <Calendar size={20} strokeWidth={isActive('/m/planning') ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Planning</span>
                </button>

                {/* Pointage */}
                <button
                    onClick={() => navigate('/m/pointage')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/m/pointage') ? 'text-sky-400' : 'text-slate-600'}`}
                >
                    <Clock size={20} strokeWidth={isActive('/m/pointage') ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Pointage</span>
                </button>

                {/* FAB Central */}
                <div className="relative -mt-10">
                    <button
                        onClick={onFabClick}
                        className="w-14 h-14 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-90 border-[6px] border-slate-950"
                    >
                        <Plus size={30} strokeWidth={3} />
                    </button>
                </div>

                {/* Profil */}
                <button
                    onClick={() => navigate('/m/profil')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/m/profil') ? 'text-sky-400' : 'text-slate-600'}`}
                >
                    <User size={20} strokeWidth={isActive('/m/profil') ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Profil</span>
                </button>
            </div>
        </nav>
    );
}
