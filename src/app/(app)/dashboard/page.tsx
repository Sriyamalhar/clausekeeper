"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Clock, AlertTriangle } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          What needs your attention this week.
        </p>
      </div>

      {isError && (
        <ErrorState
          message="Couldn't load your dashboard. Check your connection and try again."
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </Card>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-ink-muted">Active contracts</p>
              <p className="mt-2 font-mono text-2xl text-ink">{data.activeCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-ink-muted">Expiring in 30 days</p>
              <p className="mt-2 font-mono text-2xl text-ink">
                {data.expiringSoon.length}
              </p>
            </Card>
            <Card className={data.openRiskFlags > 0 ? "border-risk-high/30" : ""}>
              <p className="text-sm text-ink-muted">Open high-risk flags</p>
              <p
                className={`mt-2 font-mono text-2xl ${
                  data.openRiskFlags > 0 ? "text-risk-high" : "text-ink"
                }`}
              >
                {data.openRiskFlags}
              </p>
            </Card>
          </div>

          <section>
            <h2 className="mb-3 font-display text-lg text-ink">Expiring soon</h2>
            {data.expiringSoon.length === 0 ? (
              <EmptyState
                icon={<Clock size={28} />}
                title="Nothing expiring in the next 30 days"
                description="Contracts approaching their end date or renewal deadline will show up here."
              />
            ) : (
              <Card className="divide-y divide-border p-0">
                {data.expiringSoon.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors duration-micro hover:bg-accent-surface"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{contract.title}</p>
                      <p className="text-xs text-ink-muted">{contract.client.name}</p>
                    </div>
                    <span className="font-mono text-xs text-risk-medium">
                      ends {formatDate(contract.endDate)}
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg text-ink">Overdue milestones</h2>
            {data.overdueMilestones.length === 0 ? (
              <EmptyState
                icon={<FileText size={28} />}
                title="No overdue milestones"
                description="Payment and deliverable milestones past their due date will show up here."
              />
            ) : (
              <Card className="divide-y divide-border p-0">
                {data.overdueMilestones.map((milestone) => (
                  <Link
                    key={milestone.id}
                    href={`/contracts/${milestone.contract.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors duration-micro hover:bg-risk-high-surface"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-risk-high" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-ink">{milestone.title}</p>
                        <p className="text-xs text-ink-muted">{milestone.contract.title}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-risk-high">
                      due {formatDate(milestone.dueDate)}
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </section>

          {data.activeCount === 0 && (
            <EmptyState
              title="Add your first contract"
              description="Once you add a client and a contract, your dashboard fills in with what needs attention."
              action={
                <Button onClick={() => (window.location.href = "/contracts/new")}>
                  Add your first contract
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
