import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const confirmSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, token, newPassword } = parsed.data;
  const identifier = `reset:${email}`;
  const hashedToken = hashToken(token);

  const record = await db.verificationToken.findFirst({
    where: { identifier, token: hashedToken },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({ where: { email }, data: { passwordHash } }),
    // Single-use: delete immediately so the token can't be replayed.
    db.verificationToken.delete({
      where: { identifier_token: { identifier, token: hashedToken } },
    }),
  ]);

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
