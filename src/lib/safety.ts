import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let blocked = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function loadBlocks() {
  const { data } = await supabase.from("user_blocks").select("blocked_id");
  blocked = new Set((data ?? []).map((b) => b.blocked_id));
  emit();
}
export function useBlocked() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    if (listeners.size === 1) void loadBlocks();
    return () => { listeners.delete(l); };
  }, []);
  return blocked;
}
export async function blockUser(me: string, other: string) {
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: me, blocked_id: other });
  if (!error) await loadBlocks();
  return error?.message ?? null;
}
export async function unblockUser(me: string, other: string) {
  const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", me).eq("blocked_id", other);
  if (!error) await loadBlocks();
  return error?.message ?? null;
}
export async function reportContent(me: string, targetType: "post" | "user" | "reel" | "comment", targetId: string, reason: string) {
  const { error } = await supabase.from("content_reports").insert({ reporter_id: me, target_type: targetType, target_id: targetId, reason: reason.slice(0, 500) });
  return error?.message ?? null;
}
