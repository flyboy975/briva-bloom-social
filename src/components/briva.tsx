import { Link } from "@tanstack/react-router";
import { Home, PlusSquare, UserRound, Clapperboard, UserPlus, Send, Users, Store, CalendarDays, Heart, MessageCircle, Languages } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore, timeAgo, type User, type Post } from "@/lib/store";
import { useMessaging } from "@/lib/messaging";
import { useLanguage, LANGS } from "@/lib/i18n";
import { pendingRequests } from "@/lib/social-rules";
import { FriendshipActions } from "@/components/friendship-actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Avatar({ user, size = 40 }: { user?: User | undefined; size?: number }) {
  const [failed, setFailed] = useState<string | undefined>();
  return <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-primary">
    {user?.avatarUrl && failed !== user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" onError={() => setFailed(user.avatarUrl)} /> : (user?.name?.[0] ?? "B").toUpperCase()}
  </span>;
}

const nav = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground";
const active = { className: `${nav} text-primary font-semibold` };
export const inputCls = "w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60";

export function Shell({ children, title, wide }: { children: ReactNode; title?: string; wide?: boolean }) {
  const { me, users, friendships } = useStore();
  const { unread } = useMessaging();
  const { lang, setLang, t } = useLanguage();
  const requests = me ? pendingRequests(friendships, me.id) : [];
  const friends = me ? friendships.filter((f) => f.status === "accepted" && (f.requester_id === me.id || f.receiver_id === me.id)).map((f) => users.find((u) => u.id === (f.requester_id === me.id ? f.receiver_id : f.requester_id))).filter((u): u is NonNullable<typeof u> => Boolean(u)) : [];
  return <div className="flex min-h-dvh flex-col bg-background">
    <header className="sticky top-0 z-20 border-b bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-3xl font-extrabold text-primary">briva</Link>
        <div className="flex items-center gap-1">
          <Select value={lang} onValueChange={(value) => { if (value === "en" || value === "sw" || value === "sheng") setLang(value); }}>
            <SelectTrigger aria-label={t("language")} className="w-[120px]"><Languages size={16} /><SelectValue /></SelectTrigger>
            <SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
          <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label={t("friendRequests")} title={t("friendRequests")} className="relative"><Bell size={22} />{requests.length > 0 && <span className="absolute right-0 top-0 rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{requests.length}</span>}</Button></PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)]"><h2 className="mb-3 font-semibold">{t("friendRequests")}</h2>{!requests.length && <p className="text-sm text-muted-foreground">{t("noRequests")}</p>}{requests.map((r) => { const user = users.find((u) => u.id === r.requester_id); return <div key={r.id} className="space-y-2 border-t py-3"><div className="flex items-center gap-2"><Avatar user={user} size={32} />{user && <Link to="/u/$username" params={{ username: user.username }} className="truncate font-semibold">{user.name}</Link>}</div><FriendshipActions otherId={r.requester_id} /></div>; })}</PopoverContent>
          </Popover>
          <Button asChild variant="ghost" size="icon" className="relative"><Link to="/messages" aria-label={t("messages")} title={t("messages")}><Send size={22} />{unread > 0 && <span className="absolute right-0 top-0 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread}</span>}</Link></Button>
        </div>
      </div>
      <div className="mx-auto flex max-w-[600px] border-t text-sm">
        <Link to="/groups" className="flex flex-1 items-center justify-center gap-2 py-2 text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}><Users size={17} />{t("groups")}</Link>
        <Link to="/marketplace" className="flex flex-1 items-center justify-center gap-2 py-2 text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}><Store size={17} />{t("market")}</Link>
        <Link to="/events" className="flex flex-1 items-center justify-center gap-2 py-2 text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}><CalendarDays size={17} />{t("events")}</Link>
      </div>
    </header>
    <main aria-label={title} className={wide ? "w-full flex-1" : "mx-auto w-full max-w-[600px] flex-1"}>{children}</main>
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 flex border-t bg-card px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <Link to="/" className={nav} activeProps={active} activeOptions={{ exact: true }}><Home size={22} />{t("home")}</Link>
      <Link to="/reels" className={nav} activeProps={active}><Clapperboard size={22} />{t("reels")}</Link>
      <Link to="/create" className={nav} activeProps={active}><PlusSquare size={22} />{t("post")}</Link>
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