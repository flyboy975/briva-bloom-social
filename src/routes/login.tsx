import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, btnCls } from "@/components/briva";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Briva" },
      { name: "description", content: "Log in to Briva to like, comment and post." },
      { property: "og:title", content: "Log in — Briva" },
      { property: "og:description", content: "Log in to Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <Shell title="Log in">
      <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); const r = login(u); if (r) setErr(r); else nav({ to: "/" }); }}>
        <h1 className="font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Demo: try username <b>amani</b> with any password.</p>
        <input className={inputCls} placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnCls}>Log in</button>
        <p className="text-center text-sm">New here? <Link to="/signup" className="font-semibold text-primary">Create an account</Link></p>
      </form>
    </Shell>
  );
}
