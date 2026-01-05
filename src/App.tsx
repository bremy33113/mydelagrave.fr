import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { AdminPage } from './pages/AdminPage';
import { TrashPage } from './pages/TrashPage';
import { PlanningPage } from './pages/PlanningPage';
import { MobileChantiersList } from './pages/mobile/MobileChantiersList';
import { MobilePlanning } from './pages/mobile/MobilePlanning';
import { useMobileMode } from './hooks/useMobileMode';
import { useUserRole } from './hooks/useUserRole';

interface User {
    id: string;
    email: string;
}

// Composant pour gérer la redirection mobile
function MobileRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile } = useMobileMode();
    const { isChargeAffaire, isPoseur, loading: roleLoading } = useUserRole();

    useEffect(() => {
        if (roleLoading) return;

        // Si on est en mode mobile et qu'on est sur une route desktop
        if (isMobile && !location.pathname.startsWith('/m/')) {
            if (isChargeAffaire) {
                navigate('/m/chantiers', { replace: true });
            } else if (isPoseur) {
                navigate('/m/planning', { replace: true });
            }
        }

        // Si on est en mode desktop et qu'on est sur une route mobile
        if (!isMobile && location.pathname.startsWith('/m/')) {
            navigate('/', { replace: true });
        }
    }, [isMobile, isChargeAffaire, isPoseur, roleLoading, location.pathname, navigate]);

    return null;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { isMobile } = useMobileMode();

    // Détecter si on est dans la fenêtre simulateur mobile
    const isMobileSimulator = window.name === 'MobileSimulator';

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: User } | null } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-app-bg">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xl text-white animate-pulse">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Mode popup : fenêtre externe Planning sans sidebar
    const isPopupWindow = window.name === 'PlanningExternalWindow';

    if (isPopupWindow) {
        return (
            <div className="h-screen bg-app-bg overflow-hidden">
                <Routes>
                    <Route path="/planning" element={<PlanningPage />} />
                    <Route path="*" element={<Navigate to="/planning" replace />} />
                </Routes>
            </div>
        );
    }

    // Mode mobile : routes dédiées sans sidebar (viewport mobile OU simulateur)
    if (isMobile || isMobileSimulator) {
        return (
            <>
                <MobileRedirect />
                <Routes>
                    <Route path="/login" element={<Navigate to="/m/chantiers" replace />} />
                    <Route path="/m/chantiers" element={<MobileChantiersList />} />
                    <Route path="/m/planning" element={<MobilePlanning />} />
                    {/* Fallback vers la page appropriée selon le rôle */}
                    <Route path="*" element={<MobileChantiersList />} />
                </Routes>
            </>
        );
    }

    // Mode desktop : avec Layout
    return (
        <>
            <MobileRedirect />
            <Layout userEmail={user.email} userId={user.id}>
                <Routes>
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/planning" element={<PlanningPage />} />
                    <Route path="/corbeille" element={<TrashPage />} />
                    {/* Routes mobiles accessibles aussi en desktop pour debug */}
                    <Route path="/m/chantiers" element={<MobileChantiersList />} />
                    <Route path="/m/planning" element={<MobilePlanning />} />
                    <Route path="/*" element={<DashboardPage />} />
                </Routes>
            </Layout>
        </>
    );
}

export default App;
