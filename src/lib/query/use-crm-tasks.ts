import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCrmTaskApi,
  listCrmTasksApi,
  listProspectsApi,
  updateCrmTaskApi,
} from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import {
  enrichCrmTasksRuntime,
  normalizeProspectRuntime,
  sortCrmTasksRuntime,
} from "@/lib/tenant/crm/runtime";
import type { CrmTask, Funcionario, Prospect } from "@/lib/types";
import { queryKeys } from "./keys";

const CRM_TASKS_STALE_TIME = 30_000; // 30s

interface CrmTasksData {
  tasks: CrmTask[];
  prospects: Prospect[];
  funcionarios: Funcionario[];
}

export function useCrmTasksQuery(input: {
  tenantId: string;
  enabled: boolean;
}) {
  return useQuery<CrmTasksData>({
    queryKey: queryKeys.crmTasks.all(input.tenantId),
    queryFn: async () => {
      const [taskRows, prospectRows, funcionarioRows] = await Promise.all([
        listCrmTasksApi({ tenantId: input.tenantId }),
        listProspectsApi({ tenantId: input.tenantId }),
        listFuncionariosApi(true),
      ]);
      const prospects = prospectRows
        .map((p) => normalizeProspectRuntime(p))
        .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
      const tasks = sortCrmTasksRuntime(
        enrichCrmTasksRuntime({
          tasks: taskRows,
          prospects,
          funcionarios: funcionarioRows,
        }),
      );
      return { tasks, prospects, funcionarios: funcionarioRows };
    },
    enabled: input.enabled && Boolean(input.tenantId),
    staleTime: CRM_TASKS_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useCreateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof createCrmTaskApi>[0]["data"];
    }) => createCrmTaskApi(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crmTasks"] });
    },
  });
}

export function useUpdateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof updateCrmTaskApi>[0]["data"];
    }) => updateCrmTaskApi(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crmTasks"] });
    },
  });
}
