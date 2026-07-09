import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { listContracts, createContract } from "@/server/contracts";
import { contractSchema, contractQuerySchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function GET(req: NextRequest) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const { searchParams } = new URL(req.url);
    const query = contractQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await listContracts(ctx, query);
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = contractSchema.parse(body);
    const contract = await createContract(ctx, input);
    await logActivity(ctx, "contract", contract.id, "created", { title: contract.title });
    return NextResponse.json({ contract }, { status: 201 });
  });
}
