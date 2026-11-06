export type SavedAccount = { id: string; name: string; username: string; email: string };
export const ACCOUNT_KEY = "briva-accounts";

// Only public account labels are remembered; passwords and sessions are never copied.
export function readAccounts(value: string | null): SavedAccount[] {
  try {
    const rows: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is SavedAccount => Boolean(row && typeof row.id === "string" && typeof row.name === "string" && typeof row.username === "string" && typeof row.email === "string"))
      .map(({ id, name, username, email }) => ({ id, name, username, email }));
  } catch { return []; }
}

export function rememberAccount(accounts: SavedAccount[], account: SavedAccount): SavedAccount[] {
  return [...accounts.filter((a) => a.id !== account.id), account];
}