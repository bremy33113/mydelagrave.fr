import { Calendar, Clock, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function MobileBottomNav() {
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
