import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/server/activity";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ["application/pdf"];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();

    // Uploads + AI calls are expensive — rate-limit distinctly from login.
    const limitResult = rateLimit(`upload:${ctx.orgId}`, 20, 60 * 60 * 1000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Upload limit reached. Try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const contract = await db.contract.findUnique({ where: { id: params.id } });
    if (!contract || contract.deletedAt || contract.orgId !== ctx.orgId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 15MB limit" },
        { status: 400 }
      );
    }

    const blob = await put(`contracts/${ctx.orgId}/${contract.id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    const updated = await db.contract.update({
      where: { id: contract.id },
      data: { fileUrl: blob.url },
    });

    await logActivity(ctx, "contract", contract.id, "file_uploaded", {
      fileName: file.name,
    });

    return NextResponse.json({ contract: updated });
  });
}
