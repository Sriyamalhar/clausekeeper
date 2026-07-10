"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error";
  undo?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, variant?: "success" | "error", undo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" = "success", undo?: () => void) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant, undo }]);
      // Errors stay until dismissed manually; successes auto-dismiss ~4s.
      if (variant === "success") {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      }
    },
    []
  );

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "flex items-center gap-3 rounded-input border px-4 py-3 text-sm shadow-md",
              "animate-in slide-in-from-bottom-2 duration-std",
              toast.variant === "success"
                ? "border-accent/30 bg-accent-surface text-ink"
                : "border-risk-high/30 bg-risk-high-surface text-ink"
            )}
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo?.();
                  dismiss(toast.id);
                }}
                className="font-medium text-accent underline underline-offset-2"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="text-ink-faint"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
