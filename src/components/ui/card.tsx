import { HTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-card border border-border bg-surface-raised p-6 shadow-[0_1px_2px_rgba(22,27,38,0.04),0_4px_12px_rgba(22,27,38,0.04)]",
        className
      )}
      {...props}
    />
  );
}
