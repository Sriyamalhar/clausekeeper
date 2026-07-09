import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { getContract, updateContract, softDeleteContract } from "@/server/contracts";
import { contractSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const contract = await getContract(ctx, params.id);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    return NextResponse.json({ contract });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = contractSchema.partial().parse(body);
    const contract = await updateContract(ctx, params.id, input);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    await logActivity(ctx, "contract", contract.id, "updated", input);
    // Return the mutated record directly so the client reconciles state
    // without a second round-trip GET.
    return NextResponse.json({ contract });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const contract = await softDeleteContract(ctx, params.id);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    await logActivity(ctx, "contract", contract.id, "deleted", {});
    return NextResponse.json({ message: "Contract deleted" });
  });
}
