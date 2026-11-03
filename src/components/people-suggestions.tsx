import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/briva";
import { FriendshipActions } from "@/components/friendship-actions";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { suggestedPeople } from "@/lib/social-rules";

export function PeopleSuggestions() {
  const { users, me, ready, friendships } = useStore();
  const { t } = useLanguage();
  const people = suggestedPeople(users, me?.id ?? null, friendships).slice(0, 8);
  if (!ready || !me) return null;
  return <section aria-label={t("peopleYouMayKnow")} className="border-b bg-card py-4">
    <div className="mb-3 flex items-center justify-between gap-3 px-4"><h2 className="text-sm font-semibold">{t("peopleYouMayKnow")}</h2><Link to="/explore" className="shrink-0 text-sm font-semibold text-primary">{t("seeAll")}</Link></div>
    {!people.length ? <p className="px-4 text-sm text-muted-foreground">{t("noPeople")}</p> : <div className="flex gap-3 overflow-x-auto px-4 pb-1">{people.map((user) => <article key={user.id} className="w-44 shrink-0 space-y-3 rounded-lg border p-3">
      <Link to="/u/$username" params={{ username: user.username }} className="flex min-w-0 flex-col items-center gap-2"><Avatar user={user} size={52} /><span className="w-full truncate text-center text-sm font-semibold">{user.name}</span><span className="w-full truncate text-center text-xs text-muted-foreground">@{user.username}</span></Link>
      <FriendshipActions otherId={user.id} />
    </article>)}</div>}
  </section>;
}