import { describe, expect, it } from "vitest";
import { readAccounts, rememberAccount } from "@/lib/account-rules";

const account = { id: "one", name: "Member One", username: "memberone", email: "one@example.test" };
describe("remembered accounts", () => {
  it("stores only identity labels, never passwords or session tokens", () => {
    const read = readAccounts(JSON.stringify([{ ...account, password: "secret", access_token: "token", refresh_token: "refresh" }]));
    expect(read).toEqual([account]);
  });
  it("updates an account without duplicating it", () => {
    expect(rememberAccount([account], { ...account, name: "Updated" })).toEqual([{ ...account, name: "Updated" }]);
  });
  it("retains other accounts when adding another", () => {
    const other = { ...account, id: "two", email: "two@example.test" };
    expect(rememberAccount([account], other)).toEqual([account, other]);
  });
  it("ignores malformed saved accounts", () => {
    expect(readAccounts("invalid")).toEqual([]);
    expect(readAccounts(JSON.stringify([null, { id: "one" }, account]))).toEqual([account]);
  });
});