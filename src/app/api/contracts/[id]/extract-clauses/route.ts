import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/authz";
import { handleApiErrors } from "@/server/api-error-handler";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { extractTextFromPdf } from "@/server/pdf";
import { extractClauseFlags } from "@/server/ai-clause-extraction";
import { logActivity } from "@/server/activity";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiErrors(async () => {
    const ctx = await requireAuth();

    const limitResult = rateLimit(`extract:${ctx.orgId}`, 20, 60 * 60 * 1000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Extraction limit reached. Try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const contract = await db.contract.findUnique({ where: { id: params.id } });
    if (!contract || contract.deletedAt || contract.orgId !== ctx.orgId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (!contract.fileUrl) {
      return NextResponse.json(
        { error: "Upload a contract PDF before running extraction." },
        { status: 400 }
      );
    }

    const pdfResponse = await fetch(contract.fileUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Could not retrieve the uploaded file." },
        { status: 502 }
      );
    }
    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    const { text, truncated } = await extractTextFromPdf(buffer);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "No readable text found in this PDF. It may be a scanned image without OCR." },
        { status: 422 }
      );
    }

    const extraction = await extractClauseFlags(text);

    // Replace any prior (non-dismissed) flags from a previous extraction run
    // with the fresh set, in a single transaction.
    const flags = await db.$transaction(async (tx) => {
      await tx.clauseFlag.deleteMany({
        where: { contractId: contract.id, dismissed: false },
      });
      if (extraction.flags.length === 0) return [];
      await tx.clauseFlag.createMany({
        data: extraction.flags.map((f) => ({
          contractId: contract.id,
          clauseType: f.clauseType,
          extractedText: f.extractedText,
          riskLevel: f.riskLevel,
          aiConfidence: f.confidence,
        })),
      });
      return tx.clauseFlag.findMany({
        where: { contractId: contract.id, dismissed: false },
        orderBy: { riskLevel: "desc" },
      });
    });

    await logActivity(ctx, "contract", contract.id, "clauses_extracted", {
      flagCount: flags.length,
      truncated,
    });

    return NextResponse.json({ flags, truncated });
  });
}
