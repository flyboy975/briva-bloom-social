import { describe, expect, it } from "vitest";
import { reelDurationError } from "@/lib/reel-rules";
describe("Reels duration", () => {
  it("accepts the 1-second minimum", () => { expect(reelDurationError(1)).toBeNull(); expect(reelDurationError(0.99)).not.toBeNull(); });
  it("accepts the 600-second maximum", () => { expect(reelDurationError(600)).toBeNull(); expect(reelDurationError(600.01)).not.toBeNull(); });
  it("rejects unknown duration", () => { expect(reelDurationError(NaN)).not.toBeNull(); expect(reelDurationError(Infinity)).not.toBeNull(); });
});
