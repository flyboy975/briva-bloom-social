CREATE TABLE public.member_activity (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz
);
GRANT SELECT ON public.member_activity TO authenticated;
GRANT INSERT (user_id, enabled), UPDATE (enabled) ON public.member_activity TO authenticated;
GRANT ALL ON public.member_activity TO service_role;
ALTER TABLE public.member_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see visible activity or own setting" ON public.member_activity FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND (enabled OR user_id = auth.uid()));
CREATE POLICY "Members create own activity setting" ON public.member_activity FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members change own activity setting" ON public.member_activity FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE FUNCTION public.record_member_activity(is_active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO public.member_activity(user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.member_activity SET last_seen_at = CASE WHEN enabled AND is_active THEN now() ELSE NULL END WHERE user_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.record_member_activity(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_member_activity(boolean) TO authenticated;
CREATE FUNCTION public.clear_hidden_member_activity() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT NEW.enabled THEN NEW.last_seen_at := NULL; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER clear_hidden_member_activity BEFORE UPDATE ON public.member_activity FOR EACH ROW EXECUTE FUNCTION public.clear_hidden_member_activity();