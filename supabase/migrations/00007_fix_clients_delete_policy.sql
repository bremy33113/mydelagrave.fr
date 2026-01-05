-- Fix: Allow supervisors to delete clients
DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients
    FOR DELETE USING (public.is_supervisor_or_admin());
