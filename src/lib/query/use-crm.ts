"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
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
import { normalizeErrorMessage } from "@/lib/utils/api-error";
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

function buildAutomationUpsertPayload(automation: CrmAutomation) {
  return {
    nome: automation.nome,
    descricao: automation.descricao,
    tipoEvento: automation.tipoEvento,
    playbookId: automation.playbookId,
    responsavelPadrao: automation.responsavelPadrao,
    canalPadrao: automation.canalPadrao,
    prioridadePadrao: automation.prioridadePadrao ?? "MEDIA",
    prazoHoras: automation.prazoHoras ?? 24,
    filtros: automation.filtros,
    ativo: !automation.ativo,
  };
}

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (automation: CrmAutomation) => {
      await updateCrmAutomacaoApi({
        tenantId,
        id: automation.id,
        data: buildAutomationUpsertPayload(automation),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.crm.snapshot(tenantId),
      });
      toast({ title: "Automação atualizada" });
    },
    onError: (error) => {
      toast({
        title: "Falha ao atualizar automação",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}
