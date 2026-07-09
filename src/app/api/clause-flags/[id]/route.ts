import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { db } from "@/lib/db";
import { clauseTypeSchema, riskLevelSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

const updateSchema = z.object({
  extractedText: z.string().min(1).max(2000).optional(),
  clauseType: clauseTypeSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  dismissed: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = updateSchema.parse(body);

    const flag = await db.clauseFlag.findUnique({
      where: { id: params.id },
      include: { contract: true },
    });
    if (!flag || flag.contract.orgId !== ctx.orgId) {
      return NextResponse.json({ error: "Clause flag not found" }, { status: 404 });
    }

    const updated = await db.clauseFlag.update({
      where: { id: params.id },
      data: input,
    });

    await logActivity(
      ctx,
      "clause_flag",
      updated.id,
      input.dismissed ? "dismissed" : "edited",
      input
    );

    return NextResponse.json({ flag: updated });
  });
}
