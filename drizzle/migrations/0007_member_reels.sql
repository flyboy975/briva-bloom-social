CREATE TABLE public.reels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 video_path text NOT NULL,
 caption text NOT NULL DEFAULT '' CHECK (length(caption) <= 1000),
 duration_seconds numeric NOT NULL CHECK (duration_seconds >= 15 AND duration_seconds <= 60),
 sound_reel_id uuid REFERENCES public.reels(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reels TO authenticated;
GRANT ALL ON public.reels TO service_role;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view accessible reels" ON public.reels FOR SELECT TO authenticated USING (public.can_view_member_content(author_id));
CREATE POLICY "create own reel" ON public.reels FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND video_path LIKE auth.uid()::text || '/%' AND (sound_reel_id IS NULL OR EXISTS (SELECT 1 FROM public.reels source WHERE source.id = sound_reel_id AND source.sound_reel_id IS NULL AND public.can_view_member_content(source.author_id))));
CREATE POLICY "delete own reel" ON public.reels FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE TABLE public.reel_likes (
 reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 PRIMARY KEY (reel_id,user_id)
);
GRANT SELECT, INSERT, DELETE ON public.reel_likes TO authenticated;
GRANT ALL ON public.reel_likes TO service_role;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read accessible reel likes" ON public.reel_likes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reels WHERE id = reel_id));
CREATE POLICY "like accessible reel as self" ON public.reel_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reels WHERE id = reel_id));
CREATE POLICY "remove own reel like" ON public.reel_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.reel_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 text text NOT NULL CHECK (length(trim(text)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reel_comments TO authenticated;
GRANT ALL ON public.reel_comments TO service_role;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read accessible reel comments" ON public.reel_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reels WHERE id = reel_id));
CREATE POLICY "comment on accessible reel as self" ON public.reel_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reels WHERE id = reel_id));
CREATE POLICY "remove own reel comment" ON public.reel_comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE INDEX reels_created_at_idx ON public.reels(created_at DESC);
CREATE INDEX reel_comments_reel_id_idx ON public.reel_comments(reel_id);
CREATE POLICY "upload own reel video" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reel-videos' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('mp4','webm','mov'));
CREATE POLICY "read accessible reel video" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'reel-videos' AND ((storage.foldername(name))[1] = auth.uid()::text OR EXISTS (SELECT 1 FROM public.reels WHERE video_path = name AND public.can_view_member_content(author_id))));
CREATE POLICY "remove own reel video" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reel-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels, public.reel_likes, public.reel_comments;