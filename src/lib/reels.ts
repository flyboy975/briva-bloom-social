import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore, signMany } from "@/lib/store";
import { canViewContent } from "@/lib/social-rules";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["reels"]["Row"];
type Comment = Database["public"]["Tables"]["reel_comments"]["Row"];
export type Reel = Row & { url: string; likes: string[]; comments: Comment[] };
export function useReels() {
  const { me, users, friendships } = useStore();
  const [rows, setRows] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = me?.id;
  const reload = useCallback(async () => {
    if (!userId) { setRows([]); setLoading(false); return; }
    const [reels, likes, comments] = await Promise.all([
      supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("reel_likes").select("*"),
      supabase.from("reel_comments").select("*").order("created_at"),
    ]);
    const failure = reels.error || likes.error || comments.error;
    if (failure) { setError("Reels could not load. Try again."); setLoading(false); return; }
    const signed = await signMany("reel-videos", (reels.data ?? []).map((r) => r.video_path));
    setRows((reels.data ?? []).map((r) => ({ ...r, url: signed.get(r.video_path) ?? "", likes: (likes.data ?? []).filter((l) => l.reel_id === r.id).map((l) => l.user_id), comments: (comments.data ?? []).filter((c) => c.reel_id === r.id) })).filter((r) => r.url));
    setLoading(false); setError("");
  }, [userId]);
  useEffect(() => {
    let active = true;
    const refresh = () => { if (active) void reload(); };
    refresh();
    if (!userId) return;
    const channel = supabase.channel(`reels-${userId}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reels" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reel_likes" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reel_comments" }, refresh).subscribe();
    const timer = window.setInterval(refresh, 40_000);
    return () => { active = false; window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [reload, userId]);
  const reels = userId ? rows.filter((r) => { const author = users.find((u) => u.id === r.author_id); return author && canViewContent(userId, author.id, author.isPrivate, friendships); }) : [];
  return { reels, loading, error, reload, setError, toggleLike: async (reel: Reel) => {
    if (!userId) return;
    const result = reel.likes.includes(userId) ? await supabase.from("reel_likes").delete().eq("reel_id", reel.id).eq("user_id", userId) : await supabase.from("reel_likes").insert({ reel_id: reel.id, user_id: userId });
    if (result.error) setError("Your like could not be saved."); else await reload();
  }, comment: async (reelId: string, text: string) => {
    if (!userId || !text.trim()) return false;
    const { error } = await supabase.from("reel_comments").insert({ reel_id: reelId, author_id: userId, text: text.trim() });
    if (error) { setError("Your comment could not be saved."); return false; }
    await reload(); return true;
  } };
}