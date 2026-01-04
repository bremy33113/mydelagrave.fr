import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { AdminPage } from './pages/AdminPage';
import { TrashPage } from './pages/TrashPage';
import { PlanningPage } from './pages/PlanningPage';

interface User {
    id: string;
    email: string;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    // Mode normal : avec Layout
    return (
        <Layout userEmail={user.email}>
            <Routes>
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/corbeille" element={<TrashPage />} />
                <Route path="/*" element={<DashboardPage />} />
            </Routes>
        </Layout>
    );
}

export default App;
