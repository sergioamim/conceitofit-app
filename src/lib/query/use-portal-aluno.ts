import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTreinosWorkspace,
  getTreinoWorkspace,
  registrarExecucaoTreinoWorkspace,
} from "@/lib/tenant/treinos/workspace";
import { listPresencasByAlunoApi } from "@/lib/api/presencas";
import type { Treino } from "@/lib/types";
import type { Presenca } from "@/lib/shared/types/aluno";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Meus Treinos
// ---------------------------------------------------------------------------

export function useMeusTreinos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  userId: string | undefined;
}) {
  return useQuery<Treino[]>({
    queryKey: queryKeys.meusTreinos.list(
      input.tenantId ?? "",
      input.userId ?? "",
    ),
    queryFn: async () => {
      const result = await listTreinosWorkspace({
        tenantId: input.tenantId!,
        alunoId: input.userId,
        tipoTreino: "CUSTOMIZADO",
        status: "ATIVO",
      });
      const detailed = await Promise.all(
        result.items.map((t) =>
          getTreinoWorkspace({ tenantId: input.tenantId!, id: t.id }),
        ),
      );
      return detailed.filter((t): t is Treino => t !== null);
    },
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      Boolean(input.userId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRegistrarExecucaoTreino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      status: "CONCLUIDA" | "PARCIAL" | "PULADA";
      observacao?: string;
    }) => registrarExecucaoTreinoWorkspace(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meusTreinos"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Check-in (presenças)
// ---------------------------------------------------------------------------

export function useCheckInPresencas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  userId: string | undefined;
}) {
  return useQuery<Presenca[]>({
    queryKey: queryKeys.checkIn.presencas(
      input.tenantId ?? "",
      input.userId ?? "",
    ),
    queryFn: () =>
      listPresencasByAlunoApi({
        tenantId: input.tenantId!,
        alunoId: input.userId!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      Boolean(input.userId),
    staleTime: 2 * 60 * 1000,
  });
}
