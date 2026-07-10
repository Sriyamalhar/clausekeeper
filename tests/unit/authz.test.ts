import { describe, it, expect } from "vitest";
import { requireRole, assertOwnsResource, ForbiddenError, AuthContext } from "@/server/authz";

function makeCtx(role: AuthContext["role"], orgId = "org_a"): AuthContext {
  return { userId: "user_1", orgId, role };
}

describe("requireRole", () => {
  it("allows a role equal to the minimum required", () => {
    expect(() => requireRole(makeCtx("admin"), "admin")).not.toThrow();
  });

  it("allows a role above the minimum required (owner satisfies admin)", () => {
    expect(() => requireRole(makeCtx("owner"), "admin")).not.toThrow();
  });

  it("rejects a role below the minimum required (viewer fails member)", () => {
    expect(() => requireRole(makeCtx("viewer"), "member")).toThrow(ForbiddenError);
  });

  it("rejects a member trying to perform an admin-only action", () => {
    expect(() => requireRole(makeCtx("member"), "admin")).toThrow(ForbiddenError);
  });
});

describe("assertOwnsResource", () => {
  it("allows access when the resource's orgId matches the caller's org", () => {
    const ctx = makeCtx("member", "org_a");
    expect(() => assertOwnsResource(ctx, "org_a")).not.toThrow();
  });

  it("BLOCKS access when the resource belongs to a different org, even for an owner", () => {
    // This is the single most important test in the suite: a valid, authenticated
    // owner of Org A must never reach Org B's data by guessing a resource ID.
    const ctx = makeCtx("owner", "org_a");
    expect(() => assertOwnsResource(ctx, "org_b")).toThrow(ForbiddenError);
  });

  it("does not leak whether the other org's resource exists via a different error type", () => {
    const ctx = makeCtx("owner", "org_a");
    try {
      assertOwnsResource(ctx, "org_b");
      throw new Error("expected assertOwnsResource to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).message).toBe("Resource not found");
    }
  });
});
