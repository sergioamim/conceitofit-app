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
import {
  getHomeSnapshotApi,
  getCarteirinhaDigitalApi,
  rotacionarCarteirinhaApi,
  listContratosClienteApi,
  getContratoClienteApi,
  enviarContratoOtpApi,
  assinarContratoApi,
  listCobrancasClienteApi,
  getCobrancaClienteApi,
  solicitarSegundaViaApi,
  getInadimplenciaClienteApi,
  type HomeSnapshot,
  type CarteirinhaDigital,
  type ContratoResumo,
  type ContratoDetalhe,
  type CobrancaCliente,
  type CobrancaDetalhe,
  type FinanceiroInadimplencia,
} from "@/lib/api/app-cliente";
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
      // Task #539: alinhado com TreinoExecucaoStatus do BE
      status: "INICIADA" | "CONCLUIDA" | "PARCIAL" | "ABANDONADA" | "CANCELADA";
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

// ---------------------------------------------------------------------------
// Home Snapshot (App Cliente)
// ---------------------------------------------------------------------------

export function useHomeSnapshot(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<HomeSnapshot>({
    queryKey: queryKeys.appCliente.homeSnapshot(input.tenantId ?? ""),
    queryFn: () =>
      getHomeSnapshotApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Carteirinha Digital (App Cliente)
// ---------------------------------------------------------------------------

export function useCarteirinhaDigital(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<CarteirinhaDigital>({
    queryKey: queryKeys.appCliente.carteirinha(input.tenantId ?? ""),
    queryFn: () =>
      getCarteirinhaDigitalApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useRotacionarCarteirinha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string }) =>
      rotacionarCarteirinhaApi(input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.appCliente.carteirinha(variables.tenantId),
        data,
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Contratos (App Cliente)
// ---------------------------------------------------------------------------

export function useMeusContratos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<ContratoResumo[]>({
    queryKey: queryKeys.appCliente.contratos(input.tenantId ?? ""),
    queryFn: () =>
      listContratosClienteApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

export function useContratoDetalhe(input: {
  id: string | undefined;
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<ContratoDetalhe>({
    queryKey: queryKeys.appCliente.contratoDetalhe(
      input.tenantId ?? "",
      input.id ?? "",
    ),
    queryFn: () =>
      getContratoClienteApi({ id: input.id!, tenantId: input.tenantId! }),
    enabled:
      Boolean(input.id) &&
      Boolean(input.tenantId) &&
      input.tenantResolved,
    staleTime: 60_000,
  });
}

export function useEnviarContratoOtp() {
  return useMutation({
    mutationFn: (input: { id: string; tenantId: string }) =>
      enviarContratoOtpApi(input),
  });
}

export function useAssinarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; tenantId: string; codigoOtp: string }) =>
      assinarContratoApi(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appCliente.contratos(variables.tenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appCliente.contratoDetalhe(
          variables.tenantId,
          variables.id,
        ),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Cobrancas (App Cliente)
// ---------------------------------------------------------------------------

export function useMinhasCobrancas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<CobrancaCliente[]>({
    queryKey: queryKeys.appCliente.cobrancas(input.tenantId ?? ""),
    queryFn: () =>
      listCobrancasClienteApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCobrancaDetalhe(input: {
  id: string | undefined;
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<CobrancaDetalhe>({
    queryKey: queryKeys.appCliente.cobrancaDetalhe(
      input.tenantId ?? "",
      input.id ?? "",
    ),
    queryFn: () =>
      getCobrancaClienteApi({ id: input.id!, tenantId: input.tenantId! }),
    enabled:
      Boolean(input.id) &&
      Boolean(input.tenantId) &&
      input.tenantResolved,
    staleTime: 60_000,
  });
}

export function useSolicitarSegundaVia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; tenantId: string; formaPagamento?: string }) =>
      solicitarSegundaViaApi(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appCliente.cobrancas(variables.tenantId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Inadimplencia (App Cliente)
// ---------------------------------------------------------------------------

export function useInadimplenciaCliente(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<FinanceiroInadimplencia>({
    queryKey: queryKeys.appCliente.inadimplencia(input.tenantId ?? ""),
    queryFn: () =>
      getInadimplenciaClienteApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 5 * 60 * 1000,
  });
}
