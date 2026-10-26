import { createFileRoute, Link } from "@tanstack/react-router";
import { PostCard, Shell, Avatar } from "@/components/briva";
import { useStore } from "@/lib/store";
import { StoriesBar } from "@/components/stories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Briva — Home feed" },
      { name: "description", content: "Briva is a friendly social network for everyone. See what people are sharing." },
      { property: "og:title", content: "Briva — Home feed" },
      { property: "og:description", content: "A friendly social network for everyone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { posts, me, ready } = useStore();
  return (
    <Shell>
      <StoriesBar />
      <Link to={me ? "/create" : "/login"} className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Avatar user={me ?? undefined} size={36} />
        <span className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
          {me ? `What's on your mind, ${me.name.split(" ")[0]}?` : "Join Briva to share your moments"}
        </span>
      </Link>
      {!ready && <p className="p-6 text-center text-sm text-muted-foreground">Loading posts…</p>}
      {ready && !me && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Posts on Briva are for members only. Log in or sign up to see what people are sharing.</p>
          <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Log in or sign up</Link>
        </div>
      )}
      {ready && me && !posts.length && <p className="p-6 text-center text-sm text-muted-foreground">No posts yet. Be the first!</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </Shell>
  );
}
