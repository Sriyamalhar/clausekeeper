import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError } from "@/server/authz";
import { ZodError } from "zod";

/**
 * Wrap route handler bodies with this so auth/validation errors map to the
 * right status code in one place, instead of each route reimplementing it.
 *
 * Usage:
 *   export async function POST(req: NextRequest) {
 *     return handleApiErrors(async () => { ...route logic... });
 *   }
 */
export async function handleApiErrors<T>(
  fn: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: err.flatten() },
        { status: 400 }
      );
    }
    // eslint-disable-next-line no-console
    console.error("[api_error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
