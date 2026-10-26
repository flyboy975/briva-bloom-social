import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { imageError } from "@/lib/social-rules";

export type User = { id: string; username: string; name: string; bio: string; avatarColor: string; avatarUrl?: string | undefined };
export type Story = { id: string; userId: string; image: string; createdAt: number; expiresAt: number };
export type Comment = { id: string; author: string; text: string };
export type Post = {
  id: string;
  author: string;
  text: string;
  image?: string | undefined;
  createdAt: number;
  likes: string[];
  comments: Comment[];
};

type Ctx = {
  users: User[];
  posts: Post[];
  stories: Story[];
  me: User | null;
  ready: boolean;
  signup: (u: { name: string; username: string; email: string; password: string }) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addPost: (text: string, image?: File | undefined) => Promise<string | null>;
  toggleLike: (id: string) => Promise<void>;
  addComment: (id: string, text: string) => Promise<void>;
  setAvatar: (file: File) => Promise<string | null>;
  addStory: (file: File) => Promise<string | null>;
};

const StoreCtx = createContext<Ctx | null>(null);
const BUCKET = "post-images";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [pr, po, li, co, st] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("post_likes").select("post_id,user_id"),
      supabase.from("comments").select("*").order("created_at"),
      supabase.from("stories").select("*").gt("expires_at", new Date().toISOString()).order("created_at"),
    ]);
    const avPaths = (pr.data ?? []).map((p) => p.avatar_url).filter((u): u is string => !!u);
    const avSigned = await signMany("avatars", avPaths);
    const us: User[] = (pr.data ?? []).map((p) => ({ id: p.id, username: p.username, name: p.name, bio: p.bio, avatarColor: p.avatar_color, avatarUrl: p.avatar_url ? avSigned.get(p.avatar_url) : undefined }));
    const byId = new Map(us.map((u) => [u.id, u.username]));
    const paths = [...(po.data ?? []).map((p) => p.image_url), ...(st.data ?? []).map((s) => s.image_url)].filter((u): u is string => !!u && !u.startsWith("http"));
    const signed = await signMany(BUCKET, paths);
    setUsers(us);
    setStories((st.data ?? []).map((s) => ({ id: s.id, userId: s.user_id, image: signed.get(s.image_url) ?? s.image_url, createdAt: new Date(s.created_at).getTime(), expiresAt: new Date(s.expires_at).getTime() })).filter((s) => s.image.startsWith("http")));
    setPosts((po.data ?? []).map((p) => ({
      id: p.id,
      author: byId.get(p.author_id) ?? "unknown",
      text: p.text,
      image: p.image_url ? (p.image_url.startsWith("http") ? p.image_url : signed.get(p.image_url)) : undefined,
      createdAt: new Date(p.created_at).getTime(),
      likes: (li.data ?? []).filter((l) => l.post_id === p.id).map((l) => byId.get(l.user_id) ?? ""),
      comments: (co.data ?? []).filter((c) => c.post_id === p.id).map((c) => ({ id: c.id, author: byId.get(c.author_id) ?? "unknown", text: c.text })),
    })));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setMeId(session?.user.id ?? null);
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "SIGNED_OUT") void load();
    });
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
    load().finally(() => setReady(true));
    const channel = supabase
      .channel(`briva-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void load())
      .subscribe();
    return () => { sub.subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [load]);

  const me = users.find((u) => u.id === meId) ?? null;

  const value: Ctx = {
    users, posts, stories, me, ready,
    signup: async ({ name, username, email, password }) => {
      const un = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(un)) return "Username: 3–20 letters, numbers or _";
      if (users.some((u) => u.username === un)) return "That username is taken";
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin, data: { username: un, name: name.trim() } },
      });
      return error ? error.message : null;
    },
    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? error.message : null;
    },
    logout: async () => { await supabase.auth.signOut(); },
    addPost: async (text, file) => {
      if (!me) return "Please log in";
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (up.error) return `Photo upload failed: ${up.error.message}`;
        image_url = path;
      }
      const { error } = await supabase.from("posts").insert({ author_id: me.id, text, image_url });
      if (error) return error.message;
      await load();
      return null;
    },
    toggleLike: async (id) => {
      if (!me) return;
      const liked = posts.find((p) => p.id === id)?.likes.includes(me.username);
      setPosts((ps) => ps.map((p) => p.id !== id ? p : { ...p, likes: liked ? p.likes.filter((l) => l !== me.username) : [...p.likes, me.username] }));
      if (liked) await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", me.id);
      else await supabase.from("post_likes").insert({ post_id: id, user_id: me.id });
      await load();
    },
    addComment: async (id, text) => {
      if (!me || !text.trim()) return;
      await supabase.from("comments").insert({ post_id: id, author_id: me.id, text: text.trim() });
      await load();
    },
    setAvatar: async (file) => {
      if (!me) return "Please log in";
      const invalid = imageError(file);
      if (invalid) return invalid;
      const path = `${me.id}/${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
      const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (up.error) return up.error.message;
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", me.id);
      if (error) return error.message;
      await load();
      return null;
    },
    addStory: async (file) => {
      if (!me) return "Please log in";
      const invalid = imageError(file);
      if (invalid) return invalid;
      const path = `${me.id}/story-${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) return up.error.message;
      const { error } = await supabase.from("stories").insert({ user_id: me.id, image_url: path });
      if (error) return error.message;
      await load();
      return null;
    },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export function timeAgo(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export async function signMany(bucket: string, paths: string[]) {
  const out = new Map<string, string>();
  const uniq = [...new Set(paths)];
  if (!uniq.length) return out;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(uniq, 60 * 60 * 24);
  data?.forEach((d) => { if (d.path && d.signedUrl) out.set(d.path, d.signedUrl); });
  return out;
}
