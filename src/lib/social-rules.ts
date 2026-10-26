export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
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