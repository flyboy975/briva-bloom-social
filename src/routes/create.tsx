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
  const { me, addPost } = useStore();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string>();

  if (!me)
    return (
      <Shell title="New post">
        <div className="space-y-4 p-6 text-center">
          <p className="text-muted-foreground">You need an account to post.</p>
          <Link to="/signup" className={`${btnCls} block`}>Sign up</Link>
        </div>
      </Shell>
    );

  return (
    <Shell title="New post">
      <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); addPost(text.trim(), image); nav({ to: "/" }); }}>
        <div className="flex gap-3">
          <Avatar user={me} />
          <textarea className={`${inputCls} min-h-36 resize-none`} placeholder="What's happening?" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        </div>
        {image && <img src={image} alt="" className="w-full rounded-xl" />}
        <label className="block cursor-pointer rounded-xl border border-dashed border-primary/50 bg-secondary py-3 text-center text-sm font-medium text-primary">
          {image ? "Change photo" : "Add a photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => setImage(r.result as string);
            r.readAsDataURL(f);
          }} />
        </label>
        <button className={btnCls} disabled={!text.trim()}>Post</button>
      </form>
    </Shell>
  );
}
