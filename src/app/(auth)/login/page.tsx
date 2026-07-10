"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verified = searchParams.get("verified");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setIsSubmitting(false);
    if (result?.error) {
      setError(
        result.error.includes("Too many")
          ? result.error
          : "Incorrect email or password, or your email isn't verified yet."
      );
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-xl font-semibold text-ink">ClauseKeeper</span>
        </div>

        <Card>
          <h1 className="mb-1 font-display text-lg text-ink">Welcome back</h1>
          <p className="mb-6 text-sm text-ink-muted">Log in to your account.</p>

          {verified && (
            <div className="mb-4 rounded-input bg-risk-low-surface px-3 py-2 text-sm text-risk-low">
              Email verified — you can log in now.
            </div>
          )}
          {error && (
            <div role="alert" className="mb-4 rounded-input bg-risk-high-surface px-3 py-2 text-sm text-risk-high">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-accent underline underline-offset-2">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink-faint">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-ink-muted">
            No account?{" "}
            <Link href="/signup" className="font-medium text-accent underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Demo login: <span className="font-mono">demo@demo.com</span> / <span className="font-mono">demo1234</span>
        </p>
      </div>
    </div>
  );
}
