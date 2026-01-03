import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'superviseur' | 'charge_affaire' | 'poseur' | null;

interface UseUserRoleResult {
    userId: string | null;
    role: UserRole;
    loading: boolean;
    error: string | null;
    isAdmin: boolean;
    isSuperviseur: boolean;
    isChargeAffaire: boolean;
    isPoseur: boolean;
    canManageUsers: boolean;
    canViewAllChantiers: boolean;
}

export function useUserRole(): UseUserRoleResult {
    const [role, setRole] = useState<UserRole>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRole() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    setRole(null);
                    setUserId(null);
                    setLoading(false);
                    return;
                }

                setUserId(user.id);

                const { data, error: queryError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (queryError) {
                    console.error('Error fetching user role:', queryError);
                    setError(queryError.message);
                }

                if (data) {
                    setRole((data as { role: UserRole }).role);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        fetchRole();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            fetchRole();
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        userId,
        role,
        loading,
        error,
        isAdmin: role === 'admin',
        isSuperviseur: role === 'superviseur',
        isChargeAffaire: role === 'charge_affaire',
        isPoseur: role === 'poseur',
        canManageUsers: role === 'admin' || role === 'superviseur',
        canViewAllChantiers: role === 'admin' || role === 'superviseur',
    };
}
