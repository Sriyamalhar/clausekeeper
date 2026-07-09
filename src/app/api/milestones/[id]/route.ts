import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { updateMilestone, deleteMilestone } from "@/server/milestones";
import { milestoneSchema } from "@/types/schemas";
import { logActivity } from "@/server/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const body = await req.json();
    const input = milestoneSchema.partial().parse(body);
    const milestone = await updateMilestone(ctx, params.id, input);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    await logActivity(ctx, "milestone", milestone.id, "updated", input);
    return NextResponse.json({ milestone });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const milestone = await deleteMilestone(ctx, params.id);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    await logActivity(ctx, "milestone", params.id, "deleted", {});
    return NextResponse.json({ message: "Milestone deleted" });
  });
}
