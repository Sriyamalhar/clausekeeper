"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContracts, useDeleteContract } from "@/lib/hooks/use-contracts";
import { useClients } from "@/lib/hooks/use-clients";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ContractRowSkeleton } from "@/components/ui/skeleton";
import { FileText, Search, Trash2 } from "lucide-react";

function formatMoney(amount: string | null, currency: string) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

function formatDate(iso: string | null) {
  if (!iso) return "No end date";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(searchInput, 300);

  const status = searchParams.get("status") ?? undefined;
  const clientId = searchParams.get("clientId") ?? undefined;
  const sort = (searchParams.get("sort") as "endDate" | "value" | "createdAt") ?? "endDate";
  const order = (searchParams.get("order") as "asc" | "desc") ?? "asc";

  const query = { q: debouncedSearch || undefined, status, clientId, sort, order };
  const { data, isLoading, isError, refetch } = useContracts(query);
  const { data: clientsData } = useClients();
  const deleteContract = useDeleteContract();

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/contracts?${params.toString()}`);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can be restored by contacting support within 30 days.`)) {
      return;
    }
    deleteContract.mutate(id, {
      onSuccess: () => showToast(`"${title}" deleted.`, "success"),
      onError: () => showToast(`Couldn't delete "${title}". Try again.`, "error"),
    });
  }

  const hasActiveFilters = !!(debouncedSearch || status || clientId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Contracts</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data ? `${data.contracts.length} contract${data.contracts.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <Link href="/contracts/new">
          <Button>New contract</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input
            aria-label="Search contracts"
            placeholder="Search by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="h-10 rounded-input border border-border bg-surface-raised px-3 text-sm text-ink"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </select>

        <select
          aria-label="Filter by client"
          value={clientId ?? ""}
          onChange={(e) => updateParams({ clientId: e.target.value || undefined })}
          className="h-10 rounded-input border border-border bg-surface-raised px-3 text-sm text-ink"
        >
          <option value="">All clients</option>
          {clientsData?.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort by"
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [newSort, newOrder] = e.target.value.split(":");
            updateParams({ sort: newSort, order: newOrder });
          }}
          className="h-10 rounded-input border border-border bg-surface-raised px-3 text-sm text-ink"
        >
          <option value="endDate:asc">End date (soonest)</option>
          <option value="endDate:desc">End date (latest)</option>
          <option value="value:desc">Value (highest)</option>
          <option value="createdAt:desc">Recently added</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchInput("");
              router.push("/contracts");
            }}
            className="text-sm text-accent underline underline-offset-2"
          >
            Reset filters
          </button>
        )}
      </div>

      {isError && (
        <ErrorState
          message="Couldn't load contracts. Check your connection and try again."
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <Card className="p-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <ContractRowSkeleton key={i} />
          ))}
        </Card>
      )}

      {data && data.contracts.length === 0 && !hasActiveFilters && (
        <EmptyState
          icon={<FileText size={28} />}
          title="Create your first contract"
          description="Add a client, then attach a contract to track its dates, value, and licensing terms."
          action={
            <Link href="/contracts/new">
              <Button>Create your first contract</Button>
            </Link>
          }
        />
      )}

      {data && data.contracts.length === 0 && hasActiveFilters && (
        <EmptyState
          title="No contracts match these filters"
          description="Try a different search term or clear your filters."
          action={
            <button
              onClick={() => {
                setSearchInput("");
                router.push("/contracts");
              }}
              className="text-sm font-medium text-accent underline underline-offset-2"
            >
              Clear filters
            </button>
          }
        />
      )}

      {data && data.contracts.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-4 py-3 font-medium">Contract</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">End date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="border-b border-border last:border-0 hover:bg-accent-surface/50"
                >
                  <td className="px-4 py-3">
                    <Link href={`/contracts/${contract.id}`} className="font-medium text-ink hover:text-accent">
                      {contract.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{contract.client.name}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">
                    {formatMoney(contract.valueAmount, contract.valueCurrency)}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{formatDate(contract.endDate)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={contract.displayStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(contract.id, contract.title)}
                      aria-label={`Delete ${contract.title}`}
                      className="rounded-input p-1.5 text-ink-faint hover:bg-risk-high-surface hover:text-risk-high"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
