"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "@/lib/clsx";
import { LayoutDashboard, FileText, Users, Settings, LogOut, Command } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-shell">
        <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-border px-3 py-6">
          <div className="px-2 pb-8">
            <span className="font-display text-lg font-semibold text-ink">
              ClauseKeeper
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-input px-3 py-2 text-sm font-medium transition-colors duration-micro",
                    active
                      ? "bg-accent-surface text-accent"
                      : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="mb-2 flex items-center gap-2 rounded-input px-3 py-2 text-xs text-ink-faint hover:bg-surface-raised"
            aria-label="Open command palette"
          >
            <Command size={14} aria-hidden />
            <span>Cmd+K to search</span>
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 rounded-input px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            <LogOut size={18} aria-hidden />
            Sign out
          </button>
        </aside>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
