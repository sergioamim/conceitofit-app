"use client";

import { useEffect, useState } from "react";
import { getBusinessTodayIso } from "@/lib/business-date";
import { getGradeMuralSnapshotApi, type GradeMuralItem, type GradeMuralSnapshot } from "@/lib/api/grade-mural";
import type { DiaSemana } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDate } from "@/lib/formatters";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

function formatRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

function getAtividadeCapacityLabel(item: GradeMuralItem, dateIso: string): string {
  if (!item.atividade?.permiteCheckin) {
    return `Capacidade: ${item.capacidade}`;
  }

  const now = new Date();
  const start = new Date(`${dateIso}T${item.horaInicio}:00`);
  const openAt = new Date(start.getTime() - item.checkinLiberadoMinutosAntes * 60 * 1000);
  const isToday = getBusinessTodayIso(now) === dateIso;
  const checkinOpenNow = isToday && now >= openAt && now <= start;
  if (checkinOpenNow) {
    return `Vagas disponíveis: ${item.capacidade}`;
  }
  return `Check-in abre ${item.checkinLiberadoMinutosAntes} min antes`;
}

export function GradeWeekMuralBoard({
  tenantId,
  date,
}: {
  tenantId?: string;
  date?: string;
}) {
  const [data, setData] = useState<GradeMuralSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getGradeMuralSnapshotApi({ tenantId, date });
        if (!cancelled) {
          setData(snapshot);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData(null);
          setError(normalizeErrorMessage(loadError) || "Falha ao carregar o mural da grade.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto h-[640px] w-full max-w-[1680px] animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto w-full max-w-[1680px] rounded-2xl border border-gym-danger/30 bg-gym-danger/10 p-6 text-sm text-gym-danger">
          {error ?? "Nao foi possivel carregar o mural da grade."}
        </div>
      </div>
    );
  }

  const totalAulas = data.days.reduce((acc, day) => acc + day.itens.length, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1680px] rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-3">
            {data.academia.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.academia.branding.logoUrl}
                alt={data.academia.nome}
                className="h-12 w-auto rounded-md object-contain md:h-14"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-md bg-gym-accent/15 text-sm font-bold text-gym-accent md:h-14 md:w-14">
                CF
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Mural da grade semanal</p>
              <h1 className="truncate font-display text-xl font-bold md:text-2xl">{data.academia.nome}</h1>
              <p className="truncate text-sm text-muted-foreground">Unidade: {data.tenant.nome}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Semana atual</p>
            <p className="font-display text-lg font-bold">
              {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}
            </p>
            <p className="text-xs text-muted-foreground">{totalAulas} aula(s) programada(s)</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[1320px] grid-cols-7 gap-3">
            {data.days.map((day) => (
              <div key={day.dayTag} className="rounded-xl border border-border bg-secondary/20">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-bold">{DIA_LABEL[day.dayTag]}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {day.horarioDia?.fechado
                      ? "Unidade fechada"
                      : `${day.horarioDia?.abre ?? "--:--"} - ${day.horarioDia?.fecha ?? "--:--"}`}
                  </p>
                </div>

                <div className="space-y-2 p-2">
                  {day.itens.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/70 bg-card/40 px-3 py-5 text-center text-xs text-muted-foreground">
                      Sem aulas
                    </div>
                  ) : (
                    day.itens.map((item) => (
                      <div key={`${item.id}-${day.dayTag}-${item.horaInicio}`} className="rounded-lg border border-border bg-card p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold">{item.atividade?.nome}</p>
                          {item.atividade?.checkinObrigatorio ? (
                            <span className="shrink-0 rounded-full bg-gym-warning/15 px-2 py-0.5 text-[10px] font-semibold text-gym-warning">
                              Check-in obrigatório
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatRange(item.horaInicio, item.horaFim)}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          Local: {item.sala?.nome ?? item.local ?? "Não definido"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Professor: {item.funcionario?.nome ?? item.instrutor ?? "Não definido"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {getAtividadeCapacityLabel(item, day.date)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
