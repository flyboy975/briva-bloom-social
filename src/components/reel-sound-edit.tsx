import { useState } from "react";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReelSoundPicker } from "@/components/reel-sound-picker";
import { supabase } from "@/integrations/supabase/client";
import { uploadReelAudio } from "@/lib/reel-audio";
import { audioFileError } from "@/lib/reel-rules";
import type { Reel } from "@/lib/reels";

export function ReelSoundEdit({ reel, reels, onDone }: { reel: Reel; reels: Reel[]; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <><Button variant="ghost" size="icon" title="Change sound" aria-label="Change Reel sound" className="bg-story-background/60 text-story-foreground" onClick={() => { setSound(reel.sound_reel_id ?? ""); setFile(undefined); setError(""); setOpen(true); }}><Music2 /></Button><Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogTitle>Change sound</DialogTitle><DialogDescription>{reel.audio_name ? `Current sound: ${reel.audio_name}` : "Choose a sound"}</DialogDescription><ReelSoundPicker reels={reels} exclude={reel.id} sound={sound} file={file} disabled={busy} onSound={setSound} onFile={setFile} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<p className="text-xs text-muted-foreground">Only share sound you own or have permission to use.</p><Button disabled={busy || Boolean(file && audioFileError(file))} onClick={async () => {
    setBusy(true); setError(""); let path: string | null = null;
    try {
      if (file) path = await uploadReelAudio(reel.author_id, file);
      const result = await supabase.from("reels").update({ sound_reel_id: sound || null, audio_path: path, audio_name: file?.name ?? null }).eq("id", reel.id).select("id").single();
      if (result.error) throw new Error(`Sound could not be saved: ${result.error.message}`);
      path = null; setOpen(false); await onDone();
    } catch (err) { if (path) await supabase.storage.from("reel-audio").remove([path]); setError(err instanceof Error ? err.message : "Sound could not be changed. Try again."); } finally { setBusy(false); }
  }}>{busy ? "Saving…" : "Save sound"}</Button></DialogContent></Dialog></>;
}