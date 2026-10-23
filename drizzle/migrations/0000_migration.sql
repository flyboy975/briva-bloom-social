CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  name text NOT NULL,
  bio text NOT NULL DEFAULT 'New to Briva',
  avatar_color text NOT NULL DEFAULT 'oklch(0.6 0.16 245)',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert own post" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete own post" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes readable" ON public.post_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "like as self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unlike own" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments readable" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comment as self" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete own comment" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base text;
  un text;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
  IF char_length(base) < 3 THEN base := base || 'user'; END IF;
  base := left(base, 14);
  un := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = un) LOOP
    un := base || '_' || floor(random() * 99999)::int;
  END LOOP;
  INSERT INTO public.profiles (id, username, name)
  VALUES (NEW.id, un, left(coalesce(nullif(NEW.raw_user_meta_data->>'name', ''), nullif(NEW.raw_user_meta_data->>'full_name', ''), un), 60));
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, username, name, bio, avatar_color) VALUES
 ('00000000-0000-0000-0000-00000000000a','amani','Amani Otieno','Coffee, code and sunsets ☕','oklch(0.62 0.17 255)'),
 ('00000000-0000-0000-0000-00000000000b','lina','Lina Park','Photographer. Trail runner.','oklch(0.66 0.15 200)'),
 ('00000000-0000-0000-0000-00000000000c','diego','Diego Ruiz','Cooking my way around the world.','oklch(0.58 0.14 280)');
INSERT INTO public.posts (id, author_id, text, image_url, created_at) VALUES
 ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000b','Morning run by the lake. The fog was unreal today 🌫️','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900', now() - interval '25 minutes'),
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-00000000000c','Homemade tacos night. Recipe in the comments if anyone wants it 🌮', NULL, now() - interval '3 hours'),
 ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-00000000000a','Just joined Briva — hello everyone! 👋', NULL, now() - interval '20 hours');
INSERT INTO public.post_likes (post_id, user_id) VALUES
 ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000a'),
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-00000000000a');
INSERT INTO public.comments (post_id, author_id, text) VALUES
 ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000a','Wow, stunning!'),
 ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-00000000000b','Welcome!');

CREATE POLICY "post images public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'post-images');
CREATE POLICY "upload own post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "delete own post images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);