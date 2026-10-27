export const REEL_MIN_SECONDS = 15;
export const REEL_MAX_SECONDS = 60;
export function reelDurationError(duration: number) {
  return Number.isFinite(duration) && duration >= REEL_MIN_SECONDS && duration <= REEL_MAX_SECONDS ? null : "Choose a video between 15 and 60 seconds";
}
export function reelFileError(file: Pick<File, "type" | "size">) {
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) return "Choose an MP4, WebM or MOV video";
  return file.size > 50 * 1024 * 1024 ? "Video must be 50 MB or smaller" : null;
}