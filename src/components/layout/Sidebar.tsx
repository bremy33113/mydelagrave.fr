import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Contact,
    Trash2,
    LogOut,
    Building2,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';

interface SidebarProps {
    userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { isAdmin, isSuperviseur, canViewAllChantiers, role } = useUserRole();

    const handleLogout = async () => {
        await supabase.auth.signOut();
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
        switch (role) {
            case 'admin':
                return 'bg-red-500/20 text-red-400';
            case 'superviseur':
                return 'bg-purple-500/20 text-purple-400';
            case 'charge_affaire':
                return 'bg-blue-500/20 text-blue-400';
            case 'poseur':
                return 'bg-green-500/20 text-green-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };

    return (
        <aside
            className={`h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-fadeIn">
                            <h1 className="text-lg font-bold text-white">MyDelagrave</h1>
                            <p className="text-xs text-slate-400">Gestion de Chantiers</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems
                    .filter((item) => item.show)
                    .map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="font-medium animate-fadeIn">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-slate-700/50">
                {!collapsed && userEmail && (
                    <div className="mb-3 animate-fadeIn">
                        <p className="text-sm text-white truncate">{userEmail}</p>
                        <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}
                        >
                            {getRoleLabel()}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        {!collapsed && <span className="text-sm">Déconnexion</span>}
                    </button>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
