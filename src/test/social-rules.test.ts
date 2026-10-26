import { describe, expect, it } from "vitest";
import { conversationPair, liveStories, profileViewState, STORY_LIFETIME_MS, unreadMessages } from "@/lib/social-rules";
describe("Briva social rules", () => {
  it("requires joining before showing any profile, even when profile data remains cached", () => {
    expect(profileViewState(true, false, false)).toBe("join");
    expect(profileViewState(true, false, true)).toBe("join");
  });
  it("waits for loading and only identifies missing profiles for members", () => {
    expect(profileViewState(false, false, false)).toBe("loading");
    expect(profileViewState(true, true, false)).toBe("missing");
    expect(profileViewState(true, true, true)).toBe("profile");
  });
  it("defines a 24-hour story lifetime", () => { expect(STORY_LIFETIME_MS).toBe(86_400_000); });
  it("only shows stories with expiry strictly after now", () => {
    expect(liveStories([{ id: "expired", expiresAt: 99 }, { id: "boundary", expiresAt: 100 }, { id: "live", expiresAt: 101 }], 100).map((s) => s.id)).toEqual(["live"]);
  });
  it("counts only unread incoming messages", () => {
    expect(unreadMessages([{ senderId: "me", readAt: null }, { senderId: "other", readAt: null }, { senderId: "other", readAt: "2026-10-26" }], "me")).toHaveLength(1);
  });
  it("uses one canonical conversation for two people", () => {
    expect(conversationPair("b", "a")).toEqual({ user_a: "a", user_b: "b" });
    expect(conversationPair("a", "b")).toEqual({ user_a: "a", user_b: "b" });
    expect(() => conversationPair("a", "a")).toThrow();
  });
});