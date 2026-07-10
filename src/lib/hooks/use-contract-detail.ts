"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ClauseFlag {
  id: string;
  clauseType: string;
  extractedText: string;
  riskLevel: "low" | "medium" | "high";
  aiConfidence: number | null;
  dismissed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  amount: string | null;
}

export interface ContractDetail {
  id: string;
  title: string;
  status: string;
  displayStatus: "draft" | "active" | "expiring" | "expired" | "terminated";
  startDate: string;
  endDate: string | null;
  autoRenews: boolean;
  renewalNoticeDays: number | null;
  valueAmount: string | null;
  valueCurrency: string;
  fileUrl: string | null;
  client: { id: string; name: string };
  milestones: Milestone[];
  clauseFlags: ClauseFlag[];
}

async function fetchContract(id: string): Promise<{ contract: ContractDetail }> {
  const res = await fetch(`/api/contracts/${id}`);
  if (!res.ok) throw new Error("Couldn't load this contract. Check your connection and try again.");
  return res.json();
}

export function useContract(id: string) {
  return useQuery({ queryKey: ["contract", id], queryFn: () => fetchContract(id) });
}

export function useUploadContractFile(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/contracts/${contractId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contract", contractId] }),
  });
}

export function useExtractClauses(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}/extract-clauses`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Extraction failed.");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contract", contractId] }),
  });
}

export function useDismissClauseFlag(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flagId: string) => {
      const res = await fetch(`/api/clause-flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      if (!res.ok) throw new Error("Couldn't dismiss this flag.");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contract", contractId] }),
  });
}

export function useCreateMilestone(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; dueDate: string; amount?: number }) => {
      const res = await fetch(`/api/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, contractId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't create milestone.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateMilestoneStatus(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Couldn't update milestone.");
      return res.json();
    },
    // Optimistic — toggling milestone status is a high-success, reversible action.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["contract", contractId] });
      const previous = queryClient.getQueryData<{ contract: ContractDetail }>([
        "contract",
        contractId,
      ]);
      if (previous) {
        queryClient.setQueryData(["contract", contractId], {
          contract: {
            ...previous.contract,
            milestones: previous.contract.milestones.map((m) =>
              m.id === id ? { ...m, status } : m
            ),
          },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["contract", contractId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
