"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClients, useCreateClient } from "@/lib/hooks/use-clients";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't create contract.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export default function NewContractPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: clientsData } = useClients();
  const createClient = useCreateClient();
  const createContract = useCreateContract();

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    startDate: "",
    endDate: "",
    autoRenews: false,
    renewalNoticeDays: "",
    valueAmount: "",
    valueCurrency: "USD",
  });

  async function handleQuickAddClient() {
    if (!newClientName.trim()) return;
    createClient.mutate(
      { name: newClientName },
      {
        onSuccess: (result) => {
          setForm((f) => ({ ...f, clientId: result.client.id }));
          setNewClientName("");
          setShowNewClient(false);
          showToast("Client added.", "success");
        },
        onError: () => showToast("Couldn't add client.", "error"),
      }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!form.clientId) nextErrors.clientId = "Choose or add a client";
    if (!form.title) nextErrors.title = "Title is required";
    if (!form.startDate) nextErrors.startDate = "Start date is required";
    if (form.autoRenews && !form.renewalNoticeDays) {
      nextErrors.renewalNoticeDays = "Required when auto-renew is on";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    createContract.mutate(
      {
        clientId: form.clientId,
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        autoRenews: form.autoRenews,
        renewalNoticeDays: form.renewalNoticeDays ? Number(form.renewalNoticeDays) : undefined,
        valueAmount: form.valueAmount ? Number(form.valueAmount) : undefined,
        valueCurrency: form.valueCurrency,
      },
      {
        onSuccess: (result) => {
          showToast("Contract created.", "success");
          router.push(`/contracts/${result.contract.id}`);
        },
        onError: (err) =>
          showToast(err instanceof Error ? err.message : "Couldn't create contract.", "error"),
      }
    );
  }

  return (
    <div className="max-w-prose">
      <h1 className="font-display text-2xl text-ink">New contract</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Add the basics now — you can upload the PDF and run clause analysis after.
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink">Client</label>
            <div className="mt-1.5 flex gap-2">
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="h-10 flex-1 rounded-input border border-border bg-surface-raised px-3 text-sm text-ink"
                aria-invalid={!!errors.clientId}
              >
                <option value="">Select a client…</option>
                {clientsData?.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewClient((v) => !v)}>
                <Plus size={14} />
                New
              </Button>
            </div>
            {errors.clientId && <p className="mt-1 text-xs text-risk-high">{errors.clientId}</p>}

            {showNewClient && (
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Button type="button" size="sm" onClick={handleQuickAddClient} disabled={createClient.isPending}>
                  Add
                </Button>
              </div>
            )}
          </div>

          <Input
            label="Contract title"
            placeholder="e.g. Product launch video — Acme Co."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              error={errors.startDate}
            />
            <Input
              label="End date (optional)"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contract value (optional)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.valueAmount}
              onChange={(e) => setForm((f) => ({ ...f, valueAmount: e.target.value }))}
            />
            <Input
              label="Currency"
              value={form.valueCurrency}
              onChange={(e) => setForm((f) => ({ ...f, valueCurrency: e.target.value.toUpperCase() }))}
              maxLength={3}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.autoRenews}
              onChange={(e) => setForm((f) => ({ ...f, autoRenews: e.target.checked }))}
              className="h-4 w-4 accent-accent"
            />
            This contract auto-renews
          </label>

          {form.autoRenews && (
            <Input
              label="Renewal notice period (days)"
              type="number"
              min="0"
              value={form.renewalNoticeDays}
              onChange={(e) => setForm((f) => ({ ...f, renewalNoticeDays: e.target.value }))}
              error={errors.renewalNoticeDays}
            />
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" disabled={createContract.isPending}>
              {createContract.isPending ? "Creating…" : "Create contract"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
