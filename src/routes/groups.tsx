import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Shell } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useGroups } from "@/lib/community";
import { useLanguage } from "@/lib/i18n";
import { groupNameError, type JoinPolicy } from "@/lib/community-rules";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Briva — Groups" },
      { name: "description", content: "Create and join groups on Briva, post inside them, and grow your community." },
      { property: "og:title", content: "Briva — Groups" },
      { property: "og:description", content: "Create and join groups on Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { me } = useStore();
  const { t } = useLanguage();
  const { groups, members, loading, error, createGroup, joinGroup, membershipOf } = useGroups();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState<JoinPolicy>("open");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <Shell title={t("groups")}>
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h2 className="font-semibold">{t("groups")}</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} />{t("create")}</Button>
      </div>
      {(error || (!open && formError)) && <p role="alert" className="p-4 text-sm text-destructive">{error || formError}</p>}
      {loading && <p className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</p>}
      {!loading && !groups.length && (
        <div className="space-y-3 px-6 py-16 text-center">
          <Users className="mx-auto text-primary" size={36} />
          <h3 className="font-semibold">{t("noGroups")}</h3>
          <p className="text-sm text-muted-foreground">{t("firstGroup")}</p>
        </div>
      )}
      {groups.map((group) => {
        const membership = membershipOf(group.id);
        const count = members.filter((m) => m.group_id === group.id && m.status === "approved").length;
        return (
          <div key={group.id} className="flex items-center gap-3 border-b bg-card px-4 py-4">
            <Link to="/groups/$groupId" params={{ groupId: group.id }} className="min-w-0 flex-1">
              <p className="truncate font-semibold">{group.name}</p>
              <p className="text-xs text-muted-foreground">{count} {t("members")} · {group.join_policy === "open" ? t("openToJoin") : t("adminApproval")}</p>
            </Link>
            {membership?.status === "approved" ? (
              <Button asChild variant="outline" size="sm"><Link to="/groups/$groupId" params={{ groupId: group.id }}>{t("openGroup")}</Link></Button>
            ) : membership?.status === "pending" ? (
              <span className="text-xs font-medium text-muted-foreground">{t("pending")}</span>
            ) : (
              <Button size="sm" variant="secondary" onClick={async () => { const err = await joinGroup(group); if (err) setFormError(err); }}>{t("join")}</Button>
            )}
          </div>
        );
      })}
      <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) setFormError(""); } }}>
        <DialogContent className="rounded-lg">
          <DialogTitle>{t("createGroup")}</DialogTitle>
          <DialogDescription>{t("groupJoinChoice")}</DialogDescription>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const invalid = groupNameError(name);
            if (invalid) { setFormError(invalid); return; }
            setBusy(true);
            const err = await createGroup(name, description, policy);
            setBusy(false);
            if (err) { setFormError(err); return; }
            setOpen(false); setName(""); setDescription(""); setPolicy("open");
          }}>
            <label className="block text-sm font-medium">{t("name")}
              <input aria-label="Group name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            <label className="block text-sm font-medium">{t("description")}
              <textarea aria-label="Group description" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" rows={2} />
            </label>
            <label className="block text-sm font-medium">{t("joining")}
              <select aria-label="Joining rule" value={policy} onChange={(e) => setPolicy(e.target.value === "approval" ? "approval" : "open")} className="mt-2 w-full rounded-lg border bg-background p-3">
                <option value="open">{t("joinInstantly")}</option>
                <option value="approval">{t("adminsApprove")}</option>
              </select>
            </label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? t("creating") : t("create")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
