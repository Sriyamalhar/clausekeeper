"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ContractListItem {
  id: string;
  title: string;
  status: string;
  displayStatus: "draft" | "active" | "expiring" | "expired" | "terminated";
  startDate: string;
  endDate: string | null;
  valueAmount: string | null;
  valueCurrency: string;
  client: { id: string; name: string };
}

export interface ContractsQuery {
  q?: string;
  status?: string;
  clientId?: string;
  sort?: "endDate" | "value" | "createdAt";
  order?: "asc" | "desc";
  cursor?: string;
}

async function fetchContracts(query: ContractsQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const res = await fetch(`/api/contracts?${params.toString()}`);
  if (!res.ok) throw new Error("Couldn't load contracts. Check your connection and try again.");
  return res.json() as Promise<{ contracts: ContractListItem[]; nextCursor: string | null }>;
}

export function useContracts(query: ContractsQuery) {
  return useQuery({
    queryKey: ["contracts", query],
    queryFn: () => fetchContracts(query),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't delete this contract.");
      return res.json();
    },
    // Optimistic removal — this is a reversible action from the user's
    // perspective (soft delete), so we update the list immediately and
    // roll back on failure rather than blocking on a round trip.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["contracts"] });
      const previous = queryClient.getQueriesData({ queryKey: ["contracts"] });
      queryClient.setQueriesData(
        { queryKey: ["contracts"] },
        (old: { contracts: ContractListItem[]; nextCursor: string | null } | undefined) =>
          old
            ? { ...old, contracts: old.contracts.filter((c) => c.id !== id) }
            : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
