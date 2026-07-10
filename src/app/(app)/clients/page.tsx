"use client";

import { useState } from "react";
import { useClients, useCreateClient } from "@/lib/hooks/use-clients";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus } from "lucide-react";

export default function ClientsPage() {
  const { data, isLoading, isError, refetch } = useClients();
  const createClient = useCreateClient();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", contactEmail: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createClient.mutate(form, {
      onSuccess: () => {
        showToast("Client added.", "success");
        setForm({ name: "", contactName: "", contactEmail: "" });
        setShowForm(false);
      },
      onError: () => showToast("Couldn't add client.", "error"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Clients</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data ? `${data.clients.length} client${data.clients.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} />
          Add client
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Input
              label="Client / studio name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Contact name (optional)"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            />
            <Input
              label="Contact email (optional)"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
            <div className="col-span-3">
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? "Adding…" : "Add client"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isError && (
        <ErrorState message="Couldn't load clients. Check your connection and try again." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <Card className="p-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ))}
        </Card>
      )}

      {data && data.clients.length === 0 && (
        <EmptyState
          icon={<Users size={28} />}
          title="Add your first client"
          description="Clients are who your contracts belong to. Add one to get started."
          action={<Button onClick={() => setShowForm(true)}>Add your first client</Button>}
        />
      )}

      {data && data.clients.length > 0 && (
        <Card className="divide-y divide-border p-0">
          {data.clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-ink">{client.name}</p>
                {client.contactName && <p className="text-xs text-ink-muted">{client.contactName}</p>}
              </div>
              {client.contactEmail && (
                <span className="text-xs text-ink-muted">{client.contactEmail}</span>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
