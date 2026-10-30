import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { Avatar, Shell } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useEvents } from "@/lib/community";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Briva — Events" },
      { name: "description", content: "Discover local events worldwide on Briva, filtered by location." },
      { property: "og:title", content: "Briva — Events" },
      { property: "og:description", content: "Discover local events worldwide on Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { me, users } = useStore();
  const { t } = useLanguage();
  const { events, loading, error, createEvent } = useEvents();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
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

  const shown = filter.trim()
    ? events.filter((event) => event.location.toLowerCase().includes(filter.trim().toLowerCase()))
    : events;

  return (
    <Shell title={t("events")}>
      <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-3">
        <h2 className="font-semibold">{t("events")}</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} />{t("addEvent")}</Button>
      </div>
      <div className="border-b bg-card px-4 py-2">
        <input aria-label={t("filterLocation")} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("filterPlaceholder")} className="w-full rounded-full border bg-background px-4 py-2 text-sm" />
      </div>
      {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
      {loading && <p className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</p>}
      {!loading && !shown.length && (
        <div className="space-y-3 px-6 py-16 text-center">
          <CalendarDays className="mx-auto text-primary" size={36} />
          <h3 className="font-semibold">{filter ? t("noAreaEvents") : t("noEvents")}</h3>
          <p className="text-sm text-muted-foreground">{t("eventPrompt")}</p>
        </div>
      )}
      {shown.map((event) => {
        const creator = users.find((u) => u.id === event.creator_id);
        const start = new Date(event.starts_at);
        return (
          <article key={event.id} className="border-b bg-card px-4 py-4">
            <p className="font-semibold">{event.title}</p>
            <p className="mt-1 text-sm font-medium text-primary">{start.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} />{event.location}</p>
            {event.description && <p className="mt-2 whitespace-pre-wrap text-sm">{event.description}</p>}
            <Link to="/u/$username" params={{ username: creator?.username ?? "unknown" }} className="mt-2 flex items-center gap-2">
              <Avatar user={creator} size={24} />
              <span className="text-xs font-medium">@{creator?.username ?? "member"}</span>
            </Link>
          </article>
        );
      })}
      <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) setFormError(""); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg">
          <DialogTitle>{t("addAnEvent")}</DialogTitle>
          <DialogDescription>{t("worldEvents")}</DialogDescription>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            const err = await createEvent({ title, description, location, startsAt: new Date(startsAt).getTime() });
            setBusy(false);
            if (err) { setFormError(err); return; }
            setOpen(false); setTitle(""); setDescription(""); setLocation(""); setStartsAt("");
          }}>
            <label className="block text-sm font-medium">{t("title")}
              <input aria-label="Event title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            <label className="block text-sm font-medium">{t("dateTime")}
              <input aria-label="Event date and time" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            <label className="block text-sm font-medium">{t("location")}
              <input aria-label="Event location" value={location} maxLength={80} placeholder="e.g. Nairobi, Uhuru Park" onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            <label className="block text-sm font-medium">{t("description")}
              <textarea aria-label="Event description" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" rows={2} />
            </label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? t("saving") : t("addEvent")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
