import { useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { REEL_CONTENT_TYPES, audioFileError, reelDurationError, reelFileError, reelFormat, reelUploadErrorMessage } from "@/lib/reel-rules";
import { uploadReelAudio } from "@/lib/reel-audio";
import { ReelSoundPicker } from "@/components/reel-sound-picker";
import type { Reel } from "@/lib/reels";

export function ReelUpload({ reels, onDone }: { reels: Reel[]; onDone: () => Promise<void> }) {
  const { me } = useStore();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [sound, setSound] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioFile, setAudioFile] = useState<File>();
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  return <>
    <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} />Create Reel</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) { setFile(undefined); setDuration(0); setError(""); } } }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg">
        <DialogTitle>Create a Reel</DialogTitle><DialogDescription>15 seconds–10 minutes · MP4, WebM or MOV · up to 50 MB per file</DialogDescription>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault(); if (!me || !file || busy) return;
          const invalid = reelFileError(file) || reelDurationError(duration) || (audioFile && audioFileError(audioFile));
          if (invalid) { setError(invalid); return; }
          const ext = reelFormat(file);
          if (!ext) { setError("Choose an MP4, WebM or MOV video"); return; }
          setBusy(true); setError("");
          const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
          let audioPath: string | null = null;
          let videoUploaded = false;
          try {
            const up = await supabase.storage.from("reel-videos").upload(path, file, { contentType: REEL_CONTENT_TYPES[ext] }).catch((err: unknown) => ({ error: { message: err instanceof Error ? err.message : "network" } }));
            if (up.error) { console.error("Reel upload failed", up.error); throw new Error(reelUploadErrorMessage(up.error.message)); }
            videoUploaded = true;
            if (audioFile) audioPath = await uploadReelAudio(me.id, audioFile);
            const result = await supabase.from("reels").insert({ author_id: me.id, video_path: path, caption: caption.trim(), duration_seconds: Math.round(duration * 100) / 100, sound_reel_id: sound || null, audio_path: audioPath, audio_name: audioFile?.name ?? null });
            if (result.error) { console.error("Reel save failed", result.error); throw new Error(`Reel could not be saved: ${result.error.message}`); }
            videoUploaded = false; audioPath = null;
            setOpen(false); setFile(undefined); setAudioFile(undefined); setCaption(""); setSound(""); setDuration(0);
            await onDone().catch(() => undefined);
          } catch (err) { if (videoUploaded) await supabase.storage.from("reel-videos").remove([path]); if (audioPath) await supabase.storage.from("reel-audio").remove([audioPath]); setError(err instanceof Error ? err.message : "Video upload failed. Please try again."); } finally { setBusy(false); }
        }}>
          <label className="block text-sm font-medium">Video<input disabled={busy} aria-label="Reel video" type="file" accept="video/*,.mp4,.m4v,.webm,.mov" className="mt-2 block w-full text-sm" onChange={(e) => { const next = e.target.files?.[0]; setDuration(0); setError(next ? reelFileError(next) ?? "" : ""); setFile(next); }} /></label>
          {preview && <video src={preview} controls muted playsInline className="mx-auto max-h-60 w-full bg-story-background" onLoadedMetadata={(e) => { const value = e.currentTarget.duration; setDuration(value); setError(reelDurationError(value) ?? ""); }} onError={() => setError("This video cannot be played. Try an MP4 video.")} />}
          <label className="block text-sm font-medium">Caption<textarea disabled={busy} aria-label="Reel caption" value={caption} maxLength={1000} onChange={(e) => setCaption(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" rows={2} /></label>
          <ReelSoundPicker reels={reels} sound={sound} file={audioFile} disabled={busy} onSound={setSound} onFile={setAudioFile} />
          <p className="text-xs text-muted-foreground">Only upload video and sound you own or have permission to share.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !file || Boolean(reelDurationError(duration)) || Boolean(file && reelFileError(file)) || Boolean(audioFile && audioFileError(audioFile))}><Upload size={16} />{busy ? "Uploading…" : "Share Reel"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;}

