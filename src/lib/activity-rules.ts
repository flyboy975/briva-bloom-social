export const ACTIVE_WINDOW_MS = 90_000;
export function isMemberActive(enabled: boolean, lastSeen: string | null, now: number) {
  if (!enabled || !lastSeen) return false;
  const age = now - Date.parse(lastSeen);
  return age >= 0 && age < ACTIVE_WINDOW_MS;
}