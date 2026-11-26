DROP POLICY IF EXISTS "Members can read memberships" ON public.group_members;
CREATE POLICY "Read own or shared group memberships" ON public.group_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()) OR public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "members read avatars" ON storage.objects;
CREATE POLICY "members read current avatars" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (owner_id = (select auth.uid()::text) OR (storage.foldername(name))[1] = (select auth.uid()::text) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = storage.objects.name)));