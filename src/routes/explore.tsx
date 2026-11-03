import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar, PostCard, Shell, inputCls } from "@/components/briva";
import { FriendshipActions } from "@/components/friendship-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { suggestedPeople } from "@/lib/social-rules";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [
    { title: "Explore Briva — People and posts" },
    { name: "description", content: "Discover Briva members and explore posts shared with you." },
    { property: "og:title", content: "Explore Briva — People and posts" },
    { property: "og:description", content: "Find people and discover member posts on Briva." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ExplorePage,
});

function ExplorePage() {
  const { users, posts, me, ready, friendships } = useStore();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const people = q ? users.filter((user) => user.id !== me?.id && `${user.name} ${user.username}`.toLowerCase().includes(q)) : suggestedPeople(users, me?.id ?? null, friendships);
  const foundPosts = posts.filter((post) => !q || `${post.text} ${post.author}`.toLowerCase().includes(q));
  return <Shell title={t("explore")}>
    <h1 className="px-4 pt-5 text-xl font-bold">{t("explore")}</h1>
    {!ready ? <p className="p-6 text-center text-muted-foreground">{t("loading")}</p> : !me ? <div className="p-6 text-center"><p className="text-sm text-muted-foreground">{t("membersOnlyPage")}</p><Link to="/login" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t("loginOrSignup")}</Link></div> : <>
      <div className="relative m-4"><Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" /><input type="search" aria-label={t("searchExplore")} placeholder={t("searchExplore")} className={`${inputCls} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <Tabs defaultValue="people">
        <TabsList className="mx-4 mb-4 grid w-[calc(100%-2rem)] grid-cols-2"><TabsTrigger value="people">{t("people")}</TabsTrigger><TabsTrigger value="posts">{t("posts")}</TabsTrigger></TabsList>
        <TabsContent value="people"><h2 className="px-4 pb-2 text-sm font-semibold">{q ? t("people") : t("peopleYouMayKnow")}</h2>{!people.length && <p className="p-6 text-center text-sm text-muted-foreground">{q ? t("noResults") : t("noPeople")}</p>}{people.map((user) => <article key={user.id} className="space-y-3 border-b bg-card p-4"><Link to="/u/$username" params={{ username: user.username }} className="flex min-w-0 items-center gap-3"><Avatar user={user} size={48} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted-foreground">@{user.username}</p></div></Link><FriendshipActions otherId={user.id} /></article>)}</TabsContent>
        <TabsContent value="posts">{!foundPosts.length && <p className="p-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>}{foundPosts.map((post) => <PostCard key={post.id} post={post} />)}</TabsContent>
      </Tabs>
    </>}
  </Shell>;
}