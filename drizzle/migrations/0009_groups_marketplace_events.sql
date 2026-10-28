CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  description TEXT NOT NULL DEFAULT '',
  creator_id UUID NOT NULL,
  join_policy TEXT NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open','approval')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can update their groups" ON public.groups FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can delete their groups" ON public.groups FOR DELETE TO authenticated USING (creator_id = auth.uid());

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT UPDATE (status, role) ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin' AND status = 'approved')
$$;
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id AND status = 'approved')
$$;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;

CREATE POLICY "Members can read memberships" ON public.group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND (
    (role = 'admin' AND status = 'approved' AND EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.creator_id = auth.uid()))
    OR (role = 'member' AND (status = 'pending' OR (status = 'approved' AND EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.join_policy = 'open'))))
  )
);
CREATE POLICY "Admins can manage memberships" ON public.group_members FOR UPDATE TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Members can leave and admins can remove" ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.group_posts TO authenticated;
GRANT ALL ON public.group_posts TO service_role;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved members can read group posts" ON public.group_posts FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Approved members can post in groups" ON public.group_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Authors and admins can delete group posts" ON public.group_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'KES' CHECK (char_length(currency) = 3),
  location TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 80),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.marketplace_listings TO authenticated;
GRANT UPDATE (status) ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read listings" ON public.marketplace_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can create listings" ON public.marketplace_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update listing status" ON public.marketplace_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can delete listings" ON public.marketplace_listings FOR DELETE TO authenticated USING (seller_id = auth.uid());

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 80),
  starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can update events" ON public.events FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can delete events" ON public.events FOR DELETE TO authenticated USING (creator_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;