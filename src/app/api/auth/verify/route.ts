import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  const record = await db.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=expired-link", req.url));
  }

  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    // Single-use: delete immediately after a successful check.
    db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ]);

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
