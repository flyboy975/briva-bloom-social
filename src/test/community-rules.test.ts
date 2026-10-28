import { describe, expect, it } from "vitest";
import { canApproveMembers, canPostInGroup, eventDateError, groupNameError, joinStatusFor, locationError, priceError } from "@/lib/community-rules";

describe("Group rules", () => {
  it("open groups approve instantly, approval groups stay pending", () => {
    expect(joinStatusFor("open")).toBe("approved");
    expect(joinStatusFor("approval")).toBe("pending");
  });
  it("only approved members can post", () => {
    expect(canPostInGroup({ role: "member", status: "approved" })).toBe(true);
    expect(canPostInGroup({ role: "member", status: "pending" })).toBe(false);
    expect(canPostInGroup(null)).toBe(false);
  });
  it("only approved admins can approve members", () => {
    expect(canApproveMembers({ role: "admin", status: "approved" })).toBe(true);
    expect(canApproveMembers({ role: "member", status: "approved" })).toBe(false);
    expect(canApproveMembers({ role: "admin", status: "pending" })).toBe(false);
  });
  it("validates group names", () => {
    expect(groupNameError("Nairobi Foodies")).toBeNull();
    expect(groupNameError("ab")).not.toBeNull();
    expect(groupNameError("x".repeat(61))).not.toBeNull();
  });
});

describe("Marketplace rules", () => {
  it("requires a valid non-negative integer price", () => {
    expect(priceError(0)).toBeNull();
    expect(priceError(150000)).toBeNull();
    expect(priceError(-1)).not.toBeNull();
    expect(priceError(1.5)).not.toBeNull();
  });
  it("requires a location", () => {
    expect(locationError("Nairobi")).toBeNull();
    expect(locationError(" ")).not.toBeNull();
  });
});

describe("Event rules", () => {
  it("requires a future date", () => {
    expect(eventDateError(Date.now() + 86_400_000)).toBeNull();
    expect(eventDateError(Date.now() - 1000)).not.toBeNull();
    expect(eventDateError(NaN)).not.toBeNull();
  });
});
