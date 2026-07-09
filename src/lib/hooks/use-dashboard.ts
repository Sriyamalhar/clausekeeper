"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardSummary {
  expiringSoon: Array<{
    id: string;
    title: string;
    endDate: string;
    client: { name: string };
  }>;
  overdueMilestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    contract: { id: string; title: string };
  }>;
  activeCount: number;
  openRiskFlags: number;
}

async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) {
    throw new Error("Couldn't load your dashboard. Check your connection and try again.");
  }
  return res.json();
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
}
