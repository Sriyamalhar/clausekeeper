import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type Role = "owner" | "admin" | "member" | "viewer";

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthContext {
  userId: string;
  orgId: string;
  role: Role;
}

/**
 * Resolves the authenticated user + their org/role directly from the
 * database session — never from a client-supplied header or body field.
 * Every mutating route/server action should call this first.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) throw new UnauthorizedError("No organization membership found");

  return {
    userId: session.user.id,
    orgId: membership.orgId,
    role: membership.role as Role,
  };
}

/**
 * Call after requireAuth() to enforce a minimum role. Roles rank
 * viewer < member < admin < owner; passing "admin" allows admin and owner.
 */
export function requireRole(ctx: AuthContext, minimumRole: Role) {
  if (ROLE_RANK[ctx.role] < ROLE_RANK[minimumRole]) {
    throw new ForbiddenError(
      `This action requires the "${minimumRole}" role or higher.`
    );
  }
}

/**
 * Row-level check: confirms a resource (already fetched) belongs to the
 * caller's org. Call this on every read/write of a specific record — role
 * checks alone are not enough, since a valid member of Org A must never
 * reach Org B's data by guessing an ID.
 */
export function assertOwnsResource(ctx: AuthContext, resourceOrgId: string) {
  if (resourceOrgId !== ctx.orgId) {
    // Same error as "not found" — never confirm a resource exists in
    // another org, which would itself be an information leak.
    throw new ForbiddenError("Resource not found");
  }
}
