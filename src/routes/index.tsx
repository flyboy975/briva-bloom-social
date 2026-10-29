import { createFileRoute, Link } from "@tanstack/react-router";
import { PostCard, Shell, Avatar } from "@/components/briva";
import { useStore } from "@/lib/store";
import { StoriesBar } from "@/components/stories";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReelsFeed } from "@/components/reels-feed";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { view?: "reels" | undefined; reel?: string | undefined } => ({ view: search['view'] === "reels" ? "reels" : undefined, reel: typeof search['reel'] === "string" ? search['reel'] : undefined }),
  head: () => ({
    meta: [
      { title: "Briva — Home feed and Reels" },
      { name: "description", content: "Briva is a friendly social network for everyone. See what people are sharing." },
      { property: "og:title", content: "Briva — Home feed and Reels" },
      { property: "og:description", content: "A friendly social network for everyone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { posts, me, ready } = useStore();
  const { t } = useLanguage();
  const { view, reel } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Shell>
      <Tabs value={view === "reels" ? "reels" : "posts"} onValueChange={(value) => void navigate({ search: value === "reels" ? { view: "reels" } : {} })} className="border-b bg-card px-4 py-2"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="posts">{t("posts")}</TabsTrigger><TabsTrigger value="reels">{t("reels")}</TabsTrigger></TabsList></Tabs>
      {view === "reels" ? <ReelsFeed target={reel} /> : <>
      <StoriesBar />
      <Link to={me ? "/create" : "/login"} className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Avatar user={me ?? undefined} size={36} />
        <span className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
          {me ? `${t("feedPrompt")}, ${me.name.split(" ")[0]}?` : t("feedJoin")}
        </span>
      </Link>
      {!ready && <p className="p-6 text-center text-sm text-muted-foreground">{t("loadingPosts")}</p>}
      {ready && !me && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("membersOnly")}</p>
          <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t("loginOrSignup")}</Link>
        </div>
      )}
      {ready && me && !posts.length && <p className="p-6 text-center text-sm text-muted-foreground">{t("noPosts")}</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </>}
    </Shell>
  );
}
