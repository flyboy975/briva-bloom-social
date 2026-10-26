export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
export type Friendship = { id: string; requester_id: string; receiver_id: string; status: "pending" | "accepted" };
export function friendshipState(friendships: Friendship[], viewer: string, owner: string) {
  if (viewer === owner) return "self";
  const match = friendships.find((f) => (f.requester_id === viewer && f.receiver_id === owner) || (f.receiver_id === viewer && f.requester_id === owner));
  if (!match) return "none";
  return match.status === "accepted" ? "friends" : match.receiver_id === viewer ? "incoming" : "outgoing";
}
export function canViewContent(viewer: string | null, owner: string, isPrivate: boolean, friendships: Friendship[]) {
  return Boolean(viewer && (viewer === owner || !isPrivate || friendshipState(friendships, viewer, owner) === "friends"));
}
export function pendingRequests(friendships: Friendship[], viewer: string) {
  return friendships.filter((f) => f.receiver_id === viewer && f.status === "pending");
}
export function profileViewState(ready: boolean, signedIn: boolean, profileExists: boolean) {
  if (!ready) return "loading";
  if (!signedIn) return "join";
  return profileExists ? "profile" : "missing";
}
export function liveStories<T extends { expiresAt: number }>(stories: T[], now: number) {
  return stories.filter((story) => story.expiresAt > now);
}
export function conversationPair(first: string, second: string) {
  if (first === second) throw new Error("Choose another person to message");
  return first < second ? { user_a: first, user_b: second } : { user_a: second, user_b: first };
}
export function unreadMessages<T extends { senderId: string; readAt: string | null }>(messages: T[], myId: string) {
  return messages.filter((message) => message.senderId !== myId && message.readAt === null);
}
export function imageError(file: File) {
  if (!file.type.startsWith("image/")) return "Choose an image file";
  if (file.size > 5 * 1024 * 1024) return "Photo must be 5 MB or smaller";
  return null;
}