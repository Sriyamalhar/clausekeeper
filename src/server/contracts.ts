import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AuthContext, assertOwnsResource } from "@/server/authz";
import { ContractInput, ContractQuery } from "@/types/schemas";
import { deriveDisplayStatus } from "@/lib/contract-status";

const SORT_COLUMN_MAP: Record<ContractQuery["sort"], Prisma.ContractOrderByWithRelationInput> = {
  endDate: { endDate: "asc" }, // direction applied below via `order`
  value: { valueAmount: "asc" },
  createdAt: { createdAt: "asc" },
};

export async function listContracts(ctx: AuthContext, query: ContractQuery) {
  const where: Prisma.ContractWhereInput = {
    orgId: ctx.orgId,
    deletedAt: null,
    ...(query.clientId && { clientId: query.clientId }),
    ...(query.status && { status: query.status }),
    ...(query.q && {
      title: { contains: query.q, mode: "insensitive" as const },
    }),
  };

  const orderByField = Object.keys(SORT_COLUMN_MAP[query.sort])[0] as string;
  const orderBy: Prisma.ContractOrderByWithRelationInput[] = [
    { [orderByField]: query.order } as Prisma.ContractOrderByWithRelationInput,
    { id: "asc" }, // stable secondary sort so pagination never jitters
  ];

  const contracts = await db.contract.findMany({
    where,
    orderBy,
    take: query.limit + 1, // fetch one extra to know if there's a next page
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    include: { client: { select: { id: true, name: true } } },
  });

  const hasMore = contracts.length > query.limit;
  const page = hasMore ? contracts.slice(0, -1) : contracts;

  return {
    contracts: page.map((c) => ({ ...c, displayStatus: deriveDisplayStatus(c) })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getContract(ctx: AuthContext, id: string) {
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      client: true,
      milestones: { orderBy: { dueDate: "asc" } },
      clauseFlags: { where: { dismissed: false }, orderBy: { riskLevel: "desc" } },
    },
  });
  if (!contract || contract.deletedAt) return null;
  assertOwnsResource(ctx, contract.orgId);
  return { ...contract, displayStatus: deriveDisplayStatus(contract) };
}

export async function createContract(ctx: AuthContext, input: ContractInput) {
  // Verify the client belongs to this org before attaching a contract to it —
  // otherwise a crafted clientId could link a contract cross-org.
  const client = await db.client.findUnique({ where: { id: input.clientId } });
  if (!client || client.orgId !== ctx.orgId || client.deletedAt) {
    throw new Error("Client not found");
  }

  return db.contract.create({
    data: {
      orgId: ctx.orgId,
      clientId: input.clientId,
      title: input.title,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      autoRenews: input.autoRenews,
      renewalNoticeDays: input.renewalNoticeDays ?? null,
      valueAmount: input.valueAmount ?? null,
      valueCurrency: input.valueCurrency,
      fileUrl: input.fileUrl ?? null,
      createdById: ctx.userId,
    },
  });
}

export async function updateContract(
  ctx: AuthContext,
  id: string,
  input: Partial<ContractInput>
) {
  const existing = await db.contract.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return null;
  assertOwnsResource(ctx, existing.orgId);

  return db.contract.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.autoRenews !== undefined && { autoRenews: input.autoRenews }),
      ...(input.renewalNoticeDays !== undefined && {
        renewalNoticeDays: input.renewalNoticeDays,
      }),
      ...(input.valueAmount !== undefined && { valueAmount: input.valueAmount }),
      ...(input.valueCurrency !== undefined && { valueCurrency: input.valueCurrency }),
      ...(input.fileUrl !== undefined && { fileUrl: input.fileUrl }),
    },
  });
}

export async function softDeleteContract(ctx: AuthContext, id: string) {
  const existing = await db.contract.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return null;
  assertOwnsResource(ctx, existing.orgId);

  return db.contract.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Dashboard aggregation: contracts expiring soon + overdue milestone count. */
export async function getDashboardSummary(ctx: AuthContext) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expiringSoon, overdueMilestones, activeCount, openRiskFlags] = await Promise.all([
    db.contract.findMany({
      where: {
        orgId: ctx.orgId,
        deletedAt: null,
        status: { in: ["active"] },
        endDate: { gte: now, lte: in30Days },
      },
      orderBy: { endDate: "asc" },
      include: { client: { select: { name: true } } },
      take: 10,
    }),
    db.milestone.findMany({
      where: {
        contract: { orgId: ctx.orgId, deletedAt: null },
        status: { in: ["pending", "in_progress"] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      include: { contract: { select: { title: true, id: true } } },
      take: 10,
    }),
    db.contract.count({ where: { orgId: ctx.orgId, deletedAt: null, status: "active" } }),
    db.clauseFlag.count({
      where: {
        dismissed: false,
        riskLevel: "high",
        contract: { orgId: ctx.orgId, deletedAt: null },
      },
    }),
  ]);

  return { expiringSoon, overdueMilestones, activeCount, openRiskFlags };
}
