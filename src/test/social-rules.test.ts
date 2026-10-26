import { describe, expect, it } from "vitest";
import { canViewContent, friendshipState, pendingRequests, conversationPair, liveStories, profileViewState, STORY_LIFETIME_MS, unreadMessages, type Friendship } from "@/lib/social-rules";
describe("Briva social rules", () => {
  const pending: Friendship[] = [{ id: "request", requester_id: "a", receiver_id: "b", status: "pending" }];
  const accepted: Friendship[] = [{ id: "request", requester_id: "a", receiver_id: "b", status: "accepted" }];
  it("private posts and stories require accepted friendship, not a pending request", () => {
    expect(canViewContent("a", "b", true, [])).toBe(false);
    expect(canViewContent("a", "b", true, pending)).toBe(false);
    expect(canViewContent("a", "b", true, accepted)).toBe(true);
    expect(canViewContent("b", "a", true, accepted)).toBe(true);
  });
  it("owners keep access and nonprivate profiles are still members-only", () => {
    expect(canViewContent("a", "a", true, [])).toBe(true);
    expect(canViewContent(null, "a", false, [])).toBe(false);
    expect(canViewContent("b", "a", false, [])).toBe(true);
  });
  it("unfriending removes private content access", () => {
    expect(canViewContent("a", "b", true, accepted.filter((f) => f.id !== "request"))).toBe(false);
  });
  it("only incoming pending requests count toward the bell", () => {
    expect(pendingRequests(pending, "b")).toHaveLength(1);
    expect(pendingRequests(pending, "a")).toHaveLength(0);
    expect(pendingRequests(accepted, "b")).toHaveLength(0);
  });
  it("distinguishes accept, cancel and unfriend actions", () => {
    expect(friendshipState(pending, "b", "a")).toBe("incoming");
    expect(friendshipState(pending, "a", "b")).toBe("outgoing");
    expect(friendshipState(accepted, "a", "b")).toBe("friends");
    expect(friendshipState([], "a", "b")).toBe("none");
    expect(friendshipState([], "a", "a")).toBe("self");
  });
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