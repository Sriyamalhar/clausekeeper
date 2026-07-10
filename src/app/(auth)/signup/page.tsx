"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", orgName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      if (body.issues) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(body.issues.fieldErrors ?? {}).forEach(([key, msgs]) => {
          if (Array.isArray(msgs) && msgs[0]) fieldErrors[key] = msgs[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: body.error ?? "Something went wrong. Try again." });
      }
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <Card className="max-w-sm text-center">
          <h1 className="mb-2 font-display text-lg text-ink">Check your email</h1>
          <p className="text-sm text-ink-muted">
            We sent a verification link to <strong>{form.email}</strong>. Click it to activate your
            account, then log in.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-accent underline underline-offset-2">
            Back to login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-xl font-semibold text-ink">ClauseKeeper</span>
        </div>

        <Card>
          <h1 className="mb-1 font-display text-lg text-ink">Create your account</h1>
          <p className="mb-6 text-sm text-ink-muted">
            Track contracts, licensing terms, and deadlines in one place.
          </p>

          {errors.form && (
            <div role="alert" className="mb-4 rounded-input bg-risk-high-surface px-3 py-2 text-sm text-risk-high">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
              required
            />
            <Input
              label="Studio / business name"
              placeholder="e.g. Rivera Films"
              value={form.orgName}
              onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
              error={errors.orgName}
              required
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={errors.password}
              hint={!errors.password ? "At least 8 characters, one uppercase letter, one number" : undefined}
              required
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent underline underline-offset-2">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
