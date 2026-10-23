import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, btnCls } from "@/components/briva";
import { useStore } from "@/lib/store";

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
  const { login, signup } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [u, setU] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const tab = (m: "login" | "signup", label: string) => (
    <button type="button" onClick={() => { setMode(m); setErr(""); }}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>{label}</button>
  );
  return (
    <Shell title={mode === "login" ? "Log in" : "Sign up"}>
      <form className="space-y-4 p-6" onSubmit={(e) => {
        e.preventDefault();
        const r = mode === "login" ? login(u) : signup({ name, username: u });
        if (r) setErr(r); else nav({ to: "/" });
      }}>
        <div className="flex gap-1 rounded-xl bg-secondary p-1">{tab("login", "Log in")}{tab("signup", "Sign up")}</div>
        <h1 className="font-display text-3xl font-extrabold">{mode === "login" ? "Welcome back" : "Join Briva"}</h1>
        <p className="rounded-xl bg-accent p-3 text-xs text-accent-foreground">
          Demo accounts only: passwords are not checked or stored, and accounts exist only in this browser. Try username <b>amani</b>.
        </p>
        {mode === "signup" && <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
        <input className={inputCls} placeholder="Username" autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnCls}>{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
    </Shell>
  );
}
