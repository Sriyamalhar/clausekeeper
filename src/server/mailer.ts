// Thin mailer abstraction so swapping providers (Resend, Postmark, SES) is a
// one-file change. In local dev without an API key configured, emails are
// logged instead of sent so the flow is still testable end to end.

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(`[mailer:dev] To: ${to}\nSubject: ${subject}\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "ClauseKeeper <no-reply@clausekeeper.app>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mailer request failed: ${res.status}`);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(
    email
  )}`;
  await send(
    email,
    "Verify your ClauseKeeper email",
    `<p>Welcome to ClauseKeeper. Confirm your email to activate your account:</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>
     <p>This link expires in 24 hours.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(
    email
  )}`;
  await send(
    email,
    "Reset your ClauseKeeper password",
    `<p>Reset your password using the link below. If you didn't request this, ignore this email.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>This link expires in 30 minutes and can only be used once.</p>`
  );
}
