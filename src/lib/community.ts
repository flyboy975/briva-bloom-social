import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { groupNameError, joinStatusFor, locationError, priceError, eventDateError, type JoinPolicy } from "@/lib/community-rules";
import type { Database } from "@/integrations/supabase/types";

export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupPost = Database["public"]["Tables"]["group_posts"]["Row"];
export type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
export type CommunityEvent = Database["public"]["Tables"]["events"]["Row"];

function useRealtime(tables: string[], reload: () => void, userId: string | undefined) {
  const tableKey = tables.join(",");
  useEffect(() => {
    if (!userId) return;
    let channel = supabase.channel(`community-${crypto.randomUUID()}`);
    for (const table of tableKey.split(",")) channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, () => reload());
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [reload, userId, tableKey]);
}

export function useGroups() {
  const { me } = useStore();
  const userId = me?.id;
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) { setGroups([]); setMembers([]); setLoading(false); return; }
    const [g, m] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("group_members").select("*"),
    ]);
    if (g.error || m.error) { setError("Groups could not load. Try again."); setLoading(false); return; }
    setGroups(g.data ?? []);
    setMembers(m.data ?? []);
    setLoading(false);
    setError("");
  }, [userId]);

  useEffect(() => { void reload(); }, [reload]);
  useRealtime(["groups", "group_members"], reload, userId);

  const membershipOf = useCallback((groupId: string) => members.find((m) => m.group_id === groupId && m.user_id === userId), [members, userId]);

  return {
    groups, members, loading, error, reload, membershipOf,
    createGroup: async (name: string, description: string, policy: JoinPolicy) => {
      if (!userId) return "Please log in";
      const invalid = groupNameError(name);
      if (invalid) return invalid;
      const { data, error: err } = await supabase.from("groups").insert({ name: name.trim(), description: description.trim(), creator_id: userId, join_policy: policy }).select("id").single();
      if (err) return "Group could not be created. Try again.";
      const admin = await supabase.from("group_members").insert({ group_id: data.id, user_id: userId, role: "admin", status: "approved" });
      if (admin.error) return "Group was created but you could not be added as admin.";
      await reload();
      return null;
    },
    joinGroup: async (group: Group) => {
      if (!userId) return "Please log in";
      if (members.some((m) => m.group_id === group.id && m.user_id === userId)) return "You already joined or requested to join this group.";
      const { error: err } = await supabase.from("group_members").insert({ group_id: group.id, user_id: userId, role: "member", status: joinStatusFor(group.join_policy === "approval" ? "approval" : "open") });
      if (err) return "Could not join this group. Try again.";
      await reload();
      return null;
    },
    approveMember: async (memberId: string) => {
      const { error: err } = await supabase.from("group_members").update({ status: "approved" }).eq("id", memberId);
      if (err) return "Could not approve this member.";
      await reload();
      return null;
    },
    removeMember: async (memberId: string) => {
      const { error: err } = await supabase.from("group_members").delete().eq("id", memberId);
      if (err) return "Could not remove this member.";
      await reload();
      return null;
    },
  };
}

export function useGroupPosts(groupId: string) {
  const { me } = useStore();
  const userId = me?.id;
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) { setPosts([]); setLoading(false); return; }
    const { data, error: err } = await supabase.from("group_posts").select("*").eq("group_id", groupId).order("created_at", { ascending: false }).limit(100);
    if (err) { setPosts([]); setError("Group posts could not load. Try again."); setLoading(false); return; }
    setPosts(data ?? []);
    setLoading(false);
    setError("");
  }, [userId, groupId]);

  useEffect(() => { void reload(); }, [reload]);
  useRealtime(["group_posts"], reload, userId);

  return {
    posts, loading, error, reload,
    addPost: async (text: string) => {
      if (!userId) return "Please log in";
      if (!text.trim()) return "Write something first";
      const { error: err } = await supabase.from("group_posts").insert({ group_id: groupId, author_id: userId, text: text.trim() });
      if (err) return "Your post could not be saved.";
      await reload();
      return null;
    },
  };
}

export function useListings() {
  const { me } = useStore();
  const userId = me?.id;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) { setListings([]); setLoading(false); return; }
    const { data, error: err } = await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false }).limit(200);
    if (err) { setError("Listings could not load. Try again."); setLoading(false); return; }
    setListings(data ?? []);
    setLoading(false);
    setError("");
  }, [userId]);

  useEffect(() => { void reload(); }, [reload]);
  useRealtime(["marketplace_listings"], reload, userId);

  return {
    listings, loading, error, reload,
    createListing: async (input: { title: string; description: string; priceCents: number; currency: string; location: string }) => {
      if (!userId) return "Please log in";
      const invalid = priceError(input.priceCents) ?? locationError(input.location);
      if (invalid) return invalid;
      if (input.title.trim().length < 3) return "Title must be at least 3 characters";
      const { error: err } = await supabase.from("marketplace_listings").insert({
        seller_id: userId, title: input.title.trim(), description: input.description.trim(),
        price_cents: input.priceCents, currency: input.currency.toUpperCase(), location: input.location.trim(),
      });
      if (err) return "Listing could not be saved. Try again.";
      await reload();
      return null;
    },
    setStatus: async (id: string, status: "active" | "sold") => {
      const { error: err } = await supabase.from("marketplace_listings").update({ status }).eq("id", id);
      if (err) return "Could not update this listing.";
      await reload();
      return null;
    },
    removeListing: async (id: string) => {
      const { error: err } = await supabase.from("marketplace_listings").delete().eq("id", id);
      if (err) return "Could not delete this listing.";
      await reload();
      return null;
    },
  };
}

export function useEvents() {
  const { me } = useStore();
  const userId = me?.id;
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) { setEvents([]); setLoading(false); return; }
    const { data, error: err } = await supabase.from("events").select("*").gte("starts_at", new Date(Date.now() - 86_400_000).toISOString()).order("starts_at").limit(200);
    if (err) { setError("Events could not load. Try again."); setLoading(false); return; }
    setEvents(data ?? []);
    setLoading(false);
    setError("");
  }, [userId]);

  useEffect(() => { void reload(); }, [reload]);
  useRealtime(["events"], reload, userId);

  return {
    events, loading, error, reload,
    createEvent: async (input: { title: string; description: string; location: string; startsAt: number }) => {
      if (!userId) return "Please log in";
      const invalid = locationError(input.location) ?? eventDateError(input.startsAt);
      if (invalid) return invalid;
      if (input.title.trim().length < 3) return "Title must be at least 3 characters";
      const { error: err } = await supabase.from("events").insert({
        creator_id: userId, title: input.title.trim(), description: input.description.trim(),
        location: input.location.trim(), starts_at: new Date(input.startsAt).toISOString(),
      });
      if (err) return "Event could not be saved. Try again.";
      await reload();
      return null;
    },
  };
}
