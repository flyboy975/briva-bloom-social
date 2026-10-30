export const REEL_MIN_SECONDS = 1
export const REEL_MAX_SECONDS = 600
export function reelDurationError(duration: number) {
  return Number.isFinite(duration) && duration >= REEL_MIN_SECONDS && duration <= REEL_MAX_SECONDS ? null : "Choose a video between 1 and 600 seconds";
}
export function reelFileError(file: Pick<File, "type" | "size">) {
  if (", "video/webm", "video/quicktime"].includes(file.type)) return "Choose an MP4, WebM or MOV video";
  return file.size > 50 * 1024 * 1024 ? "Video must be 200 MB or smaller" : null;
}