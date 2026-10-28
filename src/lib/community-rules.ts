export type JoinPolicy = "open" | "approval";
export type Membership = { role: string; status: string } | null | undefined;

export function groupNameError(name: string) {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 60 ? null : "Group name must be 3–60 characters";
}

export function joinStatusFor(policy: JoinPolicy): "pending" | "approved" {
  return policy === "open" ? "approved" : "pending";
}

export function canPostInGroup(membership: Membership) {
  return membership?.status === "approved";
}

export function canApproveMembers(membership: Membership) {
  return membership?.status === "approved" && membership.role === "admin";
}

export function priceError(cents: number) {
  if (!Number.isInteger(cents) || cents < 0) return "Enter a valid price";
  return cents > 1_000_000_000 ? "Price is too high" : null;
}

export function locationError(location: string) {
  const trimmed = location.trim();
  return trimmed.length >= 2 && trimmed.length <= 80 ? null : "Enter a location (2–80 characters)";
}

export function eventDateError(startsAt: number) {
  if (!Number.isFinite(startsAt)) return "Choose a date and time";
  return startsAt <= Date.now() ? "Choose a future date and time" : null;
}

export function formatPrice(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
