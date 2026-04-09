import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTreinosWorkspace,
  getTreinoWorkspace,
  registrarExecucaoTreinoWorkspace,
} from "@/lib/tenant/treinos/workspace";
import { getClienteOperationalContextApi } from "@/lib/api/alunos";
import { listPresencasByAlunoApi } from "@/lib/api/presencas";
import {
  listAulasAgendaApi,
  listReservasAulaApi,
  reservarAulaApi,
  cancelarReservaAulaApi,
} from "@/lib/api/reservas";
import {
  listPagamentosApi,
} from "@/lib/api/pagamentos";
import type { Treino, ClienteOperationalContext, AulaSessao, ReservaAula, Pagamento } from "@/lib/types";
import type { Presenca } from "@/lib/shared/types/aluno";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Contexto Operacional
// ---------------------------------------------------------------------------

export function useClienteOperationalContext(input: {
  id: string | undefined;
  tenantId?: string;
  enabled?: boolean;
}) {
  return useQuery<ClienteOperationalContext>({
    queryKey: ["clienteOperationalContext", input.id, input.tenantId],
    queryFn: () =>
      getClienteOperationalContextApi({
        id: input.id!,
        tenantId: input.tenantId,
      }),
    enabled: Boolean(input.id) && (input.enabled ?? true),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000, // Polling a cada 30s
  });
}

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
    // Task 485: portal do aluno — 60s staleTime para treinos
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
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
    // Task 485: portal do aluno — 60s staleTime para check-in
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Aulas e Reservas
// ---------------------------------------------------------------------------

export function useAulasAgenda(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery<AulaSessao[]>({
    queryKey: ["aulasAgenda", input.tenantId, input.dateFrom, input.dateTo],
    queryFn: () =>
      listAulasAgendaApi({
        tenantId: input.tenantId!,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        apenasPortal: true,
      }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      Boolean(input.dateFrom) &&
      Boolean(input.dateTo),
    staleTime: 1 * 60 * 1000,
  });
}

export function useMinhasReservas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  userId: string | undefined;
}) {
  return useQuery<ReservaAula[]>({
    queryKey: ["minhasReservas", input.tenantId, input.userId],
    queryFn: () =>
      listReservasAulaApi({
        tenantId: input.tenantId!,
        alunoId: input.userId!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      Boolean(input.userId),
    staleTime: 1 * 60 * 1000,
  });
}

export function useReservarAula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      atividadeGradeId: string;
      data: string;
      alunoId: string;
    }) =>
      reservarAulaApi({
        tenantId: input.tenantId,
        data: {
          ...input,
          origem: "PORTAL_ALUNO",
        },
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["minhasReservas", variables.tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["aulasAgenda", variables.tenantId] });
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      cancelarReservaAulaApi(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["minhasReservas", variables.tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["aulasAgenda", variables.tenantId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Financeiro Aluno
// ---------------------------------------------------------------------------

export function useMeusPagamentos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  userId: string | undefined;
}) {
  return useQuery<Pagamento[]>({
    queryKey: ["meusPagamentos", input.tenantId, input.userId],
    queryFn: () =>
      listPagamentosApi({
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
