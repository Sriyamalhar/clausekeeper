import { db } from "@/lib/db";
import { AuthContext } from "@/server/authz";
import { MilestoneInput } from "@/types/schemas";

async function assertContractInOrg(ctx: AuthContext, contractId: string) {
  const contract = await db.contract.findUnique({ where: { id: contractId } });
  if (!contract || contract.deletedAt || contract.orgId !== ctx.orgId) {
    throw new Error("Contract not found");
  }
  return contract;
}

export async function createMilestone(ctx: AuthContext, input: MilestoneInput) {
  await assertContractInOrg(ctx, input.contractId);
  return db.milestone.create({
    data: {
      contractId: input.contractId,
      title: input.title,
      dueDate: input.dueDate,
      status: input.status,
      amount: input.amount ?? null,
    },
  });
}

export async function updateMilestone(
  ctx: AuthContext,
  id: string,
  input: Partial<MilestoneInput>
) {
  const existing = await db.milestone.findUnique({ where: { id } });
  if (!existing) return null;
  await assertContractInOrg(ctx, existing.contractId);

  return db.milestone.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.amount !== undefined && { amount: input.amount }),
    },
  });
}

export async function deleteMilestone(ctx: AuthContext, id: string) {
  const existing = await db.milestone.findUnique({ where: { id } });
  if (!existing) return null;
  await assertContractInOrg(ctx, existing.contractId);
  return db.milestone.delete({ where: { id } });
}
