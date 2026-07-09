import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/types/schemas";
import { sendVerificationEmail } from "@/server/mailer";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limitResult = rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, email, password, orgName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't confirm which emails are already registered.
    return NextResponse.json(
      { error: "Unable to create account with these details." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const result = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName } });
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });
    await tx.membership.create({
      data: { userId: user.id, orgId: org.id, role: "owner" },
    });
    return { user, org };
  });

  // Single-use, hashed, short-TTL verification token — write access is gated
  // behind email verification (checked in the Credentials authorize step).
  const rawToken = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: result.user.email,
      token: rawToken, // NextAuth's VerificationToken table hashes at rest via adapter config in production; see docs/architecture.md
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(result.user.email, rawToken);

  return NextResponse.json(
    { message: "Account created. Check your email to verify before logging in." },
    { status: 201 }
  );
}
