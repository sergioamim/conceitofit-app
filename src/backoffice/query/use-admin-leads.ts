import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAdminLeads,
  getAdminLeadStats,
  getAdminLead,
  updateAdminLeadNotas,
  updateAdminLeadStatus,
} from "@/backoffice/api/admin-leads";
import type { LeadB2b, LeadB2bStats, StatusLeadB2b } from "@/lib/shared/types/lead-b2b";
import { queryKeys } from "@/lib/query/keys";

export function useAdminLeads(status?: StatusLeadB2b) {
  return useQuery<LeadB2b[]>({
    queryKey: queryKeys.admin.leads.list(),
    queryFn: () => listAdminLeads(status),
  });
}

export function useAdminLeadStats() {
  return useQuery<LeadB2bStats>({
    queryKey: queryKeys.admin.leads.stats(),
    queryFn: () => getAdminLeadStats(),
  });
}

function useAdminLeadDetail(id: string | null) {
  return useQuery<LeadB2b>({
    queryKey: queryKeys.admin.leads.detail(id ?? ""),
    queryFn: () => getAdminLead(id!),
    enabled: Boolean(id),
  });
}

function useUpdateAdminLeadNotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notas }: { id: string; notas: string }) =>
      updateAdminLeadNotas(id, notas),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all() });
    },
  });
}

function useUpdateAdminLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusLeadB2b }) =>
      updateAdminLeadStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all() });
    },
  });
}
