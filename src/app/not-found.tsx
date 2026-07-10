import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <span className="font-mono text-sm text-ink-faint">404</span>
      <h1 className="font-display text-2xl text-ink">This page got filed somewhere else</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
