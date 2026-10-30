import { useEffect, useRef, useState } from "react";
import { Music2, Play, Plus, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { reelDurationError, reelFileError } from "@/lib/reel-rules";
import type { Reel } from "@/lib/reels";

export function ReelUpload({ reels, onDone }: { reels: Reel[]; onDone: () => Promise<void> }) {
  const { me, users } = useStore();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [sound, setSound] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const audio = useRef<HTMLVideoElement>(null);
  const sounds = reels.filter((r) => !r.sound_reel_id).sort((a, b) => b.likes.length - a.likes.length);
  const selected = sounds.find((r) => r.id === sound);
  useEffect(() => { const player = audio.current; return () => { player?.pause(); }; }, [sound, open]);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  return <>
    <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} />Create Reel</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) { setFile(undefined); setDuration(0); setError(""); } } }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg">
        <DialogTitle>Create a Reel</DialogTitle><DialogDescription>1–600 seconds · MP4, WebM or MOV · up to 200 MB</DialogDescription>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault(); if (!me || !file || busy) return;
          const invalid = reelFileError(file) || reelDurationError(duration);
          if (invalid) { setError(invalid); return; }
          setBusy(true); setError("");
          const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
          const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
          try {
            const up = await supabase.storage.from("reel-videos").upload(path, file, { contentType: file.type });
            if (up.error) throw new Error("Video upload failed. Try again.");
            const result = await supabase.from("reels").insert({ author_id: me.id, video_path: path, caption: caption.trim(), duration_seconds: duration, sound_reel_id: selected?.id ?? null });
            if (result.error) { await supabase.storage.from("reel-videos").remove([path]); throw new Error("Your Reel could not be saved. Try again."); }
            setOpen(false); setFile(undefined); setCaption(""); setSound(""); setDuration(0);
            await onDone().catch(() => undefined);
          } catch (err) { setError(err instanceof Error ? err.message : "Upload failed. Try again."); } finally { setBusy(false); }
        }}>
          <label className="block text-sm font-medium">Video<input disabled={busy} aria-label="Reel video" type="file" accept="video/mp4,video/webm,video/quicktime" className="mt-2 block w-full text-sm" onChange={(e) => { const next = e.target.files?.[0]; setDuration(0); setError(next ? reelFileError(next) ?? "" : ""); setFile(next); }} /></label>
          {preview && <video src={preview} controls muted playsInline className="mx-auto max-h-60 w-full bg-story-background" onLoadedMetadata={(e) => { const value = e.currentTarget.duration; setDuration(value); setError(reelDurationError(value) ?? ""); }} onError={() => setError("This video cannot be played. Try an MP4 video.")} />}
          <label className="block text-sm font-medium">Caption<textarea disabled={busy} aria-label="Reel caption" value={caption} maxLength={1000} onChange={(e) => setCaption(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" rows={2} /></label>
          <label className="block text-sm font-medium"><span className="flex items-center gap-2"><Music2 size={16} />Trending on Briva</span><select disabled={busy} aria-label="Reel sound" value={sound} onChange={(e) => setSound(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3"><option value="">Original video sound</option>{sounds.map((r) => <option key={r.id} value={r.id}>Original sound · @{users.find((u) => u.id === r.author_id)?.username ?? "member"} · {r.likes.length} likes</option>)}</select></label>
          {selected && <><video ref={audio} src={selected.url} className="hidden" preload="none" /><Button type="button" variant="outline" onClick={() => { const player = audio.current; if (player) { if (player.paused) void player.play().catch(() => setError("Sound preview could not play.")); else player.pause(); } }}><Play size={16} />Preview sound</Button></>}
          <p className="text-xs text-muted-foreground">Only upload video and sound you own or have permission to share.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !file || Boolean(reelDurationError(duration)) || Boolean(file && reelFileError(file))}><Upload size={16} />{busy ? "Uploading…" : "Share Reel"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;}

