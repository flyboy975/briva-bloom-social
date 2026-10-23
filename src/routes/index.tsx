import { createFileRoute, Link } from "@tanstack/react-router";
import { PostCard, Shell, Avatar } from "@/components/briva";
import { useStore } from "@/lib/store";

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
  const { posts, me } = useStore();
  return (
    <Shell>
      <Link to={me ? "/create" : "/login"} className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Avatar user={me ?? undefined} size={36} />
        <span className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
          {me ? `What's on your mind, ${me.name.split(" ")[0]}?` : "Join Briva to share your moments"}
        </span>
      </Link>
      <p className="border-b bg-accent px-4 py-2 text-xs text-accent-foreground">
        Demo mode: sample posts plus your posts, likes, comments and demo accounts are saved only in this browser. They survive a refresh here but are not shared with other people or devices.
      </p>
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </Shell>
  );
}
