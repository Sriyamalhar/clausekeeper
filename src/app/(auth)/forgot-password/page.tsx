"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch("/api/auth/reset-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-lg text-ink">Reset your password</h1>
        {submitted ? (
          <p className="text-sm text-ink-muted">
            If <strong>{email}</strong> is registered, we&apos;ve sent a reset link. It expires in 30 minutes.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-muted">
              We&apos;ll email you a link to reset it.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
        <Link href="/login" className="mt-6 block text-center text-sm text-accent underline underline-offset-2">
          Back to login
        </Link>
      </Card>
    </div>
  );
}
