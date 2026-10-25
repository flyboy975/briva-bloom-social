ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read live stories" ON public.stories FOR SELECT TO authenticated USING (expires_at > now() OR auth.uid() = user_id);
CREATE POLICY "post own story" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own story" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "start own conversation" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "participants touch conversation" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b) WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE OR REPLACE FUNCTION public.is_participant(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations WHERE id = _conv AND (user_a = _user OR user_b = _user))
$$;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text CHECK (text IS NULL OR char_length(text) BETWEEN 1 AND 2000),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CHECK (text IS NOT NULL OR image_url IS NOT NULL)
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() <> sender_id AND public.is_participant(conversation_id, auth.uid())) WITH CHECK (auth.uid() <> sender_id AND public.is_participant(conversation_id, auth.uid()));

CREATE POLICY "members read avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "participants read dm images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'dm-images' AND public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "participants upload dm images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dm-images' AND public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;