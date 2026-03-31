"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCrmAutomacoesApi,
  listCrmTasksApi,
  listProspectsApi,
  updateCrmAutomacaoApi,
} from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import {
  buildCrmWorkspaceSnapshotRuntime,
  enrichCrmTasksRuntime,
  normalizeProspectRuntime,
} from "@/lib/tenant/crm/runtime";
import type { CrmAutomation, CrmWorkspaceSnapshot } from "@/lib/types";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrmWorkspaceData {
  snapshot: CrmWorkspaceSnapshot;
  automations: CrmAutomation[];
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchCrmWorkspaceSnapshot(
  tenantId: string,
): Promise<CrmWorkspaceData> {
  const [prospectRows, taskRows, automationRows, funcionarioRows] =
    await Promise.all([
      listProspectsApi({ tenantId }),
      listCrmTasksApi({ tenantId }),
      listCrmAutomacoesApi({ tenantId }),
      listFuncionariosApi(true),
    ]);

  const prospects = prospectRows.map((p) => normalizeProspectRuntime(p));
  const tasks = enrichCrmTasksRuntime({
    tasks: taskRows,
    prospects,
    funcionarios: funcionarioRows,
  });

  const snapshot = buildCrmWorkspaceSnapshotRuntime({
    tenantId,
    prospects,
    tasks,
    automations: automationRows,
  });

  return { snapshot, automations: automationRows };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const CRM_STALE_TIME = 30_000; // 30s

export function useCrmWorkspace(tenantId: string) {
  return useQuery<CrmWorkspaceData>({
    queryKey: queryKeys.crm.snapshot(tenantId),
    queryFn: () => fetchCrmWorkspaceSnapshot(tenantId),
    enabled: Boolean(tenantId),
    staleTime: CRM_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useToggleCrmAutomation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (automation: CrmAutomation) => {
      await updateCrmAutomacaoApi({
        tenantId,
        id: automation.id,
        data: { ativo: !automation.ativo },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.crm.snapshot(tenantId),
      });
    },
  });
}
