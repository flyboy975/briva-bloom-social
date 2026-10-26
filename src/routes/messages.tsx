import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import { Avatar, Shell } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useMessaging } from "@/lib/messaging";
import { imageError, unreadMessages } from "@/lib/social-rules";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): { conversation?: string | undefined } => ({ conversation: typeof search['conversation'] === "string" ? search['conversation'] : undefined }),
  head: () => ({ meta: [
    { title: "Private messages — Briva" }, { name: "description", content: "Your private conversations on Briva." },
    { property: "og:title", content: "Private messages — Briva" }, { property: "og:description", content: "Stay in touch with your Briva friends." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: MessagesPage,
});
function MessagesPage() {
  const { me, users, ready } = useStore();
  const { conversations, messages, error, send, markRead, start } = useMessaging();
  const search = Route.useSearch();
  const [selected, setSelected] = useState<string | null>(search.conversation ?? null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");
  const [find, setFind] = useState("");
  const [composing, setComposing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const conversation = conversations.find((c) => c.id === selected);
  const otherId = conversation?.user_a === me?.id ? conversation?.user_b : conversation?.user_a;
  const other = users.find((u) => u.id === otherId);
  const thread = messages.filter((m) => m.conversationId === selected);
  const incomingUnread = me ? unreadMessages(thread, me.id).length : 0;
  useEffect(() => { setSelected(search.conversation ?? null); }, [search.conversation]);
  useEffect(() => { setText(""); setFile(undefined); setSendError(""); }, [selected]);
  useEffect(() => {
    if (!file) { setPreview(undefined); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [selected, thread.length]);
  useEffect(() => { if (selected && incomingUnread > 0) void markRead(selected); }, [selected, incomingUnread, markRead]);
  if (!me) return <Shell title="Messages"><div className="space-y-4 p-6 text-center"><p>{ready ? "Log in to read your private messages." : "Loading…"}</p>{ready && <Button asChild><Link to="/login">Log in or sign up</Link></Button>}</div></Shell>;
  return <Shell title="Messages" wide>
    <div className="grid h-[calc(100dvh-9rem)] min-h-96 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${selected ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r bg-card`}>
        <div className="flex items-center justify-between border-b p-4"><h1 className="font-bold">Messages</h1><Button variant="ghost" size="icon" aria-label="New message" onClick={() => setComposing(!composing)}><Send /></Button></div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {composing && <div className="border-b p-3"><input aria-label="Find a member" placeholder="Search people…" value={find} onChange={(e) => setFind(e.target.value)} className="mb-2 w-full rounded-md border bg-background px-3 py-2 text-sm" />{users.filter((u) => u.id !== me.id && `${u.name} ${u.username}`.toLowerCase().includes(find.toLowerCase())).map((user) => <Button key={user.id} variant="ghost" className="h-auto w-full justify-start py-2" disabled={busy} onClick={async () => { setBusy(true); try { setSelected(await start(user.id)); setComposing(false); } catch (e) { setSendError(e instanceof Error ? e.message : "Could not start conversation"); } finally { setBusy(false); } }}><Avatar user={user} size={32} /><span className="truncate">{user.name}</span></Button>)}</div>}
          {!conversations.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No conversations yet.</p>}
          {conversations.map((c) => {
            const person = users.find((u) => u.id === (c.user_a === me.id ? c.user_b : c.user_a));
            const list = messages.filter((m) => m.conversationId === c.id); const last = list.at(-1); const count = unreadMessages(list, me.id).length;
            return <Button key={c.id} variant="ghost" className={`h-auto w-full justify-start rounded-none border-b px-4 py-4 ${selected === c.id ? "bg-secondary" : ""}`} onClick={() => setSelected(c.id)} aria-label={`Chat with ${person?.name ?? "member"}`}><Avatar user={person} /><span className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{person?.name}</span><span className="block truncate text-xs text-muted-foreground">{last?.text ?? (last?.image ? "Photo" : "Say hello")}</span></span>{count > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{count}</span>}</Button>;
          })}
          {(error || sendError) && <p role="alert" className="p-3 text-sm text-destructive">{error || sendError}</p>}
        </div>
      </aside>
      <section className={`${selected ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col bg-background`} aria-label="Chat">
        {conversation ? <>
          <header className="flex items-center gap-3 border-b bg-card p-3"><Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to conversations" onClick={() => setSelected(null)}><ArrowLeft /></Button><Avatar user={other} size={36} />{other && <Link to="/u/$username" params={{ username: other.username }} className="truncate font-semibold">{other.name}</Link>}</header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {!thread.length && <p className="py-8 text-center text-sm text-muted-foreground">Say hello to {other?.name}.</p>}
            {thread.map((m) => <div key={m.id} className={`flex items-end gap-2 ${m.senderId === me.id ? "justify-end" : "justify-start"}`}>
              {m.senderId !== me.id && <Avatar user={other} size={28} />}
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.senderId === me.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {m.image && <a href={m.image} target="_blank" rel="noreferrer"><img src={m.image} alt="Shared photo" className="mb-2 max-h-72 rounded-md object-contain" /></a>}
                {m.text && <p className="whitespace-pre-wrap break-words text-sm">{m.text}</p>}
                <p className="mt-1 text-right text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{m.senderId === me.id && (m.readAt ? " · Seen" : " · Sent")}</p>
              </div>
            </div>)}<div ref={end} />
          </div>
          <form className="border-t bg-card p-3" onSubmit={async (e) => { e.preventDefault(); if (!selected) return; setBusy(true); setSendError(""); try { await send(selected, text, file); setText(""); setFile(undefined); } catch (e) { setSendError(e instanceof Error ? e.message : "Message could not send. Try again."); } finally { setBusy(false); } }}>
            {preview && <div className="mb-2 flex items-start gap-2"><img src={preview} alt="Photo attachment" className="h-20 w-20 rounded-md object-cover" /><Button variant="ghost" size="icon" type="button" aria-label="Remove attachment" onClick={() => setFile(undefined)}><X /></Button></div>}
            {(sendError || error) && <p role="alert" className="mb-2 text-sm text-destructive">{sendError || error}</p>}
            <div className="flex items-end gap-2"><Button variant="ghost" size="icon" type="button" aria-label="Attach photo" disabled={busy} onClick={() => input.current?.click()}><ImagePlus /></Button><textarea aria-label="Message" placeholder="Message…" maxLength={2000} rows={1} className="max-h-32 min-w-0 flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} /><Button size="icon" aria-label="Send message" disabled={busy || (!text.trim() && !file)}><Send /></Button></div>
            <input ref={input} type="file" accept="image/*" aria-label="Message photo" className="hidden" onChange={(e) => { const photo = e.target.files?.[0]; if (!photo) return; const invalid = imageError(photo); if (invalid) setSendError(invalid); else { setFile(photo); setSendError(""); } e.target.value = ""; }} />
          </form>
        </> : <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">{selected ? "Loading conversation…" : "Your private messages"}</div>}
      </section>
    </div>
  </Shell>;
}