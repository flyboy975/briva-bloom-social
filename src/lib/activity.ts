import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isMemberActive } from "@/lib/activity-rules";

export function useMemberActivity(memberId: string | null) {
  const [enabled, setEnabled] = useState(false);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    if (!memberId) return;
    const { data, error } = await supabase.from("member_activity").select("user_id,enabled,last_seen_at");
    if (error) { setActiveIds([]); return; }
    setEnabled(data?.find((row) => row.user_id === memberId)?.enabled ?? false);
    setActiveIds((data ?? []).filter((row) => isMemberActive(row.enabled, row.last_seen_at, Date.now())).map((row) => row.user_id));
  }, [memberId]);
  useEffect(() => {
    setEnabled(false); setActiveIds([]);
    if (!memberId) return;
    let stopped = false;
    const beat = async () => {
      await supabase.rpc("record_member_activity", { is_active: document.visibilityState === "visible" });
      if (!stopped) await refresh();
    };
    void beat();
    const interval = window.setInterval(() => void beat(), 30_000);
    document.addEventListener("visibilitychange", beat);
    return () => { stopped = true; window.clearInterval(interval); document.removeEventListener("visibilitychange", beat); };
  }, [memberId, refresh]);
  const setActiveStatus = async (next: boolean): Promise<string | null> => {
    if (!memberId) return "Please log in";
    const { error } = await supabase.from("member_activity").upsert({ user_id: memberId, enabled: next }, { onConflict: "user_id" });
    if (error) return "Could not save active status. Try again.";
    setEnabled(next);
    if (!next) setActiveIds((ids) => ids.filter((id) => id !== memberId));
    await supabase.rpc("record_member_activity", { is_active: document.visibilityState === "visible" });
    await refresh();
    return null;
  };
  return { activeStatus: enabled, activeUserIds: memberId ? activeIds : [], setActiveStatus };
}