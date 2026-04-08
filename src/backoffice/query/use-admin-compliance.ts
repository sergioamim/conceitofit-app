import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getComplianceDashboardApi,
  executarSolicitacaoExclusaoApi,
  rejeitarSolicitacaoExclusaoApi,
} from "@/backoffice/api/admin-compliance";
import type { ComplianceDashboard } from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

export function useAdminComplianceDashboard() {
  return useQuery<ComplianceDashboard>({
    queryKey: queryKeys.admin.compliance.dashboard(),
    queryFn: () => getComplianceDashboardApi(),
  });
}

function useExecutarExclusao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executarSolicitacaoExclusaoApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.compliance.all() });
    },
  });
}

function useRejeitarExclusao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      rejeitarSolicitacaoExclusaoApi(id, motivo),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.compliance.all() });
    },
  });
}
