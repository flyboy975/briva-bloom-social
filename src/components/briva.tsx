import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, PlusSquare, User as UserIcon, LogIn } from "lucide-react";
import { useState, type ReactNode } from "react";
import { timeAgo, useStore, type Post, type User } from "@/lib/store";

export function Avatar({ user, size = 40 }: { user?: User | undefined; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-primary-foreground"
      style={{ width: size, height: size, background: user?.avatarColor ?? "var(--primary)", fontSize: size * 0.4 }}
    >
      {(user?.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function Shell({ children, title }: { children: ReactNode; title?: string }) {
  const { me } = useStore();
  const nav = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground";
  const active = { className: `${nav} !text-primary` };
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-primary">briva</Link>
        {title && <span className="text-sm font-semibold text-muted-foreground">{title}</span>}
      </header>
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t bg-card pb-[env(safe-area-inset-bottom)]">
        <Link to="/" className={nav} activeProps={active} activeOptions={{ exact: true }}><Home size={22} />Home</Link>
        <Link to="/create" className={nav} activeProps={active}><PlusSquare size={22} />Post</Link>
        {me ? (
          <Link to="/u/$username" params={{ username: me.username }} className={nav} activeProps={active}><UserIcon size={22} />Profile</Link>
        ) : (
          <Link to="/login" className={nav} activeProps={active}><LogIn size={22} />Log in</Link>
        )}
      </nav>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { users, me, toggleLike, addComment } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const author = users.find((u) => u.username === post.author);
  const liked = !!me && post.likes.includes(me.username);
  const needAuth = () => navigate({ to: "/login" });

  return (
    <article className="border-b bg-card px-4 py-4">
      <Link to="/u/$username" params={{ username: post.author }} className="flex items-center gap-3">
        <Avatar user={author} />
        <div>
          <div className="text-sm font-semibold">{author?.name}</div>
          <div className="text-xs text-muted-foreground">@{post.author} · {timeAgo(post.createdAt)}</div>
        </div>
      </Link>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>
      {post.image && <img src={post.image} alt="" className="mt-3 w-full rounded-xl object-cover" loading="lazy" />}
      <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
        <button onClick={() => (me ? toggleLike(post.id) : needAuth())} className={`flex items-center gap-1.5 ${liked ? "text-primary" : ""}`} aria-label="Like">
          <Heart size={20} fill={liked ? "currentColor" : "none"} /> {post.likes.length}
        </button>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5" aria-label="Comments">
          <MessageCircle size={20} /> {post.comments.length}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {post.comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-secondary px-3 py-2 text-sm">
              <span className="font-semibold">@{c.author}</span> {c.text}
            </div>
          ))}
          {me ? (
            <form onSubmit={(e) => { e.preventDefault(); addComment(post.id, text); setText(""); }} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary" />
              <button className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Send</button>
            </form>
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary">Log in to comment</Link>
          )}
        </div>
      )}
    </article>
  );
}

export const inputCls = "w-full rounded-xl border bg-background px-4 py-3 text-[15px] outline-none focus:border-primary";
export const btnCls = "w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-brand active:scale-[0.99] disabled:opacity-50";
