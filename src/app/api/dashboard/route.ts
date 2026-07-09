import { NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { getDashboardSummary } from "@/server/contracts";

export async function GET() {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();
    const summary = await getDashboardSummary(ctx);
    return NextResponse.json(summary);
  });
}
