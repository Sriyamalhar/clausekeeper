import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-input font-medium",
          "transition-colors duration-micro ease-standard",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
          // 44px min tap target on touch — enforced via padding at md size,
          // explicit min-height fallback for the sm variant on touch devices.
          "min-h-[44px] sm:min-h-0",
          variant === "primary" &&
            "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
          variant === "secondary" &&
            "bg-surface-raised text-ink border border-border hover:bg-accent-surface",
          variant === "ghost" &&
            "text-ink-muted hover:bg-surface-raised hover:text-ink",
          variant === "danger" &&
            "bg-surface-raised text-risk-high border border-risk-high/30 hover:bg-risk-high-surface",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
