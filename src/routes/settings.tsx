import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Lock, LogOut, Radio } from "lucide-react";
import { Avatar, Shell } from "@/components/briva";
import { useStore } from "@/lib/store";
import { useLanguage, LANGS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Briva" },
      { name: "description", content: "Manage your Briva account: profile photo, privacy and language." },
      { property: "og:title", content: "Settings — Briva" },
      { property: "og:description", content: "Manage your Briva account: profile photo, privacy and language." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { me, ready, logout, setAvatar, setPrivate, activeStatus, setActiveStatus } = useStore();
  const { lang, setLang, t } = useLanguage();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!ready) return <Shell title={t("settings")}><p className="p-6 text-center text-muted-foreground">{t("loading")}</p></Shell>;
  if (!me) return (
    <Shell title={t("settings")}>
      <div className="space-y-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("membersOnlyPage")}</p>
        <Button asChild size="lg" className="max-w-full rounded-full"><Link to="/login">{t("loginOrSignup")}</Link></Button>
      </div>
    </Shell>
  );

  return (
    <Shell title={t("settings")}>
      <div className="border-b bg-card px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar user={me} size={56} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{me.name}</h1>
            <p className="truncate text-sm text-muted-foreground">@{me.username}</p>
          </div>
        </div>
      </div>

      <section aria-label={t("account")} className="space-y-1 border-b bg-card py-2">
        <h2 className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("account")}</h2>
        <button disabled={busy} onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold disabled:opacity-60">
          <Camera size={20} className="text-primary" />{busy ? t("uploading") : t("changePhoto")}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label={t("changePhoto")} onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true); setErr("");
          const r = await setAvatar(f); if (r) setErr(r);
          setBusy(false); e.target.value = "";
        }} />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <label htmlFor="settings-private" className="flex items-center gap-3 text-sm font-semibold"><Lock size={20} className="text-primary" />{t("privateProfile")}</label>
          <Switch id="settings-private" checked={me.isPrivate} disabled={busy} onCheckedChange={async (value) => {
            setBusy(true); setErr("");
            try { setErr(await setPrivate(value) ?? ""); } catch { setErr("Could not change privacy. Try again."); } finally { setBusy(false); }
          }} />
        </div>
        <p className="px-4 pb-2 text-xs text-muted-foreground">{t("privateProfileHint")}</p>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <label htmlFor="settings-active" className="flex items-center gap-3 text-sm font-semibold"><Radio size={20} className="text-primary" />{t("activeStatus")}</label>
          <Switch id="settings-active" checked={activeStatus} disabled={busy} onCheckedChange={async (value) => {
            setBusy(true); setErr("");
            try { if (await setActiveStatus(value)) setErr(t("activeStatusError")); }
            catch { setErr(t("activeStatusError")); } finally { setBusy(false); }
          }} />
        </div>
      </section>

      <section aria-label={t("language")} className="border-b bg-card py-2">
        <h2 className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("language")}</h2>
        <div className="px-4 py-2">
          <Select value={lang} onValueChange={(value) => { if (value === "en" || value === "sw" || value === "sheng") setLang(value); }}>
            <SelectTrigger aria-label={t("language")} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </section>

      {err && <p role="alert" className="px-4 py-3 text-sm text-destructive">{err}</p>}

      <div className="p-4">
        <Button variant="outline" className="w-full gap-2" onClick={async () => { await logout(); nav({ to: "/", replace: true }); }}>
          <LogOut size={18} />{t("logOut")}
        </Button>
      </div>
    </Shell>
  );
}
