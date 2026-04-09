"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Hourglass,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useAulasSessoes,
  useMinhasReservas,
  useReservarAula,
  useCancelarReserva,
} from "@/lib/query/use-aulas";
import { getBusinessTodayIso, addDaysToIsoDate } from "@/lib/business-date";
import { RESERVA_AULA_STATUS_LABEL } from "@/lib/tenant/aulas/reservas";
import type { AulaSessao, ReservaAula } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Button } from "@/components/ui/button";
import { ListErrorState } from "@/components/shared/list-states";

const DIA_SEMANA_LABEL: Record<string, string> = {
  SEG: "Segunda", TER: "Terça", QUA: "Quarta",
  QUI: "Quinta", SEX: "Sexta", SAB: "Sábado", DOM: "Domingo",
};

function formatHora(value: string) {
  return value.slice(0, 5);
}

function formatDataCurta(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function getStatusBadge(status: ReservaAula["status"]) {
  const label = RESERVA_AULA_STATUS_LABEL[status] ?? status;
  if (status === "CONFIRMADA" || status === "CHECKIN") {
    return <span className="flex items-center gap-1 rounded-full bg-gym-teal/15 px-2.5 py-1 text-[11px] font-semibold text-gym-teal"><CheckCircle2 className="size-3" />{label}</span>;
  }
  if (status === "LISTA_ESPERA") {
    return <span className="flex items-center gap-1 rounded-full bg-gym-warning/15 px-2.5 py-1 text-[11px] font-semibold text-gym-warning"><Hourglass className="size-3" />{label}</span>;
  }
  if (status === "CANCELADA") {
    return <span className="flex items-center gap-1 rounded-full bg-gym-danger/15 px-2.5 py-1 text-[11px] font-semibold text-gym-danger"><XCircle className="size-3" />{label}</span>;
  }
  return <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{label}</span>;
}

function SessaoCard({
  sessao,
  reserva,
  onReservar,
  onCancelar,
  reservando,
  cancelando,
}: {
  sessao: AulaSessao;
  reserva: ReservaAula | undefined;
  onReservar: () => void;
  onCancelar: () => void;
  reservando: boolean;
  cancelando: boolean;
}) {
  const lotado = sessao.vagasDisponiveis <= 0;
  const temListaEspera = sessao.listaEsperaHabilitada && lotado;
  const reservaAtiva = reserva && (reserva.status === "CONFIRMADA" || reserva.status === "LISTA_ESPERA");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-display text-sm font-bold">{sessao.atividadeNome}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" />{formatHora(sessao.horaInicio)} – {formatHora(sessao.horaFim)}</span>
            <span className="flex items-center gap-1"><CalendarDays className="size-3" />{DIA_SEMANA_LABEL[sessao.diaSemana] ?? sessao.diaSemana} · {formatDataCurta(sessao.data)}</span>
            {sessao.instrutorNome && <span className="flex items-center gap-1"><User className="size-3" />{sessao.instrutorNome}</span>}
            {sessao.salaNome && <span className="flex items-center gap-1"><MapPin className="size-3" />{sessao.salaNome}</span>}
          </div>
        </div>

        <div className="text-right shrink-0">
          {!lotado ? (
            <span className="text-xs font-semibold text-gym-teal">{sessao.vagasDisponiveis} vaga{sessao.vagasDisponiveis !== 1 ? "s" : ""}</span>
          ) : temListaEspera ? (
            <span className="text-xs font-semibold text-gym-warning">Lista de espera</span>
          ) : (
            <span className="text-xs font-semibold text-gym-danger">Lotado</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {reserva ? (
          <div className="flex items-center gap-2">
            {getStatusBadge(reserva.status)}
            {reserva.posicaoListaEspera != null && reserva.status === "LISTA_ESPERA" ? (
              <span className="text-[11px] text-muted-foreground">Posição #{reserva.posicaoListaEspera}</span>
            ) : null}
          </div>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          {reservaAtiva ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border text-gym-danger"
              disabled={cancelando}
              onClick={onCancelar}
            >
              {cancelando ? "Cancelando..." : "Cancelar reserva"}
            </Button>
          ) : !reserva || reserva.status === "CANCELADA" ? (
            sessao.permiteReserva && (!lotado || temListaEspera) ? (
              <Button
                size="sm"
                disabled={reservando}
                onClick={onReservar}
              >
                {reservando ? "Reservando..." : lotado ? "Entrar na lista" : "Reservar"}
              </Button>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MinhasAulasPage() {
  const { tenantId, userId } = useTenantContext();
  const alunoId = userId;

  const [todayIso, setTodayIso] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionSessaoId, setActionSessaoId] = useState<string | null>(null);

  useEffect(() => {
    setTodayIso(getBusinessTodayIso());
  }, []);

  const dateFrom = useMemo(() => {
    if (!todayIso) return "";
    return addDaysToIsoDate(todayIso, weekOffset * 7);
  }, [todayIso, weekOffset]);

  const dateTo = useMemo(() => {
    if (!dateFrom) return "";
    return addDaysToIsoDate(dateFrom, 6);
  }, [dateFrom]);

  const { data: sessoes, isLoading: loadingSessoes, error: sessoesError, refetch: refetchSessoes } = useAulasSessoes({
    tenantId,
    dateFrom,
    dateTo,
    enabled: dateFrom.length > 0,
  });

  const { data: reservas } = useMinhasReservas({ tenantId, alunoId });

  const reservarMutation = useReservarAula();
  const cancelarMutation = useCancelarReserva();

  const reservasBySessao = useMemo(() => {
    const map = new Map<string, ReservaAula>();
    if (!reservas) return map;
    for (const reserva of reservas) {
      if (reserva.status === "CANCELADA") continue;
      const key = `${reserva.atividadeGradeId}-${reserva.data}`;
      const existing = map.get(key);
      if (!existing || reserva.dataCriacao > (existing.dataCriacao ?? "")) {
        map.set(key, reserva);
      }
    }
    return map;
  }, [reservas]);

  const sessoesPorDia = useMemo(() => {
    if (!sessoes) return new Map<string, AulaSessao[]>();
    const grouped = new Map<string, AulaSessao[]>();
    for (const sessao of sessoes) {
      const list = grouped.get(sessao.data) ?? [];
      list.push(sessao);
      grouped.set(sessao.data, list);
    }
    return grouped;
  }, [sessoes]);

  const diasOrdenados = useMemo(() => {
    return [...sessoesPorDia.keys()].sort();
  }, [sessoesPorDia]);

  const error = sessoesError ? normalizeErrorMessage(sessoesError) : null;

  async function handleReservar(sessao: AulaSessao) {
    if (!tenantId || !alunoId) return;
    setActionSessaoId(sessao.id);
    setFeedback(null);
    try {
      const reserva = await reservarMutation.mutateAsync({
        tenantId,
        data: {
          atividadeGradeId: sessao.atividadeGradeId,
          data: sessao.data,
          alunoId,
          origem: "PORTAL_CLIENTE",
        },
      });
      const statusLabel = reserva.status === "LISTA_ESPERA" ? "na lista de espera" : "confirmada";
      setFeedback(`Reserva ${statusLabel} para ${sessao.atividadeNome} em ${formatDataCurta(sessao.data)}.`);
    } finally {
      setActionSessaoId(null);
    }
  }

  async function handleCancelar(reserva: ReservaAula, sessao: AulaSessao) {
    if (!tenantId) return;
    setActionSessaoId(sessao.id);
    setFeedback(null);
    try {
      await cancelarMutation.mutateAsync({ tenantId, id: reserva.id });
      setFeedback(`Reserva de ${sessao.atividadeNome} cancelada.`);
    } finally {
      setActionSessaoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Minhas Aulas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja a grade semanal, reserve vagas e acompanhe suas reservas.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          {feedback}
        </div>
      ) : null}

      {error ? <ListErrorState error={error} onRetry={() => void refetchSessoes()} /> : null}

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          Semana anterior
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {dateFrom && dateTo ? `${formatDataCurta(dateFrom)} — ${formatDataCurta(dateTo)}` : "…"}
          </p>
          {weekOffset !== 0 && (
            <button
              type="button"
              className="text-xs text-gym-accent hover:underline"
              onClick={() => setWeekOffset(0)}
            >
              Voltar para esta semana
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          Próxima semana
        </Button>
      </div>

      {loadingSessoes ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-primary/5" />
          ))}
        </div>
      ) : diasOrdenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma aula disponível nesta semana.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {diasOrdenados.map((dia) => {
            const sessoesNoDia = sessoesPorDia.get(dia) ?? [];
            const date = new Date(`${dia}T00:00:00`);
            const dayLabel = DIA_SEMANA_LABEL[sessoesNoDia[0]?.diaSemana ?? ""] ?? "";

            return (
              <section key={dia}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {dayLabel} · {formatDataCurta(dia)}
                </h2>
                <div className="space-y-2">
                  {sessoesNoDia.map((sessao) => {
                    const key = `${sessao.atividadeGradeId}-${sessao.data}`;
                    const reserva = reservasBySessao.get(key);

                    return (
                      <SessaoCard
                        key={sessao.id}
                        sessao={sessao}
                        reserva={reserva}
                        onReservar={() => handleReservar(sessao)}
                        onCancelar={() => reserva && handleCancelar(reserva, sessao)}
                        reservando={reservarMutation.isPending && actionSessaoId === sessao.id}
                        cancelando={cancelarMutation.isPending && actionSessaoId === sessao.id}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
