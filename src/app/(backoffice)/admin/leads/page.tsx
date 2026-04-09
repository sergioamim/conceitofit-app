import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { logger } from "@/lib/shared/logger";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { LeadsContent } from "./components/leads-content";
import type { LeadB2b, LeadB2bStats } from "@/lib/shared/types/lead-b2b";

async function Loader() {
  let leads: LeadB2b[] = [];
  let stats: LeadB2bStats | null = null;

  try {
    const [leadsRes, statsRes] = await Promise.all([
      serverFetch<LeadB2b[] | { content: LeadB2b[] }>("/api/v1/admin/leads", {
        next: { revalidate: 0 },
      }),
      serverFetch<LeadB2bStats>("/api/v1/admin/leads/stats", {
        next: { revalidate: 0 },
      }),
    ]);
    leads = Array.isArray(leadsRes) ? leadsRes : (leadsRes?.content ?? []);
    stats = statsRes;
  } catch (error) {
    logger.warn("[AdminLeadsPage] SSR fetch failed, falling back to client", {
      module: "AdminLeadsPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <LeadsContent initialLeads={leads} initialStats={stats} />;
}

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
