REVOKE UPDATE (role) ON public.group_members FROM authenticated;
REVOKE UPDATE ON public.group_members FROM authenticated;
GRANT UPDATE (status) ON public.group_members TO authenticated;
DROP POLICY "Admins can manage memberships" ON public.group_members;
CREATE POLICY "Admins can approve pending members" ON public.group_members FOR UPDATE TO authenticated USING (status = 'pending' AND role = 'member' AND public.is_group_admin(group_id, auth.uid())) WITH CHECK (status = 'approved' AND role = 'member' AND public.is_group_admin(group_id, auth.uid()));