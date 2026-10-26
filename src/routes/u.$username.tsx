import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Avatar, PostCard, Shell } from "@/components/briva";
import { useStore } from "@/lib/store";
import { useMessaging } from "@/lib/messaging";
import { Button } from "@/components/ui/button";
import { canViewContent, profileViewState } from "@/lib/social-rules";
import { FriendshipActions } from "@/components/friendship-actions";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Briva` },
      { name: "description", content: `See posts from @${params.username} on Briva.` },
      { property: "og:title", content: `@${params.username} on Briva` },
      { property: "og:description", content: `See posts from @${params.username} on Briva.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { username } = Route.useParams();
  const { users, posts, me, ready, logout, setAvatar, setPrivate, friendships } = useStore();
  const { start } = useMessaging();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const user = users.find((u) => u.username === username);
  const mine = posts.filter((p) => p.author === username);

  const view = profileViewState(ready, Boolean(me), Boolean(user));
  if (view === "loading") return <Shell title="Profile"><p className="p-6 text-center text-muted-foreground">Loading…</p></Shell>;
  if (view === "join") return (
    <Shell title="Profile">
      <div className="space-y-4 p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Join Briva</h1>
        <p className="text-sm text-muted-foreground">Profiles and posts are for signed-in members only. Log in or sign up to connect with people on Briva.</p>
        <Button asChild size="lg" className="max-w-full rounded-full">
          <Link to="/login">Log in or sign up</Link>
        </Button>
      </div>
    </Shell>
  );
  if (!user) return <Shell title="Profile"><p className="p-6 text-center text-muted-foreground">User not found.</p></Shell>;
  const isMe = me?.id === user.id;
  const allowed = canViewContent(me?.id ?? null, user.id, user.isPrivate, friendships);
  const pill = "rounded-full border px-4 py-1.5 text-sm font-semibold disabled:opacity-60";

  return (
    <Shell title="Profile">
      <div className="h-24 bg-gradient-brand" />
      <div className="-mt-10 border-b bg-card px-4 pb-4">
        <div className="flex items-end justify-between gap-2">
          <div className="rounded-full border-4 border-card"><Avatar user={user} size={80} /></div>
          {isMe && (
            <div className="flex flex-wrap justify-end gap-2">
              <button disabled={busy} onClick={() => fileRef.current?.click()} className={pill}>{busy ? "Uploading…" : "Change photo"}</button>
              <button onClick={async () => { await logout(); nav({ to: "/", replace: true }); }} className={pill}>Log out</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Profile photo" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                setBusy(true); setErr("");
                const r = await setAvatar(f); if (r) setErr(r);
                setBusy(false); e.target.value = "";
              }} />
            </div>
          )}
          {me && !isMe && (
            <button disabled={busy} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60" onClick={async () => {
              setBusy(true); setErr("");
              try { const id = await start(user.id); if (id) nav({ to: "/messages", search: { conversation: id } }); }
              catch (x) { setErr(x instanceof Error ? x.message : "Could not open chat"); }
              setBusy(false);
            }}>Message</button>
          )}
        </div>
        {err && <p role="alert" className="mt-2 text-sm text-destructive">{err}</p>}
        <h1 className="mt-2 text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        {allowed && <p className="mt-2 text-[15px]">{user.bio}</p>}
        {isMe && <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3"><label htmlFor="private-profile" className="flex items-center gap-2 text-sm font-semibold"><Lock size={16} />Private profile</label><Switch id="private-profile" checked={user.isPrivate} disabled={busy} onCheckedChange={async (value) => { setBusy(true); setErr(""); try { setErr(await setPrivate(value) ?? ""); } catch { setErr("Could not change privacy. Try again."); } finally { setBusy(false); } }} /></div>}
        {!isMe && <div className="mt-4"><FriendshipActions otherId={user.id} /></div>}
        {allowed && <p className="mt-2 text-sm"><b>{mine.length}</b> <span className="text-muted-foreground">posts</span></p>}
      </div>
      {!allowed ? <div className="space-y-4 p-6 text-center"><Lock className="mx-auto text-primary" /><h2 className="text-xl font-bold">This profile is private</h2><p className="text-sm text-muted-foreground">Only accepted friends can see posts and stories.</p><Button asChild variant="outline"><Link to="/login">Log in or sign up</Link></Button></div> : mine.length ? mine.map((p) => <PostCard key={p.id} post={p} />) : <p className="p-6 text-center text-muted-foreground">No posts yet.</p>}
    </Shell>
  );
}
