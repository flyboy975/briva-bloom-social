import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, Shell } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { useStore, timeAgo } from "@/lib/store";
import { useGroups, useGroupPosts } from "@/lib/community";
import { useLanguage } from "@/lib/i18n";
import { canApproveMembers, canPostInGroup } from "@/lib/community-rules";

export const Route = createFileRoute("/groups_/$groupId")({
  head: () => ({
    meta: [
      { title: "Briva — Group" },
      { name: "description", content: "A group on Briva." },
      { property: "og:title", content: "Briva — Group" },
      { property: "og:description", content: "A group on Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GroupPage,
});

function GroupPage() {
  const { t } = useLanguage();
  const { groupId } = Route.useParams();
  const { me, users } = useStore();
  const { groups, members, loading, joinGroup, approveMember, removeMember, membershipOf } = useGroups();
  const { posts, loading: postsLoading, error: postsError, addPost } = useGroupPosts(groupId);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const group = groups.find((g) => g.id === groupId);
  const membership = membershipOf(groupId);
  const groupMembers = members.filter((m) => m.group_id === groupId && m.status === "approved");
  const pending = members.filter((m) => m.group_id === groupId && m.status === "pending");

  if (!me) {
    return (
      <Shell>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("membersOnlyPage")}</p>
          <Button asChild className="mt-4"><Link to="/login">{t("loginOrSignup")}</Link></Button>
        </div>
      </Shell>
    );
  }

  if (!loading && !group) {
    return (
      <Shell>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("groupMissing")}</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/groups">{t("allGroups")}</Link></Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={group?.name ?? "Group"}>
      {group && (
        <div className="border-b bg-card px-4 py-4">
          <h2 className="text-lg font-bold">{group.name}</h2>
          {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{groupMembers.length} {t("members")} · {group.join_policy === "open" ? t("openToJoin") : t("adminApproval")}</p>
          {!membership && (
            <Button size="sm" className="mt-3" onClick={async () => { const err = await joinGroup(group); if (err) setError(err); }}>
              {group.join_policy === "open" ? t("joinGroup") : t("requestJoin")}
            </Button>
          )}
          {membership?.status === "pending" && <p className="mt-3 text-sm text-muted-foreground">{t("awaitingApproval")}</p>}
        </div>
      )}
      {(error || postsError) && <p role="alert" className="p-4 text-sm text-destructive">{error || postsError}</p>}

      {canApproveMembers(membership) && pending.length > 0 && (
        <div className="border-b bg-card px-4 py-3">
          <h3 className="text-sm font-semibold">{t("pendingRequests")} ({pending.length})</h3>
          {pending.map((request) => {
            const person = users.find((u) => u.id === request.user_id);
            return (
              <div key={request.id} className="mt-3 flex items-center gap-2">
                <Avatar user={person} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{person?.name ?? t("member")}</span>
                <Button size="sm" onClick={async () => { const err = await approveMember(request.id); if (err) setError(err); }}>{t("approve")}</Button>
                <Button size="sm" variant="outline" onClick={async () => { const err = await removeMember(request.id); if (err) setError(err); }}>{t("decline")}</Button>
              </div>
            );
          })}
        </div>
      )}

      {canPostInGroup(membership) ? (
        <>
          <form className="flex gap-2 border-b bg-card px-4 py-3" onSubmit={async (e) => {
            e.preventDefault();
            const err = await addPost(text);
            if (err) { setError(err); return; }
            setText("");
          }}>
            <input aria-label={t("groupPost")} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={t("shareGroup")} className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2 text-sm" />
            <Button type="submit" size="sm" disabled={!text.trim()}>{t("post")}</Button>
          </form>
          {postsLoading && <p className="p-6 text-center text-sm text-muted-foreground">{t("loadingPosts")}</p>}
          {!postsLoading && !posts.length && <p className="p-6 text-center text-sm text-muted-foreground">{t("noGroupPosts")}</p>}
          {posts.map((post) => {
            const author = users.find((u) => u.id === post.author_id);
            return (
              <article key={post.id} className="border-b bg-card px-4 py-4">
                <div className="flex items-center gap-2">
                  <Avatar user={author} size={32} />
                  <div>
                    <p className="text-sm font-semibold">{author?.name ?? t("member")}</p>
                    <p className="text-xs text-muted-foreground">@{author?.username ?? "member"} · {timeAgo(new Date(post.created_at).getTime())}</p>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px]">{post.text}</p>
              </article>
            );
          })}
        </>
      ) : (
        membership?.status !== "pending" && group && (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("joinForPosts")}</p>
        )
      )}
    </Shell>
  );
}
