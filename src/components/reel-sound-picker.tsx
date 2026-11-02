import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";
import { audioFileError, resolveReelSound } from "@/lib/reel-rules";
import type { Reel } from "@/lib/reels";

export function ReelSoundPicker({ reels, sound, file, disabled, onSound, onFile, exclude }: { reels: Reel[]; sound: string; file?: File | undefined; disabled: boolean; onSound: (id: string) => void; onFile: (file: File | undefined) => void; exclude?: string | undefined }) {
  const [localUrl, setLocalUrl] = useState("");
  useEffect(() => { if (!file) { setLocalUrl(""); return; } const url = URL.createObjectURL(file); setLocalUrl(url); return () => URL.revokeObjectURL(url); }, [file]);
  const sounds = reels.filter((r) => r.id !== exclude && resolveReelSound(r, reels)?.id !== exclude).sort((a, b) => b.likes.length - a.likes.length);
  const selected = sounds.find((r) => r.id === sound);
  const source = selected ? resolveReelSound(selected, reels) : null;
  return <div className="space-y-3">
    <label className="block text-sm font-medium"><span className="flex items-center gap-2"><Music2 size={16} />Sound</span><select aria-label="Reel sound" disabled={disabled} value={sound} onChange={(e) => { onSound(e.target.value); onFile(undefined); }} className="mt-2 w-full rounded-lg border bg-background p-3"><option value="">Video audio</option>{sounds.map((r) => <option key={r.id} value={r.id}>{resolveReelSound(r, reels)?.name ?? "Sound unavailable"} · {r.caption.slice(0, 40) || "Reel"} · {r.likes.length} likes</option>)}</select></label>
    <label className="block text-sm font-medium">Upload sound<input key={file?.name ?? "empty"} aria-label="Reel audio file" disabled={disabled} type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,.webm,.mp4" className="mt-2 block w-full text-sm" onChange={(e) => { onFile(e.target.files?.[0]); onSound(""); }} /></label>
    {file && audioFileError(file) && <p role="alert" className="text-sm text-destructive">{audioFileError(file)}</p>}
    {(localUrl || source?.url) && <audio key={localUrl || source?.url} aria-label="Sound preview" src={localUrl || source?.url} controls className="w-full" />}
  </div>;
}