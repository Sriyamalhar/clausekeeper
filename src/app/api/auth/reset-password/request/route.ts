import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/server/mailer";
import { z } from "zod";

const requestSchema = z.object({ email: z.string().email() });

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email } = parsed.data;

  const limitResult = rateLimit(`reset:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always return the same success response whether or not the email
  // exists — prevents account enumeration via this endpoint.
  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    await db.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: hashToken(rawToken), // hashed at rest — plaintext never stored
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await sendPasswordResetEmail(email, rawToken);
  }

  return NextResponse.json({
    message: "If that email is registered, a reset link has been sent.",
  });
}
