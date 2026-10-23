import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, Shell, inputCls, btnCls } from "@/components/briva";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "New post — Briva" },
      { name: "description", content: "Share a new post on Briva." },
      { property: "og:title", content: "New post — Briva" },
      { property: "og:description", content: "Share a new post on Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Create,
});

function Create() {
  const { me, ready, addPost } = useStore();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | undefined>();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me)
    return (
      <Shell title="New post">
        <div className="space-y-4 p-6 text-center">
          <p className="text-muted-foreground">{ready ? "You need an account to post." : "Loading…"}</p>
          {ready && <Link to="/login" className={`${btnCls} block`}>Log in or sign up</Link>}
        </div>
      </Shell>
    );

  return (
    <Shell title="New post">
      <form className="space-y-4 p-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        const r = await addPost(text.trim(), file);
        setBusy(false);
        if (r) setErr(r); else nav({ to: "/" });
      }}>
        <div className="flex gap-3">
          <Avatar user={me} />
          <textarea className={`${inputCls} min-h-36 resize-none`} placeholder="What's happening?" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        </div>
        {preview && <img src={preview} alt="" className="w-full rounded-xl" />}
        <label className="block cursor-pointer rounded-xl border border-dashed border-primary/50 bg-secondary py-3 text-center text-sm font-medium text-primary">
          {file ? "Change photo" : "Add a photo (max 5 MB)"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 5 * 1024 * 1024) { setErr("Photo must be 5 MB or smaller"); return; }
            setErr(""); setFile(f); setPreview(URL.createObjectURL(f));
          }} />
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnCls} disabled={!text.trim() || busy}>{busy ? "Posting…" : "Post"}</button>
      </form>
    </Shell>
  );
}
