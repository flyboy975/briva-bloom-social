import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signMany, useStore } from "@/lib/store";
import { conversationPair, imageError, unreadMessages } from "@/lib/social-rules";

export type Conversation = { id: string; user_a: string; user_b: string; last_message_at: string };
export type Message = { id: string; conversationId: string; senderId: string; text: string | null; image?: string; createdAt: string; readAt: string | null };
type Messaging = {
  conversations: Conversation[]; messages: Message[]; unread: number; error: string;
  start: (userId: string) => Promise<string>;
  send: (conversationId: string, text: string, file?: File) => Promise<void>;
  markRead: (conversationId: string) => Promise<void>;
};
const MessagingContext = createContext<Messaging | null>(null);
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { me } = useStore();
  const id = me?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const identity = useRef(id);
  identity.current = id;
  const load = useCallback(async () => {
    if (!id) { setConversations([]); setMessages([]); setError(""); return; }
    const [convs, msgs] = await Promise.all([
      supabase.from("conversations").select("*").order("last_message_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at"),
    ]);
    if (identity.current !== id) return;
    if (convs.error || msgs.error) { setError("Messages could not load. Please try again."); return; }
    const signed = await signMany("dm-images", (msgs.data ?? []).flatMap((m) => m.image_url ? [m.image_url] : []));
    if (identity.current !== id) return;
    setConversations(convs.data ?? []);
    setMessages((msgs.data ?? []).map((m) => ({ id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, text: m.text, image: m.image_url ? signed.get(m.image_url) : undefined, createdAt: m.created_at, readAt: m.read_at })));
    setError("");
  }, [id]);
  useEffect(() => {
    void load();
    if (!id) return;
    const channel = supabase.channel(`briva-dms-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => void load())
      .subscribe();
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => { void supabase.removeChannel(channel); window.removeEventListener("focus", focus); };
  }, [id, load]);
  const start = async (userId: string) => {
    if (!id) throw new Error("Please log in");
    const pair = conversationPair(id, userId);
    const existing = await supabase.from("conversations").select("id").eq("user_a", pair.user_a).eq("user_b", pair.user_b).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data.id;
    const created = await supabase.from("conversations").insert(pair).select("id").single();
    if (created.error) {
      if (created.error.code === "23505") {
        const retry = await supabase.from("conversations").select("id").eq("user_a", pair.user_a).eq("user_b", pair.user_b).single();
        if (retry.data) return retry.data.id;
      }
      throw created.error;
    }
    await load();
    return created.data.id;
  };
  const send = async (conversationId: string, text: string, file?: File) => {
    if (!id) throw new Error("Please log in");
    if (!text.trim() && !file) return;
    let image_url: string | null = null;
    if (file) {
      const invalid = imageError(file);
      if (invalid) throw new Error(invalid);
      const path = `${conversationId}/${id}/${crypto.randomUUID()}`;
      const uploaded = await supabase.storage.from("dm-images").upload(path, file, { contentType: file.type });
      if (uploaded.error) throw uploaded.error;
      image_url = path;
    }
    const result = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: id, text: text.trim() || null, image_url });
    if (result.error) throw result.error;
    await load();
  };
  const markRead = useCallback(async (conversationId: string) => {
    if (!id) return;
    const result = await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", conversationId).neq("sender_id", id).is("read_at", null);
    if (result.error) { setError("Could not mark messages as read."); return; }
    await load();
  }, [id, load]);
  return <MessagingContext.Provider value={{ conversations, messages, unread: id ? unreadMessages(messages, id).length : 0, error, start, send, markRead }}>{children}</MessagingContext.Provider>;
}
export function useMessaging() {
  const value = useContext(MessagingContext);
  if (!value) throw new Error("Messaging provider is missing");
  return value;
}