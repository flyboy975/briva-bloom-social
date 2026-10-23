import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, inputCls, btnCls } from "@/components/briva";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Briva" },
      { name: "description", content: "Create your free Briva account." },
      { property: "og:title", content: "Sign up — Briva" },
      { property: "og:description", content: "Create your free Briva account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { signup } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [u, setU] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <Shell title="Sign up">
      <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); const r = signup({ name, username: u }); if (r) setErr(r); else nav({ to: "/" }); }}>
        <h1 className="font-display text-3xl font-extrabold">Join Briva</h1>
        <p className="text-sm text-muted-foreground">It's free and open to everyone.</p>
        <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputCls} placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} required />
        <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password (6+ characters)" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnCls}>Create account</button>
        <p className="text-center text-sm">Already have an account? <Link to="/login" className="font-semibold text-primary">Log in</Link></p>
      </form>
    </Shell>
  );
}
