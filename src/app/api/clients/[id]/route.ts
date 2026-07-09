import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { getClient, updateClient, softDeleteClient } from "@/server/clients";
import { clientSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const client = await getClient(ctx, params.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ client });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = clientSchema.partial().parse(body);
    const client = await updateClient(ctx, params.id, input);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    await logActivity(ctx, "client", client.id, "updated", input);
    return NextResponse.json({ client });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const client = await softDeleteClient(ctx, params.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    await logActivity(ctx, "client", client.id, "deleted", {});
    return NextResponse.json({ message: "Client deleted" });
  });
}
