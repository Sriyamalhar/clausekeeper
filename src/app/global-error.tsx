"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[unhandled_render_error]", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
          <h1 className="font-display text-2xl text-ink">Something on our end broke</h1>
          <p className="max-w-sm text-sm text-ink-muted">
            The error&apos;s been logged. Try refreshing — if it keeps happening, let us know what you were doing.
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
