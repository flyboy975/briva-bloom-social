import { describe, expect, it } from "vitest";
import { reelDurationError } from "@/lib/reel-rules";
describe("Reels duration", () => {
  it("accepts the 15-second minimum", () => { expect(reelDurationError(15)).toBeNull(); expect(reelDurationError(14.99)).not.toBeNull(); });
  it("accepts the 60-second maximum", () => { expect(reelDurationError(60)).toBeNull(); expect(reelDurationError(60.01)).not.toBeNull(); });
  it("rejects unknown duration", () => { expect(reelDurationError(NaN)).not.toBeNull(); expect(reelDurationError(Infinity)).not.toBeNull(); });
});