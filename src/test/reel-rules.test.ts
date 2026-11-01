import { describe, expect, it } from "vitest";
import { reelDurationError, reelFileError, reelFormat } from "@/lib/reel-rules";
describe("Reels duration", () => {
  it("accepts the 15-second minimum", () => { expect(reelDurationError(15)).toBeNull(); expect(reelDurationError(14.9)).not.toBeNull(); });
  it("accepts the 60-second maximum", () => { expect(reelDurationError(60)).toBeNull(); expect(reelDurationError(60.1)).not.toBeNull(); });
  it("rejects unknown duration", () => { expect(reelDurationError(NaN)).not.toBeNull(); expect(reelDurationError(Infinity)).not.toBeNull(); });
});
describe("Reels file size", () => {
  it("allows 50 MB and rejects larger", () => {
    expect(reelFileError({ type: "video/mp4", size: 50 * 1024 * 1024 })).toBeNull();
    expect(reelFileError({ type: "video/mp4", size: 50 * 1024 * 1024 + 1 })).toBe("Video must be 50 MB or smaller");
  });
});
describe("Phone video formats", () => {
  it("accepts a phone video with no reported type by its name", () => { expect(reelFormat({ type: "", name: "VID_2026.mp4" })).toBe("mp4"); expect(reelFormat({ type: "", name: "clip.MOV" })).toBe("mov"); });
  it("accepts m4v as MP4", () => { expect(reelFormat({ type: "video/x-m4v" })).toBe("mp4"); });
  it("rejects other formats", () => { expect(reelFileError({ type: "video/3gpp", size: 10, name: "a.3gp" })).not.toBeNull(); });
});
