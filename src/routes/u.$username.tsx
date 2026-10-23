import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Avatar, PostCard, Shell } from "@/components/briva";
import { useStore } from "@/lib/store";

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
  const { users, posts, me, ready, logout } = useStore();
  const nav = useNavigate();
  const user = users.find((u) => u.username === username);
  const mine = posts.filter((p) => p.author === username);

  if (!user) return <Shell title="Profile"><p className="p-6 text-center text-muted-foreground">{ready ? "User not found." : "Loading…"}</p></Shell>;

  return (
    <Shell title="Profile">
      <div className="h-24 bg-gradient-brand" />
      <div className="-mt-10 border-b bg-card px-4 pb-4">
        <div className="flex items-end justify-between">
          <div className="rounded-full border-4 border-card"><Avatar user={user} size={80} /></div>
          {me?.username === username && (
            <button onClick={async () => { await logout(); nav({ to: "/", replace: true }); }} className="rounded-full border px-4 py-1.5 text-sm font-semibold">Log out</button>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        <p className="mt-2 text-[15px]">{user.bio}</p>
        <p className="mt-2 text-sm"><b>{mine.length}</b> <span className="text-muted-foreground">posts</span></p>
      </div>
      {mine.length ? mine.map((p) => <PostCard key={p.id} post={p} />) : <p className="p-6 text-center text-muted-foreground">No posts yet.</p>}
    </Shell>
  );
}
