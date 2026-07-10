import { clsx } from "@/lib/clsx";

type DisplayStatus = "draft" | "active" | "expiring" | "expired" | "terminated";

const STATUS_CONFIG: Record<DisplayStatus, { color: string; surface: string; label: string }> = {
  draft: { color: "text-ink-muted", surface: "bg-border/40", label: "Draft" },
  active: { color: "text-risk-low", surface: "bg-risk-low-surface", label: "Active" },
  expiring: { color: "text-risk-medium", surface: "bg-risk-medium-surface", label: "Expiring soon" },
  expired: { color: "text-risk-high", surface: "bg-risk-high-surface", label: "Expired" },
  terminated: { color: "text-ink-faint", surface: "bg-border/40", label: "Terminated" },
};

export function StatusPill({ status }: { status: DisplayStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium",
        config.surface,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
