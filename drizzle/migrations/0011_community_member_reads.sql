DROP POLICY IF EXISTS "Members can read groups" ON public.groups;
CREATE POLICY "Members can read groups" ON public.groups FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Members can read memberships" ON public.group_members;
CREATE POLICY "Members can read memberships" ON public.group_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Members can read listings" ON public.marketplace_listings;
CREATE POLICY "Members can read listings" ON public.marketplace_listings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Members can read events" ON public.events;
CREATE POLICY "Members can read events" ON public.events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);