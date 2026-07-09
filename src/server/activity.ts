import { db } from "@/lib/db";
import { AuthContext } from "@/server/authz";
import { Prisma } from "@prisma/client";

/**
 * Fire-and-forget-safe activity logging. Never throws up to the caller —
 * a logging failure should never roll back or block the actual mutation
 * the user is waiting on, but we do log the logging failure itself.
 */
export async function logActivity(
  ctx: AuthContext,
  entityType: string,
  entityId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  try {
    await db.activityLog.create({
      data: {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        entityType,
        entityId,
        action,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[activity_log_failed]", { entityType, entityId, action, err });
  }
}

export async function listActivityForEntity(
  ctx: AuthContext,
  entityType: string,
  entityId: string
) {
  return db.activityLog.findMany({
    where: { orgId: ctx.orgId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
