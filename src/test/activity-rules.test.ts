import { describe, expect, it } from "vitest";
import { isMemberActive } from "@/lib/activity-rules";

describe("member active status", () => {
  const now = Date.parse("2026-11-04T11:00:00Z");
  it("never shows online when the member turns status off", () => {
    expect(isMemberActive(false, new Date(now).toISOString(), now)).toBe(false);
  });
  it("shows enabled members only while their heartbeat is recent", () => {
    expect(isMemberActive(true, new Date(now - 89_999).toISOString(), now)).toBe(true);
    expect(isMemberActive(true, new Date(now - 90_000).toISOString(), now)).toBe(false);
    expect(isMemberActive(true, null, now)).toBe(false);
    expect(isMemberActive(true, "invalid", now)).toBe(false);
    expect(isMemberActive(true, new Date(now + 1).toISOString(), now)).toBe(false);
  });
});