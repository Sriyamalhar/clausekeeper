import { Contract } from "@prisma/client";

export type DisplayStatus = "draft" | "active" | "expiring" | "expired" | "terminated";

const EXPIRING_SOON_WINDOW_DAYS = 30;

/**
 * The stored `status` field reflects explicit user action (draft -> active,
 * or a manual "terminated"). "expiring" and "expired" are date-derived and
 * computed at read time here, rather than written to the DB — that avoids
 * needing a background job to keep a stored status in sync with the
 * calendar, and it's always correct even if nobody's run the cron in a while.
 */
export function deriveDisplayStatus(contract: Pick<Contract, "status" | "endDate">): DisplayStatus {
  if (contract.status === "draft" || contract.status === "terminated") {
    return contract.status;
  }

  if (!contract.endDate) return "active"; // no end date, e.g. ongoing retainer

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilEnd = Math.ceil((contract.endDate.getTime() - now.getTime()) / msPerDay);

  if (daysUntilEnd < 0) return "expired";
  if (daysUntilEnd <= EXPIRING_SOON_WINDOW_DAYS) return "expiring";
  return "active";
}

export function isExpiringSoon(contract: Pick<Contract, "status" | "endDate">): boolean {
  return deriveDisplayStatus(contract) === "expiring";
}
