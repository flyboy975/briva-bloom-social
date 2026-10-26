import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Avatar } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { liveStories } from "@/lib/social-rules";

export function StoriesBar() {
  const { me, users, stories, addStory } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const key = `briva-seen-stories-${me?.id ?? "guest"}`;
  useEffect(() => {
    setNow(Date.now());
    try { const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); setSeen(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []); } catch { setSeen([]); }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [key]);
  const live = liveStories(stories, now);
  const index = live.findIndex((story) => story.id === activeId);
  const active = live[index];
  const move = (direction: number) => {
    setActiveId(live[index + direction]?.id ?? null);
    setLoaded(false); setProgress(0);
  };
  useEffect(() => {
    if (!activeId) return;
    setProgress(0); setLoaded(false);
    setSeen((current) => {
      const next = current.includes(activeId) ? current : [...current, activeId];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Seen state is optional. */ }
      return next;
    });
  }, [activeId, key]);
  useEffect(() => {
    if (!active) { if (activeId) setActiveId(null); return; }
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveId(null); };
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", close); };
  }, [active?.id, activeId]);
  useEffect(() => {
    if (!active || !loaded || paused) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 2)), 100);
    return () => window.clearInterval(timer);
  }, [active?.id, loaded, paused]);
  useEffect(() => {
    if (progress >= 100) { setActiveId(live[index + 1]?.id ?? null); setProgress(0); setLoaded(false); }
  }, [progress, index, live]);
  if (!me) return null;
  const people = [...new Set(live.map((story) => story.userId))];
  return <>
    <section aria-label="Stories" className="border-b bg-card px-3 py-4">
      <div className="flex gap-4 overflow-x-auto">
        <Button variant="ghost" className="h-auto w-16 shrink-0 flex-col gap-2 p-0 hover:bg-transparent" disabled={busy} onClick={() => input.current?.click()} aria-label="Add your story">
          <span className="relative rounded-full border-2 border-dashed p-1"><Avatar user={me} size={48} /><span className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-primary p-0.5 text-primary-foreground"><Plus size={14} /></span></span>
          <span className="text-[11px]">{busy ? "Uploading…" : "Your story"}</span>
        </Button>
        {people.map((id) => { const user = users.find((u) => u.id === id); const userStories = live.filter((s) => s.userId === id); const unseen = userStories.some((s) => !seen.includes(s.id)); return <Button key={id} variant="ghost" className="h-auto w-16 shrink-0 flex-col gap-2 p-0 hover:bg-transparent" onClick={() => setActiveId((userStories.find((s) => !seen.includes(s.id)) ?? userStories[0])?.id ?? null)} aria-label={`View ${user?.name ?? "member"}'s story`}>
          <span className={`rounded-full border-2 p-1 ${unseen ? "border-primary" : "border-border"}`}><Avatar user={user} size={48} /></span><span className="w-full truncate text-[11px]">{id === me.id ? "You" : user?.username}</span>
        </Button>; })}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" aria-label="Story photo" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); setError(""); try { const result = await addStory(file); if (result) setError(result); } catch { setError("Your story could not upload. Try again."); } finally { setBusy(false); event.target.value = ""; } }} />
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
    {active && <div role="dialog" aria-modal="true" aria-label="Story viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-story-background text-story-foreground">
      <div className="relative flex h-[100dvh] w-full max-w-lg flex-col">
        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mb-3 flex gap-1">{live.map((story, i) => <progress aria-label={`Story ${i + 1} progress`} key={story.id} max={100} value={i < index ? 100 : i === index ? progress : 0} className="story-progress h-1 min-w-0 flex-1" />)}</div>
          <div className="flex items-center gap-3"><Avatar user={users.find((u) => u.id === active.userId)} size={36} /><span className="flex-1 text-sm font-semibold">{users.find((u) => u.id === active.userId)?.username}</span><Button variant="ghost" size="icon" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume story" : "Pause story"}>{paused ? "▶" : "Ⅱ"}</Button><Button variant="ghost" size="icon" onClick={() => setActiveId(null)} aria-label="Close story"><X /></Button></div>
        </div>
        <img key={active.id} src={active.image} alt={`Story by ${users.find((u) => u.id === active.userId)?.name ?? "member"}`} className="h-full w-full object-contain" onLoad={() => setLoaded(true)} onError={() => { setLoaded(true); setProgress(100); }} />
        <Button variant="ghost" size="icon" className="absolute left-2 top-1/2" disabled={index === 0} onClick={() => move(-1)} aria-label="Previous story"><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2" onClick={() => move(1)} aria-label="Next story"><ChevronRight /></Button>
      </div>
    </div>}
  </>;
}