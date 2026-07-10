"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ClientListItem {
  id: string;
  name: string;
  contactEmail: string | null;
  contactName: string | null;
}

async function fetchClients(): Promise<{ clients: ClientListItem[] }> {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("Couldn't load clients. Check your connection and try again.");
  return res.json();
}

export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: fetchClients });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; contactEmail?: string; contactName?: string }) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't create client.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}
