import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-16 px-6 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && (
        <p className="max-w-prose text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
