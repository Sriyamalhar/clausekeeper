import { describe, it, expect } from "vitest";
import { deriveDisplayStatus } from "@/lib/contract-status";

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

describe("deriveDisplayStatus", () => {
  it("returns 'draft' unchanged regardless of dates", () => {
    expect(
      deriveDisplayStatus({ status: "draft", endDate: daysFromNow(-5) })
    ).toBe("draft");
  });

  it("returns 'terminated' unchanged even if endDate is in the future", () => {
    expect(
      deriveDisplayStatus({ status: "terminated", endDate: daysFromNow(100) })
    ).toBe("terminated");
  });

  it("returns 'active' for an active contract with no end date (ongoing retainer)", () => {
    expect(deriveDisplayStatus({ status: "active", endDate: null })).toBe("active");
  });

  it("returns 'active' when more than 30 days remain", () => {
    expect(
      deriveDisplayStatus({ status: "active", endDate: daysFromNow(31) })
    ).toBe("active");
  });

  it("returns 'expiring' at exactly the 30-day boundary", () => {
    expect(
      deriveDisplayStatus({ status: "active", endDate: daysFromNow(30) })
    ).toBe("expiring");
  });

  it("returns 'expiring' when 1 day remains", () => {
    expect(
      deriveDisplayStatus({ status: "active", endDate: daysFromNow(1) })
    ).toBe("expiring");
  });

  it("returns 'expired' the day after the end date has passed", () => {
    expect(
      deriveDisplayStatus({ status: "active", endDate: daysFromNow(-1) })
    ).toBe("expired");
  });
});
