import { Link } from "@tanstack/react-router";
import { Compass, Home, PlusSquare, UserRound, Clapperboard, UserPlus, Send, Users, Store, CalendarDays, Heart, MessageCircle, Settings } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore, timeAgo, type User, type Post } from "@/lib/store";
import { useMessaging } from "@/lib/messaging";
import { useLanguage } from "@/lib/i18n";
import { pendingRequests, suggestedPeople } from "@/lib/social-rules";
import { FriendshipActions } from "@/components/friendship-actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function Avatar({ user, size = 40 }: { user?: User | undefined; size?: number }) {
  const [failed, setFailed] = useState<string | undefined>();
  const { me, activeUserIds } = useStore();
  const { t } = useLanguage();
  const online = Boolean(me && user && activeUserIds.includes(user.id));
  return <span className="relative inline-flex shrink-0">
    <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-primary">
    {user?.avatarUrl && failed !== user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" onError={() => setFailed(user.avatarUrl)} /> : (user?.name?.[0] ?? "B").toUpperCase()}
    </span>
    {online && <span role="status" aria-label={t("activeNow")} title={t("activeNow")} className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-online" />}
  </span>;
}

const nav = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground";
const active = { className: `${nav} text-primary font-semibold` };
export const inputCls = "w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60";

export function Shell({ children, title, wide }: { children: ReactNode; title?: string; wide?: boolean }) {
  const { me, users, friendships } = useStore();
  const { unread } = useMessaging();
  const { t } = useLanguage();
  const requests = me ? pendingRequests(friendships, me.id) : [];
  const friends = me ? friendships.filter((f) => f.status === "accepted" && (f.requester_id === me.id || f.receiver_id === me.id)).map((f) => users.find((u) => u.id === (f.requester_id === me.id ? f.receiver_id : f.requester_id))).filter((u): u is NonNullable<typeof u> => Boolean(u)) : [];
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = me && q ? users.filter((u) => u.id !== me.id && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))).slice(0, 8) : [];
  const suggestions = suggestedPeople(users, me?.id ?? null, friendships).slice(0, 8);
  const iconLink = "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground";
  return <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-background">
    <header className="sticky top-0 z-20 border-b bg-card pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-1 px-3 py-2">
        <Link to="/" className="shrink-0 text-2xl font-extrabold text-primary">briva</Link>
        <div className="flex min-w-0 items-center gap-0.5">
          <Link to="/explore" aria-label={t("explore")} title={t("explore")} className={iconLink} activeProps={{ className: `${iconLink} text-primary` }}><Compass size={20} /></Link>
          <Link to="/groups" aria-label={t("groups")} title={t("groups")} className={iconLink} activeProps={{ className: `${iconLink} text-primary` }}><Users size={20} /></Link>
          <Link to="/marketplace" aria-label={t("market")} title={t("market")} className={iconLink} activeProps={{ className: `${iconLink} text-primary` }}><Store size={20} /></Link>
          <Link to="/events" aria-label={t("events")} title={t("events")} className={iconLink} activeProps={{ className: `${iconLink} text-primary` }}><CalendarDays size={20} /></Link>
          {me && <Link to="/settings" aria-label={t("settings")} title={t("settings")} className={iconLink} activeProps={{ className: `${iconLink} text-primary` }}><Settings size={20} /></Link>}
          {me && <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label={t("friends")} title={t("friends")} className="relative h-9 w-9 shrink-0"><UserPlus size={20} />{requests.length > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{requests.length}</span>}</Button></PopoverTrigger>
            <PopoverContent align="end" className="max-h-[75dvh] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto">
              <h2 className="mb-2 font-semibold">Find people</h2>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className={inputCls} />
              {q && !found.length && <p className="pt-2 text-sm text-muted-foreground">No members found</p>}
              {found.map((user) => <div key={user.id} className="space-y-2 border-b py-3"><Link to="/u/$username" params={{ username: user.username }} className="flex min-w-0 items-center gap-2"><Avatar user={user} size={32} /><span className="truncate font-semibold">{user.name}</span></Link><FriendshipActions otherId={user.id} /></div>)}
              {!q && <section aria-label={t("peopleYouMayKnow")} className="mt-4 border-t pt-3"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{t("peopleYouMayKnow")}</h2><Link to="/explore" className="shrink-0 text-xs font-semibold text-primary">{t("seeAll")}</Link></div>{!suggestions.length && <p className="pt-2 text-sm text-muted-foreground">{t("noPeople")}</p>}{suggestions.map((user) => <div key={user.id} className="space-y-2 border-b py-3"><Link to="/u/$username" params={{ username: user.username }} className="flex min-w-0 items-center gap-2"><Avatar user={user} size={32} /><span className="truncate font-semibold">{user.name}</span></Link><FriendshipActions otherId={user.id} /></div>)}</section>}
              <h2 className="mb-3 mt-4 border-t pt-3 font-semibold">{t("friendRequests")} ({requests.length})</h2>{!requests.length && <p className="text-sm text-muted-foreground">{t("noRequests")}</p>}{requests.map((r) => { const user = users.find((u) => u.id === r.requester_id); return <div key={r.id} className="space-y-2 border-t py-3"><div className="flex items-center gap-2"><Avatar user={user} size={32} />{user && <Link to="/u/$username" params={{ username: user.username }} className="truncate font-semibold">{user.name}</Link>}</div><FriendshipActions otherId={r.requester_id} /></div>; })}
              <h2 className="mb-3 mt-4 border-t pt-3 font-semibold">{t("friends")} ({friends.length})</h2>{!friends.length && <p className="text-sm text-muted-foreground">{t("noFriends")}</p>}{friends.map((user) => <Link key={user.id} to="/u/$username" params={{ username: user.username }} className="flex items-center gap-2 py-2"><Avatar user={user} size={32} /><span className="truncate font-semibold">{user.name}</span></Link>)}</PopoverContent>
          </Popover>}
        </div>
      </div>
    </header>
    <main aria-label={title} className={wide ? "w-full min-w-0 flex-1" : "mx-auto w-full min-w-0 max-w-[600px] flex-1"}>{children}</main>
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 flex border-t bg-card px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <Link to="/" className={nav} activeProps={active} activeOptions={{ exact: true }}><Home size={22} />{t("home")}</Link>
      <Link to="/reels" className={nav} activeProps={active}><Clapperboard size={22} />{t("reels")}</Link>
      <Link to="/create" className={nav} activeProps={active}><PlusSquare size={22} />{t("post")}</Link>
      <Link to="/messages" className={`${nav} relative`} activeProps={{ className: `${nav} relative text-primary font-semibold` }}><Send size={22} />{t("messages")}{unread > 0 && <span className="absolute right-[calc(50%-18px)] top-0 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread}</span>}</Link>
      {me ? <Link to="/u/$username" params={{ username: me.username }} className={nav} activeProps={active}><UserRound size={22} />{t("profile")}</Link> : <Link to="/login" className={nav} activeProps={active}><UserRound size={22} />{t("login")}</Link>}
    </nav>
  </div>;
}

export function PostCard({ post }: { post: Post }) {
  const { users, me, toggleLike, addComment } = useStore();
  const { t } = useLanguage();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const author = users.find((u) => u.username === post.author);
  if (!me) return null;
  const liked = post.likes.includes(me.username);
  return <article className="border-b bg-card">
    <div className="flex items-center gap-3 px-4 py-3"><Avatar user={author} /> <div className="min-w-0">{author && <Link to="/u/$username" params={{ username: author.username }} className="block truncate text-sm font-semibold">{author.name}</Link>}<p className="text-xs text-muted-foreground">@{post.author} · {timeAgo(post.createdAt)}</p></div></div>
    {post.text && <p className="whitespace-pre-wrap break-words px-4 pb-3 text-sm">{post.text}</p>}
    {post.image && <img src={post.image} alt="Post photo" className="max-h-[600px] w-full object-contain" />}
    <div className="flex gap-3 px-3 py-2"><Button variant="ghost" size="sm" aria-pressed={liked} onClick={() => void toggleLike(post.id)} className={liked ? "text-primary" : "text-muted-foreground"}><Heart className={liked ? "fill-current" : ""} />{post.likes.length} {t("like")}</Button><Button variant="ghost" size="sm" aria-expanded={commentsOpen} onClick={() => setCommentsOpen(!commentsOpen)}><MessageCircle />{post.comments.length} {t("comment")}</Button></div>
    {commentsOpen && <div className="space-y-3 border-t p-4">{post.comments.map((c) => <div key={c.id} className="flex gap-2"><Avatar user={users.find((u) => u.username === c.author)} size={28} /><div className="min-w-0 text-sm"><b>{c.author}</b><p className="whitespace-pre-wrap break-words">{c.text}</p></div></div>)}<form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!text.trim() || busy) return; setBusy(true); try { await addComment(post.id, text); setText(""); } finally { setBusy(false); } }}><input aria-label={t("writeComment")} placeholder={t("writeComment")} value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" /><Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label={t("send")}><Send size={18} /></Button></form></div>}
  </article>;
}