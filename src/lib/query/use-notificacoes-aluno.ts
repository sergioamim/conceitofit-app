import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/http";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type NotificacaoTipo =
  | "PAGAMENTO_VENCENDO"
  | "AULA_CONFIRMADA"
  | "TREINO_NOVO"
  | "MATRICULA_VENCENDO"
  | "GERAL";

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  acaoUrl?: string;
  createdAt: string;
}

export interface PreferenciasNotificacao {
  emailAulas: boolean;
  emailPagamentos: boolean;
  emailTreinos: boolean;
  whatsappLembretes: boolean;
  whatsappCobrancas: boolean;
  pushAtivado: boolean;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const notificacoesKeys = {
  all: (alunoId: string) => ["notificacoes-aluno", alunoId] as const,
  preferencias: (alunoId: string) => ["preferencias-aluno", alunoId] as const,
};

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

export function useNotificacoesAluno(input: {
  tenantId: string | undefined;
  alunoId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery<Notificacao[]>({
    queryKey: notificacoesKeys.all(input.alunoId ?? ""),
    queryFn: () =>
      apiRequest<Notificacao[]>({
        path: `/api/v1/academia/alunos/${input.alunoId}/notificacoes`,
        query: { tenantId: input.tenantId },
      }),
    enabled: Boolean(input.tenantId) && Boolean(input.alunoId) && (input.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      alunoId: string;
      notificacaoId: string;
    }) =>
      apiRequest<void>({
        path: `/api/v1/academia/alunos/${input.alunoId}/notificacoes/${input.notificacaoId}/lida`,
        method: "PATCH",
        query: { tenantId: input.tenantId },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificacoesKeys.all(variables.alunoId),
      });
    },
  });
}

export function useMarcarTodasLidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; alunoId: string }) =>
      apiRequest<void>({
        path: `/api/v1/academia/alunos/${input.alunoId}/notificacoes/marcar-todas-lidas`,
        method: "PATCH",
        query: { tenantId: input.tenantId },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificacoesKeys.all(variables.alunoId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Preferências
// ---------------------------------------------------------------------------

export function usePreferenciasNotificacao(input: {
  tenantId: string | undefined;
  alunoId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery<PreferenciasNotificacao>({
    queryKey: notificacoesKeys.preferencias(input.alunoId ?? ""),
    queryFn: () =>
      apiRequest<PreferenciasNotificacao>({
        path: `/api/v1/academia/alunos/${input.alunoId}/preferencias`,
        query: { tenantId: input.tenantId },
      }),
    enabled: Boolean(input.tenantId) && Boolean(input.alunoId) && (input.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAtualizarPreferencias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      alunoId: string;
      data: Partial<PreferenciasNotificacao>;
    }) =>
      apiRequest<PreferenciasNotificacao>({
        path: `/api/v1/academia/alunos/${input.alunoId}/preferencias`,
        method: "PATCH",
        query: { tenantId: input.tenantId },
        body: input.data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificacoesKeys.preferencias(variables.alunoId),
      });
    },
  });
}
