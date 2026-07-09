import { db } from "@/lib/db";
import { AuthContext, assertOwnsResource } from "@/server/authz";
import { ClientInput } from "@/types/schemas";

export async function listClients(ctx: AuthContext) {
  return db.client.findMany({
    where: { orgId: ctx.orgId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function getClient(ctx: AuthContext, id: string) {
  const client = await db.client.findUnique({ where: { id } });
  if (!client || client.deletedAt) return null;
  assertOwnsResource(ctx, client.orgId);
  return client;
}

export async function createClient(ctx: AuthContext, input: ClientInput) {
  return db.client.create({
    data: {
      orgId: ctx.orgId,
      name: input.name,
      contactEmail: input.contactEmail || null,
      contactName: input.contactName || null,
      notes: input.notes || null,
    },
  });
}

export async function updateClient(
  ctx: AuthContext,
  id: string,
  input: Partial<ClientInput>
) {
  const existing = await getClient(ctx, id); // throws if wrong org, null if missing
  if (!existing) return null;

  return db.client.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail || null }),
      ...(input.contactName !== undefined && { contactName: input.contactName || null }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
}

export async function softDeleteClient(ctx: AuthContext, id: string) {
  const existing = await getClient(ctx, id);
  if (!existing) return null;

  // Refuse deletion if active contracts still reference this client — an
  // explicit business rule rather than letting a cascade silently orphan data.
  const activeContractCount = await db.contract.count({
    where: { clientId: id, deletedAt: null, status: { in: ["active", "expiring"] } },
  });
  if (activeContractCount > 0) {
    throw new Error(
      `Cannot delete client with ${activeContractCount} active contract(s). Archive or close those contracts first.`
    );
  }

  return db.client.update({ where: { id }, data: { deletedAt: new Date() } });
}
