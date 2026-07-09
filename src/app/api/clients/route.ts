import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { listClients, createClient } from "@/server/clients";
import { clientSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function GET() {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const clients = await listClients(ctx);
    return NextResponse.json({ clients });
  });
}

export async function POST(req: NextRequest) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = clientSchema.parse(body);
    const client = await createClient(ctx, input);
    await logActivity(ctx, "client", client.id, "created", { name: client.name });
    return NextResponse.json({ client }, { status: 201 });
  });
}
