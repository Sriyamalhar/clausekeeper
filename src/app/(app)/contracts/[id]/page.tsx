"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useContract,
  useUploadContractFile,
  useExtractClauses,
  useDismissClauseFlag,
  useCreateMilestone,
  useUpdateMilestoneStatus,
} from "@/lib/hooks/use-contract-detail";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { RiskTab } from "@/components/ui/risk-tab";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CLAUSE_TYPE_LABELS } from "@/lib/clause-labels";
import { Upload, Sparkles, Plus, X } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "No end date";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatMoney(amount: string | null, currency: string) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useContract(params.id);
  const { showToast } = useToast();

  const uploadFile = useUploadContractFile(params.id);
  const extractClauses = useExtractClauses(params.id);
  const dismissFlag = useDismissClauseFlag(params.id);
  const createMilestone = useCreateMilestone(params.id);
  const updateMilestoneStatus = useUpdateMilestoneStatus(params.id);

  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  if (isError) {
    return <ErrorState message="Couldn't load this contract. Check your connection and try again." onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const contract = data.contract;
  const activeFlags = contract.clauseFlags.filter((f) => !f.dismissed);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile.mutate(file, {
      onSuccess: () => showToast("Contract PDF uploaded.", "success"),
      onError: (err) => showToast(err instanceof Error ? err.message : "Upload failed.", "error"),
    });
  }

  function handleExtract() {
    extractClauses.mutate(undefined, {
      onSuccess: (result) =>
        showToast(
          result.flags.length > 0
            ? `Found ${result.flags.length} clause${result.flags.length === 1 ? "" : "s"} to review.`
            : "No flagged clauses found in this document.",
          "success"
        ),
      onError: (err) => showToast(err instanceof Error ? err.message : "Extraction failed.", "error"),
    });
  }

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.dueDate) return;
    createMilestone.mutate(newMilestone, {
      onSuccess: () => {
        showToast("Milestone added.", "success");
        setNewMilestone({ title: "", dueDate: "" });
        setShowMilestoneForm(false);
      },
      onError: (err) => showToast(err instanceof Error ? err.message : "Couldn't add milestone.", "error"),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-ink">{contract.title}</h1>
            <StatusPill status={contract.displayStatus} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">{contract.client.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <h2 className="mb-4 font-display text-lg text-ink">Contract details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">Start date</dt>
              <dd className="font-mono text-ink">{formatDate(contract.startDate)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">End date</dt>
              <dd className="font-mono text-ink">{formatDate(contract.endDate)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Value</dt>
              <dd className="font-mono text-ink">{formatMoney(contract.valueAmount, contract.valueCurrency)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Auto-renews</dt>
              <dd className="text-ink">
                {contract.autoRenews
                  ? `Yes — ${contract.renewalNoticeDays ?? "?"} days notice required`
                  : "No"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg text-ink">Contract file</h2>
          {contract.fileUrl ? (
            <div className="flex flex-col gap-3">
              <a
                href={contract.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent underline underline-offset-2"
              >
                View uploaded PDF
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExtract}
                disabled={extractClauses.isPending}
              >
                <Sparkles size={14} />
                {extractClauses.isPending ? "Analyzing…" : "Re-run clause analysis"}
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-input border border-dashed border-border py-6 text-center text-sm text-ink-muted hover:bg-accent-surface">
              <Upload size={20} />
              {uploadFile.isPending ? "Uploading…" : "Upload contract PDF"}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadFile.isPending}
              />
            </label>
          )}
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Clause flags</h2>
          {contract.fileUrl && !activeFlags.length && (
            <Button size="sm" onClick={handleExtract} disabled={extractClauses.isPending}>
              <Sparkles size={14} />
              {extractClauses.isPending ? "Analyzing…" : "Run clause analysis"}
            </Button>
          )}
        </div>

        {activeFlags.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} />}
            title={contract.fileUrl ? "No clauses flagged yet" : "Upload a contract PDF to get started"}
            description="Once analyzed, usage-rights, exclusivity, licensing-renewal, payment, and termination clauses will be flagged here for review."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeFlags.map((flag) => (
              <Card key={flag.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <RiskTab level={flag.riskLevel} label={CLAUSE_TYPE_LABELS[flag.clauseType]} />
                  <p className="text-sm text-ink">{flag.extractedText}</p>
                </div>
                <button
                  onClick={() => dismissFlag.mutate(flag.id)}
                  aria-label="Dismiss this flag"
                  className="shrink-0 rounded-input p-1 text-ink-faint hover:bg-border/40"
                >
                  <X size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Milestones</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowMilestoneForm((v) => !v)}>
            <Plus size={14} />
            Add milestone
          </Button>
        </div>

        {showMilestoneForm && (
          <Card className="mb-3">
            <form onSubmit={handleAddMilestone} className="flex items-end gap-3">
              <Input
                label="Title"
                placeholder="e.g. Final delivery"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone((v) => ({ ...v, title: e.target.value }))}
                required
              />
              <Input
                label="Due date"
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone((v) => ({ ...v, dueDate: e.target.value }))}
                required
              />
              <Button type="submit" disabled={createMilestone.isPending}>
                {createMilestone.isPending ? "Adding…" : "Add"}
              </Button>
            </form>
          </Card>
        )}

        {contract.milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description="Add payment or deliverable milestones to track what's coming due."
          />
        ) : (
          <Card className="divide-y divide-border p-0">
            {contract.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={milestone.status === "done"}
                    onChange={(e) =>
                      updateMilestoneStatus.mutate({
                        id: milestone.id,
                        status: e.target.checked ? "done" : "pending",
                      })
                    }
                    className="h-4 w-4 accent-accent"
                    aria-label={`Mark ${milestone.title} as done`}
                  />
                  <span className={milestone.status === "done" ? "text-ink-faint line-through" : "text-ink"}>
                    {milestone.title}
                  </span>
                </div>
                <span className="font-mono text-xs text-ink-muted">{formatDate(milestone.dueDate)}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
