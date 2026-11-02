export const REEL_MIN_SECONDS = 15
export const REEL_MAX_SECONDS = 600
export const REEL_MAX_BYTES = 50 * 1024 * 1024
export function reelDurationError(duration: number) {
  return Number.isFinite(duration) && duration >= REEL_MIN_SECONDS && duration <= REEL_MAX_SECONDS ? null : `Choose a video between ${REEL_MIN_SECONDS} and ${REEL_MAX_SECONDS} seconds`;
}
const TYPES: Record<string, "mp4" | "webm" | "mov"> = { "video/mp4": "mp4", "video/x-m4v": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const EXTS: Record<string, "mp4" | "webm" | "mov"> = { mp4: "mp4", m4v: "mp4", webm: "webm", mov: "mov" };
/** Phones sometimes report an empty or unusual type, so fall back to the file name. */
export function reelFormat(file: Pick<File, "type"> & { name?: string }) {
  const byType = TYPES[file.type.toLowerCase()];
  if (byType) return byType;
  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "";
  return EXTS[ext] ?? null;
}
export const REEL_CONTENT_TYPES = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" } as const;
export function reelFileError(file: Pick<File, "type" | "size"> & { name?: string }) {
  if (!reelFormat(file)) return "Choose an MP4, WebM or MOV video";
  return file.size > REEL_MAX_BYTES ? "Video must be 50 MB or smaller" : null;
}
export function reelUploadErrorMessage(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("size") || m.includes("too large") || m.includes("413")) return "Video upload failed: the video is larger than 50 MB.";
  if (m.includes("mime") || m.includes("type")) return "Video upload failed: this video format isn't supported. Try MP4.";
  if (m.includes("fetch") || m.includes("network")) return "Video upload failed: check your internet connection and try again.";
  return "Video upload failed. Please try again.";
}

const AUDIO_TYPES: Record<string, string> = { "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/opus": "opus", "audio/flac": "flac", "audio/webm": "webm" };
export function audioFormat(file: Pick<File, "type" | "name">) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_TYPES[file.type.toLowerCase()] ?? (["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac", "webm", "mp4"].includes(ext) ? ext : null);
}
export function audioFileError(file: Pick<File, "type" | "name" | "size">) {
  if (!audioFormat(file)) return "Choose an MP3, M4A, AAC, WAV, OGG, Opus, FLAC or WebM audio file.";
  return file.size > REEL_MAX_BYTES ? "Sound must be 50 MB or smaller" : null;
}
export type SoundReel = { id: string; sound_reel_id: string | null; url: string; audioUrl?: string; audio_name?: string | null };
export function resolveReelSound(reel: SoundReel, reels: SoundReel[]) {
  let source = reel;
  const seen = new Set<string>();
  while (source.sound_reel_id) {
    if (seen.has(source.id)) return null;
    seen.add(source.id);
    const next = reels.find((r) => r.id === source.sound_reel_id);
    if (!next) return null;
    source = next;
  }
  return { id: source.id, url: source.audioUrl || source.url, name: source.audio_name || "Video audio", separate: Boolean(source.audioUrl) || source.id !== reel.id };
}
