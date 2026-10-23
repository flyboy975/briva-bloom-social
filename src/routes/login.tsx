import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Shell, inputCls, btnCls } from "@/components/briva";
import { useStore } from "@/lib/store";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in or sign up — Briva" },
      { name: "description", content: "Log in or create a Briva account to like, comment and post." },
      { property: "og:title", content: "Log in or sign up — Briva" },
      { property: "og:description", content: "Log in or create a Briva account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { login, signup, me } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [u, setU] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (me) nav({ to: "/" }); }, [me, nav]);

  const oauth = async (p: "google" | "lovable") => {
    setErr("");
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) setErr(r.error.message);
  };

  const tab = (m: "login" | "signup", label: string) => (
    <button type="button" onClick={() => { setMode(m); setErr(""); setSent(false); }}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>{label}</button>
  );

  return (
    <Shell title={mode === "login" ? "Log in" : "Sign up"}>
      <form className="space-y-4 p-6" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        const r = mode === "login" ? await login(email, pw) : await signup({ name, username: u, email, password: pw });
        setBusy(false);
        if (r) setErr(r);
        else if (mode === "signup") setSent(true);
      }}>
        <div className="flex gap-1 rounded-xl bg-secondary p-1">{tab("login", "Log in")}{tab("signup", "Sign up")}</div>
        <h1 className="font-display text-3xl font-extrabold">{mode === "login" ? "Welcome back" : "Join Briva"}</h1>
        {sent ? (
          <p className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
            Almost there! We sent a confirmation link to <b>{email}</b>. Open it to activate your account, then log in.
          </p>
        ) : (
          <>
            {mode === "signup" && <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
            {mode === "signup" && <input className={inputCls} placeholder="Username" autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} required />}
            <input className={inputCls} type="email" placeholder="Email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputCls} type="password" placeholder="Password (min 6 characters)" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button className={btnCls} disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <button type="button" onClick={() => oauth("google")} className="w-full rounded-xl border bg-card py-3 font-semibold">Continue with Google</button>
            <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
          </>
        )}
      </form>
    </Shell>
  );
}
