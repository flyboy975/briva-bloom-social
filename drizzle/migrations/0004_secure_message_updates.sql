REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
REVOKE UPDATE ON public.conversations FROM authenticated;
CREATE OR REPLACE FUNCTION public.touch_message_conversation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id; RETURN NEW; END $$;
CREATE TRIGGER touch_conversation_after_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_message_conversation();
CREATE OR REPLACE FUNCTION public.enforce_story_lifetime() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.created_at := now(); NEW.expires_at := NEW.created_at + interval '24 hours'; RETURN NEW; END $$;
CREATE TRIGGER story_lifetime BEFORE INSERT ON public.stories FOR EACH ROW EXECUTE FUNCTION public.enforce_story_lifetime();
REVOKE EXECUTE ON FUNCTION public.is_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_participant(uuid, uuid) TO authenticated, service_role;