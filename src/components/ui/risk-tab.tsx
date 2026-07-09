import { clsx } from "@/lib/clsx";

type RiskLevel = "low" | "medium" | "high";

const RISK_CONFIG: Record<RiskLevel, { color: string; surface: string; label: string }> = {
  low: { color: "text-risk-low", surface: "bg-risk-low-surface", label: "Low risk" },
  medium: { color: "text-risk-medium", surface: "bg-risk-medium-surface", label: "Medium risk" },
  high: { color: "text-risk-high", surface: "bg-risk-high-surface", label: "High risk" },
};

/**
 * The signature element: renders like a physical sticky-note tab poking out
 * of a folder — the exact gesture a freelancer makes when flagging a page
 * in a printed contract, translated into the interface. Used on contract
 * cards (aggregate) and clause flag rows (individual).
 */
export function RiskTab({
  level,
  label,
  className,
}: {
  level: RiskLevel;
  label?: string;
  className?: string;
}) {
  const config = RISK_CONFIG[level];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-l-md rounded-r-sm px-2.5 py-1 text-xs font-medium",
        config.surface,
        config.color,
        className
      )}
      style={{
        // A subtle notch on the right edge, like a die-cut tab.
        clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)",
        paddingRight: "14px",
      }}
    >
      {label ?? config.label}
    </span>
  );
}
