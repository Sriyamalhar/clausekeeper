import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { createMilestone } from "@/server/milestones";
import { milestoneSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function POST(req: NextRequest) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = milestoneSchema.parse(body);
    const milestone = await createMilestone(ctx, input);
    await logActivity(ctx, "milestone", milestone.id, "created", { title: milestone.title });
    return NextResponse.json({ milestone }, { status: 201 });
  });
}
