ALTER TABLE public.profiles ADD COLUMN is_private boolean NOT NULL DEFAULT false;
CREATE TABLE public.friendships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT friendships_different_members CHECK (requester_id <> receiver_id)
);
GRANT SELECT, INSERT, DELETE ON public.friendships TO authenticated;
GRANT UPDATE (status) ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX friendships_unique_pair ON public.friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
CREATE INDEX friendships_receiver_status ON public.friendships (receiver_id, status);
CREATE POLICY "participants read friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, receiver_id));
CREATE POLICY "request own friendship" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND status = 'pending' AND requester_id <> receiver_id);
CREATE POLICY "receiver accepts pending request" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = receiver_id AND status = 'pending') WITH CHECK (auth.uid() = receiver_id AND status = 'accepted');
CREATE POLICY "participants remove friendship" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, receiver_id));
CREATE FUNCTION public.can_view_member_content(_owner uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.profiles p WHERE p.id = _owner AND (
 p.id = auth.uid() OR NOT p.is_private OR EXISTS (
 SELECT 1 FROM public.friendships f WHERE f.status = 'accepted' AND ((f.requester_id = auth.uid() AND f.receiver_id = p.id) OR (f.receiver_id = auth.uid() AND f.requester_id = p.id))
 )))
$$;
REVOKE ALL ON FUNCTION public.can_view_member_content(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_member_content(uuid) TO authenticated, service_role;
CREATE FUNCTION public.can_view_post(_post uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = _post AND public.can_view_member_content(author_id))
$$;
REVOKE ALL ON FUNCTION public.can_view_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO authenticated, service_role;
ALTER POLICY "members read posts" ON public.posts USING (public.can_view_member_content(author_id));
ALTER POLICY "members read likes" ON public.post_likes USING (public.can_view_post(post_id));
ALTER POLICY "members read comments" ON public.comments USING (public.can_view_post(post_id));
ALTER POLICY "like as self" ON public.post_likes WITH CHECK (auth.uid() = user_id AND public.can_view_post(post_id));
ALTER POLICY "comment as self" ON public.comments WITH CHECK (auth.uid() = author_id AND public.can_view_post(post_id));
ALTER POLICY "members read live stories" ON public.stories USING (public.can_view_member_content(user_id) AND (expires_at > now() OR auth.uid() = user_id));
ALTER POLICY "members read post images" ON storage.objects USING (
 bucket_id = 'post-images' AND auth.uid() IS NOT NULL AND (
 (storage.foldername(name))[1] = auth.uid()::text OR
 EXISTS (SELECT 1 FROM public.posts p WHERE p.image_url = name AND public.can_view_member_content(p.author_id)) OR
 EXISTS (SELECT 1 FROM public.stories s WHERE s.image_url = name AND s.expires_at > now() AND public.can_view_member_content(s.user_id))
 ));
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;