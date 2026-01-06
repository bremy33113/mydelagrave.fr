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
    MonitorUp,
    Smartphone,
    AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { useMobileMode } from '../../hooks/useMobileMode';
import { OnlineUsers } from './OnlineUsers';

// Type for Screen Details API (experimental)
interface ScreenDetailed {
    left: number;
    top: number;
    width: number;
    height: number;
    isPrimary: boolean;
    label: string;
}

interface ScreenDetails {
    screens: ScreenDetailed[];
}

interface SidebarProps {
    userEmail?: string;
    userId?: string;
}

export function Sidebar({ userEmail, userId }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [hasMultipleScreens, setHasMultipleScreens] = useState(false);
    const [screenDetails, setScreenDetails] = useState<ScreenDetails | null>(null);
    const [planningWindowRef, setPlanningWindowRef] = useState<Window | null>(null);
    const [isPlanningExternalOpen, setIsPlanningExternalOpen] = useState(false);
    const { isAdmin, isSuperviseur, canViewAllChantiers, isPoseur, role } = useUserRole();
    const { showDevToggle } = useMobileMode();
    const [isMobileWindowOpen, setIsMobileWindowOpen] = useState(false);
    const [mobileWindowRef, setMobileWindowRef] = useState<Window | null>(null);

    // Detect multiple screens
    useEffect(() => {
        const detectScreens = async () => {
            // Try the Window Management API (Chrome 100+)
            if ('getScreenDetails' in window) {
                try {
                    const details = await (window as unknown as { getScreenDetails: () => Promise<ScreenDetails> }).getScreenDetails();
                    setScreenDetails(details);
                    setHasMultipleScreens(details.screens.length > 1);
                } catch {
                    // Permission denied or API not available
                    setHasMultipleScreens(false);
                }
            } else {
                // Fallback: check if screen dimensions suggest multiple monitors
                // This is a heuristic - if available width differs significantly from screen width
                const hasMultiple = window.screen.availWidth !== window.screen.width ||
                    window.screen.availHeight !== window.screen.height;
                setHasMultipleScreens(hasMultiple);
            }
        };

        detectScreens();

        // Listen for screen changes
        if ('onscreenchange' in window) {
            (window as unknown as { onscreenchange: () => void }).onscreenchange = detectScreens;
        }
    }, []);

    // Watch for external planning window closure
    useEffect(() => {
        if (!planningWindowRef) return;

        const checkInterval = setInterval(() => {
            if (planningWindowRef.closed) {
                setIsPlanningExternalOpen(false);
                setPlanningWindowRef(null);
                clearInterval(checkInterval);
            }
        }, 500);

        return () => clearInterval(checkInterval);
    }, [planningWindowRef]);

    // Open Planning on external screen
    const openPlanningOnExternalScreen = async () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const planningUrl = `${baseUrl}#/planning`;

        let left = 0;
        let top = 0;
        let width = 1920;
        let height = 1080;

        // Try to get screen details (this may prompt for permission)
        let details = screenDetails;
        if (!details && 'getScreenDetails' in window) {
            try {
                details = await (window as unknown as { getScreenDetails: () => Promise<ScreenDetails> }).getScreenDetails();
                setScreenDetails(details);
                setHasMultipleScreens(details.screens.length > 1);
            } catch {
                // Permission denied
            }
        }

        // Try to find the secondary screen
        if (details && details.screens.length > 1) {
            // Find the first non-primary screen
            const secondaryScreen = details.screens.find(s => !s.isPrimary) || details.screens[1];
            left = secondaryScreen.left;
            top = secondaryScreen.top;
            width = secondaryScreen.width;
            height = secondaryScreen.height;
        } else {
            // Fallback: position to the right of current screen
            left = window.screen.width;
            top = 0;
            width = window.screen.availWidth;
            height = window.screen.availHeight;
        }

        // Open new window
        const features = `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`;
        const newWindow = window.open(planningUrl, 'PlanningExternalWindow', features);

        if (newWindow) {
            setPlanningWindowRef(newWindow);
            setIsPlanningExternalOpen(true);
        }
    };

    // Watch for mobile window closure
    useEffect(() => {
        if (!mobileWindowRef) return;

        const checkInterval = setInterval(() => {
            if (mobileWindowRef.closed) {
                setIsMobileWindowOpen(false);
                setMobileWindowRef(null);
                clearInterval(checkInterval);
            }
        }, 500);

        return () => clearInterval(checkInterval);
    }, [mobileWindowRef]);

    // Open mobile simulator window (Samsung Galaxy S21 dimensions: 360x800)
    const openMobileSimulator = () => {
        if (mobileWindowRef && !mobileWindowRef.closed) {
            mobileWindowRef.focus();
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname;
        // Route par défaut selon le rôle qu'on simule (chargé d'affaires)
        const mobileUrl = `${baseUrl}#/m/chantiers`;

        // Samsung Galaxy S21 dimensions
        const width = 360;
        const height = 800;

        // Center the window
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const features = `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,resizable=yes`;
        const newWindow = window.open(mobileUrl, 'MobileSimulator', features);

        if (newWindow) {
            setMobileWindowRef(newWindow);
            setIsMobileWindowOpen(true);

            // Force mobile mode in the new window
            newWindow.localStorage.setItem('force_mobile_mode', 'true');
        }
    };

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
                    .filter((item) => !(item.to === '/planning' && isPlanningExternalOpen))
                    .map((item) => (
                        <div key={item.to} className="flex items-center gap-1">
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
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

                            {/* External screen button for Planning */}
                            {item.to === '/planning' && !collapsed && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openPlanningOnExternalScreen();
                                    }}
                                    className={`p-2 rounded-lg transition-all ${
                                        hasMultipleScreens
                                            ? 'text-purple-400 hover:bg-purple-500/20'
                                            : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                                    }`}
                                    title={hasMultipleScreens ? 'Ouvrir sur un autre écran' : 'Ouvrir dans une nouvelle fenêtre'}
                                >
                                    <MonitorUp className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
            </nav>

            {/* Online Users - visible pour superviseurs/admins */}
            {(isSuperviseur || isAdmin) && (
                <OnlineUsers currentUserId={userId || null} collapsed={collapsed} />
            )}

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

                    {/* Toggle mode mobile (dev only) - ouvre simulateur Galaxy */}
                    {showDevToggle && (
                        <button
                            onClick={openMobileSimulator}
                            className={`p-2 rounded-lg transition-all ${
                                isMobileWindowOpen
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                            title={isMobileWindowOpen ? 'Simulateur mobile ouvert' : 'Ouvrir simulateur mobile (Galaxy)'}
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    )}

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
