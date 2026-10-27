import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Music2, Pause, Play, Share2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar } from "@/components/briva";
import { useStore } from "@/lib/store";
import { useReels, type Reel } from "@/lib/reels";
import { ReelUpload } from "@/components/reel-upload";

function ReelPlayer({ reel, sound, onLike, onComment, onShare }: { reel: Reel; sound?: Reel | undefined; onLike: () => void; onComment: () => void; onShare: () => void }) {
  const { users, me } = useStore();
  const author = users.find((u) => u.id === reel.author_id);
  const source = sound ? users.find((u) => u.id === sound.author_id) : author;
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLVideoElement>(null);
  const section = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = visible && !paused;
  useEffect(() => {
    const node = section.current; if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.6)), { threshold: [0, 0.6, 1] });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const player = video.current; const soundtrack = audio.current;
    if (!player) return;
    if (active && !document.hidden) {
      void player.play().catch(() => setPaused(true));
      if (soundtrack && !muted) { soundtrack.currentTime = player.currentTime % (soundtrack.duration || 60); void soundtrack.play().catch(() => setMuted(true)); }
      else soundtrack?.pause();
    } else { player.pause(); soundtrack?.pause(); }
    const onHidden = () => { if (document.hidden) { player.pause(); soundtrack?.pause(); } else if (active) { void player.play().catch(() => setPaused(true)); if (soundtrack && !muted) void soundtrack.play().catch(() => setMuted(true)); } };
    document.addEventListener("visibilitychange", onHidden);
    return () => { player.pause(); soundtrack?.pause(); document.removeEventListener("visibilitychange", onHidden); };
  }, [active, muted]);
  const liked = Boolean(me && reel.likes.includes(me.id));
  return <article ref={section} id={`reel-${reel.id}`} className="reel-slide relative isolate snap-start snap-always overflow-hidden bg-story-background text-story-foreground" aria-label={`Reel by ${author?.username ?? "member"}`}>
    <video ref={video} src={reel.url} muted={sound ? true : muted} loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" onError={() => setFailed(true)} onTimeUpdate={() => { if (audio.current && video.current?.currentTime === 0) audio.current.currentTime = 0; }} />
    {sound && <video ref={audio} src={sound.url} loop preload="metadata" className="hidden" />}
    <div className="reel-shade pointer-events-none absolute inset-0" />
    <div className="absolute left-3 top-3 flex gap-2"><Button variant="ghost" size="icon" className="bg-story-background/60 text-story-foreground" aria-label={paused ? "Play video" : "Pause video"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button><Button variant="ghost" size="icon" className="bg-story-background/60 text-story-foreground" aria-label={muted ? "Unmute video" : "Mute video"} onClick={() => setMuted(!muted)}>{muted ? <VolumeX /> : <Volume2 />}</Button></div>
    {failed && <p role="alert" className="absolute inset-x-4 top-1/2 text-center">Video could not play. Try an MP4 upload.</p>}
    <div className="absolute bottom-5 right-2 flex w-14 flex-col items-center gap-4">
      <div className="text-center"><Button variant="ghost" size="icon" className="bg-story-background/60 text-story-foreground" aria-label={liked ? "Unlike Reel" : "Like Reel"} aria-pressed={liked} onClick={onLike}><Heart fill={liked ? "currentColor" : "none"} /></Button><span className="block text-xs font-semibold" aria-label="Reel likes">{reel.likes.length}</span></div>
      <div className="text-center"><Button variant="ghost" size="icon" className="bg-story-background/60 text-story-foreground" aria-label="Reel comments" onClick={onComment}><MessageCircle /></Button><span className="block text-xs font-semibold">{reel.comments.length}</span></div>
      <Button variant="ghost" size="icon" className="bg-story-background/60 text-story-foreground" aria-label="Share Reel" onClick={onShare}><Share2 /></Button>
    </div>
    <div className="absolute bottom-5 left-4 right-20 space-y-3"><Link to="/u/$username" params={{ username: author?.username ?? "unknown" }} className="flex items-center gap-2 font-semibold"><Avatar user={author} size={32} /><span className="truncate">@{author?.username ?? "member"}</span></Link>{reel.caption && <p className="line-clamp-3 break-words text-sm">{reel.caption}</p>}<p className="flex items-center gap-2 text-xs"><Music2 size={14} /><span className="truncate">{reel.sound_reel_id && !sound ? "Sound unavailable · original video" : `Original sound · @${source?.username ?? "member"}`}</span></p></div>
  </article>;
}

export function ReelsFeed({ target }: { target?: string | undefined }) {
  const { me, users } = useStore();
  const { reels, loading, error, reload, setError, toggleLike, comment } = useReels();
  const [commentId, setCommentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const current = reels.find((r) => r.id === commentId);
  const scrolled = useRef("");
  useEffect(() => { if (target && scrolled.current !== target && reels.length) { const node = document.getElementById(`reel-${target}`); if (node) { node.scrollIntoView({ block: "nearest" }); scrolled.current = target; } } }, [target, reels]);
  if (!me) return <div className="p-6 text-center"><p className="text-sm text-muted-foreground">Join Briva to watch and share Reels.</p><Button asChild className="mt-4"><Link to="/login">Log in or sign up</Link></Button></div>;
  return <>
    <div className="flex items-center justify-between border-b bg-card px-4 py-3"><h2 className="font-semibold">Reels</h2><ReelUpload reels={reels} onDone={reload} /></div>
    {error && <div className="flex items-center justify-between gap-2 p-3"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => void reload()}>Retry</Button></div>}
    {loading && <p className="p-6 text-center text-sm text-muted-foreground">Loading Reels…</p>}
    {!loading && !reels.length && !error && <div className="space-y-3 px-6 py-16 text-center"><Music2 className="mx-auto text-primary" size={36} /><h3 className="font-semibold">Your moments, in motion</h3><p className="text-sm text-muted-foreground">No Reels yet.</p></div>}
    {target && !loading && !reels.some((r) => r.id === target) && <p className="p-4 text-sm text-muted-foreground">This Reel is unavailable or private.</p>}
    {reels.length > 0 && <div className="reel-scroll overflow-y-auto overscroll-y-contain snap-y snap-mandatory" aria-label="Swipeable Reels feed">{reels.map((reel) => <ReelPlayer key={reel.id} reel={reel} sound={reels.find((r) => r.id === reel.sound_reel_id)} onLike={() => void toggleLike(reel)} onComment={() => { setText(""); setCommentId(reel.id); }} onShare={() => { setCopied(false); setShareId(reel.id); }} />)}</div>}
    <Dialog open={Boolean(commentId)} onOpenChange={(value) => { if (!value) setCommentId(null); }}><DialogContent className="max-h-[80dvh] rounded-lg"><DialogTitle>Comments</DialogTitle><DialogDescription>{current?.comments.length ?? 0} comments</DialogDescription><div className="max-h-[45dvh] space-y-3 overflow-y-auto">{current?.comments.map((c) => { const author = users.find((u) => u.id === c.author_id); return <div key={c.id} className="flex gap-2"><Avatar user={author} size={28} /><p className="min-w-0 break-words text-sm"><span className="font-semibold">@{author?.username ?? "member"} </span>{c.text}</p></div>; })}{!current?.comments.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}</div><form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!current || sending) return; setSending(true); if (await comment(current.id, text)) setText(""); setSending(false); }}><input aria-label="Reel comment" placeholder="Write a comment…" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" /><Button disabled={sending || !text.trim()} type="submit">Send</Button></form>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</DialogContent></Dialog>
    <Dialog open={Boolean(shareId)} onOpenChange={(value) => { if (!value) setShareId(null); }}><DialogContent className="rounded-lg"><DialogTitle>Share Reel</DialogTitle><DialogDescription>Only signed-in members with access can watch this Reel.</DialogDescription><Button onClick={async () => { if (!shareId) return; const url = `${window.location.origin}/?view=reels&reel=${shareId}`; try { if (navigator.share) await navigator.share({ title: "Briva Reel", url }); else { await navigator.clipboard.writeText(url); setCopied(true); } } catch (err) { if (!(err instanceof Error && err.name === "AbortError")) setError("Sharing failed. Copy the link below."); } }}><Share2 size={16} />{copied ? "Link copied" : "Share or copy link"}</Button><input aria-label="Reel share link" readOnly value={shareId && typeof window !== "undefined" ? `${window.location.origin}/?view=reels&reel=${shareId}` : ""} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border bg-background p-3 text-sm" /></DialogContent></Dialog>
  </>;
}