"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ListErrorState } from "@/components/shared/list-states";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listNotificacaoEventosApi,
  listNotificacaoPreferenciasApi,
  updateNotificacaoPreferenciaApi,
  CANAIS_NOTIFICACAO,
  CANAL_LABEL,
  type CanalNotificacao,
  type NotificacaoPreferencia,
} from "@/lib/api/notificacoes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gera label amigável para o nome do evento (ex: PAGAMENTO_VENCIDO → Pagamento vencido) */
function formatEventoLabel(evento: string): string {
  return evento
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Cria lookup rápido: `${evento}__${canal}` → preferencia */
function buildPreferenciaMap(prefs: NotificacaoPreferencia[]): Map<string, NotificacaoPreferencia> {
  const map = new Map<string, NotificacaoPreferencia>();
  for (const p of prefs) {
    map.set(`${p.evento}__${p.canal}`, p);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificacoesContent() {
  const { tenantId, authUser } = useTenantContext();
  const userId = authUser?.userId ?? authUser?.id ?? "";
  const queryClient = useQueryClient();

  const enabled = Boolean(tenantId) && Boolean(userId);

  // Buscar eventos distintos
  const eventosQuery = useQuery({
    queryKey: ["notificacoes", "eventos", tenantId, userId],
    queryFn: () => listNotificacaoEventosApi({ tenantId, alunoId: userId }),
    enabled,
    staleTime: 5 * 60_000,
  });

  // Buscar preferencias do usuario
  const preferenciasQuery = useQuery({
    queryKey: ["notificacoes", "preferencias", tenantId, userId],
    queryFn: () => listNotificacaoPreferenciasApi({ tenantId, alunoId: userId }),
    enabled,
    staleTime: 5 * 60_000,
  });

  // Extrair lista única de eventos
  const eventosList = useMemo(() => {
    const eventos = eventosQuery.data;
    if (!eventos?.length) return [];
    const unique = [...new Set(eventos.map((e) => e.evento))];
    unique.sort();
    return unique;
  }, [eventosQuery.data]);

  // Map de preferencias
  const prefMap = useMemo(
    () => buildPreferenciaMap(preferenciasQuery.data ?? []),
    [preferenciasQuery.data],
  );

  // Mutation para toggle
  const toggleMutation = useMutation({
    mutationFn: updateNotificacaoPreferenciaApi,
    onMutate: async (variables) => {
      // Optimistic update
      const queryKey = ["notificacoes", "preferencias", tenantId, userId];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<NotificacaoPreferencia[]>(queryKey);

      queryClient.setQueryData<NotificacaoPreferencia[]>(queryKey, (old) => {
        if (!old) return old;
        const key = `${variables.evento}__${variables.canal}`;
        const existing = old.find(
          (p) => p.evento === variables.evento && p.canal === variables.canal,
        );
        if (existing) {
          return old.map((p) =>
            p.evento === variables.evento && p.canal === variables.canal
              ? { ...p, habilitado: variables.habilitado }
              : p,
          );
        }
        // Se não existia, adicionar entry temporário
        return [
          ...old,
          {
            id: key,
            tenantId: variables.tenantId,
            pessoaId: variables.alunoId,
            evento: variables.evento,
            canal: variables.canal as CanalNotificacao,
            habilitado: variables.habilitado,
            updatedAt: new Date().toISOString(),
          },
        ];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(
          ["notificacoes", "preferencias", tenantId, userId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notificacoes", "preferencias", tenantId, userId],
      });
    },
  });

  const handleToggle = useCallback(
    (evento: string, canal: CanalNotificacao, habilitado: boolean) => {
      toggleMutation.mutate({
        tenantId,
        alunoId: userId,
        evento,
        canal,
        habilitado,
      });
    },
    [tenantId, userId, toggleMutation],
  );

  // Estados de loading/error
  const loading = eventosQuery.isLoading || preferenciasQuery.isLoading;
  const error = eventosQuery.error ?? preferenciasQuery.error;

  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <ListErrorState error={(error as Error).message ?? "Erro ao carregar preferências"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : eventosList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum tipo de notificação disponível.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Evento</th>
                {CANAIS_NOTIFICACAO.map((canal) => (
                  <th
                    key={canal}
                    className="px-4 py-3 text-center font-medium text-muted-foreground"
                  >
                    {CANAL_LABEL[canal]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventosList.map((evento) => (
                <tr key={evento} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium">{formatEventoLabel(evento)}</td>
                  {CANAIS_NOTIFICACAO.map((canal) => {
                    const pref = prefMap.get(`${evento}__${canal}`);
                    const checked = pref?.habilitado ?? false;
                    return (
                      <td key={canal} className="px-4 py-3 text-center">
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) =>
                            handleToggle(evento, canal, Boolean(value))
                          }
                          size="sm"
                          aria-label={`${formatEventoLabel(evento)} via ${CANAL_LABEL[canal]}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Notificações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Defina como deseja ser avisado para cada tipo de evento
      </p>
    </div>
  );
}
