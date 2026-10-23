import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = { username: string; name: string; bio: string; avatarColor: string };
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

const now = Date.now();
const seedUsers: User[] = [
  { username: "amani", name: "Amani Otieno", bio: "Coffee, code and sunsets ☕", avatarColor: "oklch(0.62 0.17 255)" },
  { username: "lina", name: "Lina Park", bio: "Photographer. Trail runner.", avatarColor: "oklch(0.66 0.15 200)" },
  { username: "diego", name: "Diego Ruiz", bio: "Cooking my way around the world.", avatarColor: "oklch(0.58 0.14 280)" },
];
const seedPosts: Post[] = [
  { id: "p1", author: "lina", text: "Morning run by the lake. The fog was unreal today 🌫️", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900", createdAt: now - 1000 * 60 * 25, likes: ["amani"], comments: [{ id: "c1", author: "amani", text: "Wow, stunning!" }] },
  { id: "p2", author: "diego", text: "Homemade tacos night. Recipe in the comments if anyone wants it 🌮", createdAt: now - 1000 * 60 * 60 * 3, likes: ["lina", "amani"], comments: [] },
  { id: "p3", author: "amani", text: "Just joined Briva — hello everyone! 👋", createdAt: now - 1000 * 60 * 60 * 20, likes: [], comments: [{ id: "c2", author: "lina", text: "Welcome!" }] },
];

type Ctx = {
  users: User[];
  posts: Post[];
  me: User | null;
  signup: (u: { name: string; username: string }) => string | null;
  login: (username: string) => string | null;
  logout: () => void;
  addPost: (text: string, image?: string | undefined) => void;
  toggleLike: (id: string) => void;
  addComment: (id: string, text: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);
const KEY = "briva-state-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState(seedUsers);
  const [posts, setPosts] = useState(seedPosts);
  const [meName, setMeName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) { setUsers(s.users); setPosts(s.posts); setMeName(s.meName); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ users, posts, meName })); } catch { console.warn("Briva: browser storage full, latest change not saved"); }
  }, [users, posts, meName, loaded]);

  const me = users.find((u) => u.username === meName) ?? null;
  const value: Ctx = {
    users, posts, me,
    signup: ({ name, username }) => {
      const un = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(un)) return "Username: 3–20 letters, numbers or _";
      if (users.some((u) => u.username === un)) return "That username is taken";
      setUsers([...users, { username: un, name: name.trim() || un, bio: "New to Briva", avatarColor: "oklch(0.6 0.16 245)" }]);
      setMeName(un);
      return null;
    },
    login: (username) => {
      const un = username.trim().toLowerCase();
      if (!users.some((u) => u.username === un)) return "No account with that username";
      setMeName(un);
      return null;
    },
    logout: () => setMeName(null),
    addPost: (text, image) => {
      if (!me) return;
      setPosts([{ id: crypto.randomUUID(), author: me.username, text, image, createdAt: Date.now(), likes: [], comments: [] }, ...posts]);
    },
    toggleLike: (id) => {
      if (!me) return;
      setPosts(posts.map((p) => p.id !== id ? p : { ...p, likes: p.likes.includes(me.username) ? p.likes.filter((l) => l !== me.username) : [...p.likes, me.username] }));
    },
    addComment: (id, text) => {
      if (!me || !text.trim()) return;
      setPosts(posts.map((p) => p.id !== id ? p : { ...p, comments: [...p.comments, { id: crypto.randomUUID(), author: me.username, text: text.trim() }] }));
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
