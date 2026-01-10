import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Menu,
    X,
    LayoutDashboard,
    Users,
    Contact,
    Trash2,
    LogOut,
    Building2,
    CalendarDays,
    AlertTriangle,
    Bell,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { ROLE_COLORS_SIMPLE } from '../../lib/constants';
import { OnlineUsers } from './OnlineUsers';

interface FloatingBurgerMenuProps {
    userEmail?: string;
    userId?: string;
}

export function FloatingBurgerMenu({ userEmail, userId }: FloatingBurgerMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isAdmin, isSuperviseur, canViewAllChantiers, isPoseur, role } = useUserRole();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleTestNotification = async () => {
        // Vérifier si les notifications sont supportées
        if (!('Notification' in window)) {
            alert('Les notifications ne sont pas supportées par ce navigateur.');
            return;
        }

        // Demander la permission si nécessaire
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Permission de notification refusée.');
                return;
            }
        }

        if (Notification.permission === 'denied') {
            alert('Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.');
            return;
        }

        // Envoyer la notification de test
        new Notification('MyDelagrave - Test', {
            body: 'Les notifications fonctionnent correctement !',
            icon: '/favicon.ico',
            tag: 'test-notification',
        });
    };

    const navItems = [
        {
            to: '/',
            icon: LayoutDashboard,
            label: 'Dashboard',
            show: true,
        },
        {
            to: '/planning',
            icon: CalendarDays,
            label: 'Planning',
            show: canViewAllChantiers,
        },
        {
            to: '/contacts',
            icon: Contact,
            label: 'Contacts',
            show: true,
        },
        {
            to: '/reserves',
            icon: AlertTriangle,
            label: 'Réserves',
            show: !isPoseur,
        },
        {
            to: '/admin',
            icon: Users,
            label: 'Administration',
            show: isAdmin || isSuperviseur,
        },
        {
            to: '/corbeille',
            icon: Trash2,
            label: 'Corbeille',
            show: true,
        },
    ];

    const getRoleLabel = () => {
        switch (role) {
            case 'admin':
                return 'Administrateur';
            case 'superviseur':
                return 'Superviseur';
            case 'charge_affaire':
                return "Chargé d'Affaires";
            case 'poseur':
                return 'Poseur';
            default:
                return '';
        }
    };

    const getRoleColor = () => {
        return ROLE_COLORS_SIMPLE[role as keyof typeof ROLE_COLORS_SIMPLE] || 'bg-slate-500/20 text-slate-400';
    };

    return (
        <>
            {/* Bouton burger flottant */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-white hover:bg-slate-800 transition-all shadow-lg"
                data-testid="btn-burger-menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu panel */}
            <aside
                className={`fixed top-0 left-0 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col z-50 transform transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                data-testid="burger-menu-panel"
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50 mt-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">MyDelagrave</h1>
                            <p className="text-xs text-slate-400">Gestion de Chantiers</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-auto">
                    {navItems
                        .filter((item) => item.show)
                        .map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                </nav>

                {/* Online Users */}
                {(isSuperviseur || isAdmin) && (
                    <OnlineUsers currentUserId={userId || null} collapsed={false} />
                )}

                {/* User section */}
                <div className="p-4 border-t border-slate-700/50">
                    {userEmail && (
                        <div className="mb-3">
                            <p className="text-sm text-white truncate">{userEmail}</p>
                            <span
                                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}
                            >
                                {getRoleLabel()}
                            </span>
                        </div>
                    )}

                    {/* Bouton test notification */}
                    <button
                        onClick={handleTestNotification}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-all"
                        data-testid="btn-test-notification"
                    >
                        <Bell className="w-4 h-4" />
                        <span className="text-sm">Test Notification</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
