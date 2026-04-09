"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateBR } from "@/lib/formatters";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getBusinessTodayDate, getBusinessTodayIso } from "@/lib/business-date";
import type { Atividade, AtividadeGrade, DiaSemana } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useGrade } from "@/lib/query/use-grade";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIA_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDayDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMinutes(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function formatMinutes(totalMinutes: number) {
  const safe = Math.max(0, totalMinutes);
  const hh = Math.floor(safe / 60).toString().padStart(2, "0");
  const mm = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function GradeContent() {
  const { tenantId } = useTenantContext();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(getBusinessTodayDate()));

  const { data: gradeData, isLoading: loading, isError, error } = useGrade({
    tenantId,
    tenantResolved: Boolean(tenantId),
  });

  const grades = gradeData?.grades ?? [];
  const atividades = gradeData?.atividades ?? [];
  const salas = gradeData?.salas ?? [];
  const funcionarios = gradeData?.funcionarios ?? [];
  const horarios = gradeData?.horarios ?? [];

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const horarioMap = useMemo(() => new Map(horarios.map((h) => [h.dia, h])), [horarios]);

  const byDay = useMemo(() => {
    const grouped: Record<DiaSemana, (AtividadeGrade & { atividade?: Atividade; diaExibicao: DiaSemana })[]> = {
      SEG: [],
      TER: [],
      QUA: [],
      QUI: [],
      SEX: [],
      SAB: [],
      DOM: [],
    };

    grades.forEach((g) => {
      const atividade = atividadeMap.get(g.atividadeId);
      if (!atividade) return;
      g.diasSemana.forEach((dia) => {
        grouped[dia].push({ ...g, atividade, diaExibicao: dia });
      });
    });

    DIA_ORDER.forEach((dia) => {
      grouped[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });

    return grouped;
  }, [grades, atividadeMap]);

  const slotMinutes = useMemo(() => {
    const set = new Set<number>();
    DIA_ORDER.forEach((dia) => {
      byDay[dia].forEach((item) => {
        if (item.definicaoHorario === "PREVIAMENTE") set.add(toMinutes(item.horaInicio));
      });
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [byDay]);

  const byDayBySlot = useMemo(() => {
    const matrix: Record<DiaSemana, Record<number, (AtividadeGrade & { atividade?: Atividade; diaExibicao: DiaSemana })[]>> = {
      SEG: {},
      TER: {},
      QUA: {},
      QUI: {},
      SEX: {},
      SAB: {},
      DOM: {},
    };
    DIA_ORDER.forEach((dia) => {
      byDay[dia].forEach((item) => {
        if (item.definicaoHorario !== "PREVIAMENTE") return;
        const key = toMinutes(item.horaInicio);
        if (!matrix[dia][key]) matrix[dia][key] = [];
        matrix[dia][key].push(item);
      });
    });
    return matrix;
  }, [byDay]);

  const weekEnd = addDays(weekStart, 6);
  const [nowDate, setNowDate] = useState(() => new Date());
  useEffect(() => {
    // Atualiza a cada 60s — suficiente para logica de check-in window
    const id = setInterval(() => setNowDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const todayIso = getBusinessTodayIso(nowDate);
  const weekDays = DIA_ORDER.map((dia, idx) => {
    const date = addDays(weekStart, idx);
    return {
      dia,
      date,
      isoDate: toIsoDate(date),
      horarioDia: horarioMap.get(dia),
    };
  });

  function isCheckinWindowOpen(item: AtividadeGrade, date: Date) {
    if (item.definicaoHorario !== "PREVIAMENTE") return false;
    const [hh, mm] = item.horaInicio.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hh || 0, mm || 0, 0, 0);
    const openAt = new Date(start.getTime() - item.checkinLiberadoMinutosAntes * 60 * 1000);
    return nowDate >= openAt && nowDate <= start;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Grade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calendário semanal das atividades configuradas na Grade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="border-border" aria-label="Semana anterior" onClick={() => setWeekStart((d) => addDays(d, -7))}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            {formatDateBR(weekStart)} - {formatDateBR(weekEnd)}
          </div>
          <Button variant="outline" size="icon" className="border-border" aria-label="Próxima semana" onClick={() => setWeekStart((d) => addDays(d, 7))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error instanceof Error ? error.message : "Falha ao carregar grade."}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          Carregando grade semanal...
        </div>
      ) : slotMinutes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          Não há atividades com horário definido nesta semana.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] border-b border-border bg-secondary/45">
              <div className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/75">Horário</div>
              {weekDays.map((dayData) => {
                const isToday = dayData.isoDate === todayIso;
                return (
                  <div
                    key={dayData.dia}
                    className={cn(
                      "border-l border-border px-3 py-3",
                      isToday && "border-l-gym-accent/50 bg-gym-accent/10"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{DIA_LABEL[dayData.dia]}</p>
                      {isToday ? (
                        <span className="inline-flex rounded-full bg-gym-accent px-1.5 py-0.5 text-[10px] font-semibold text-gym-accent-foreground">
                          Hoje
                        </span>
                      ) : null}
                    </div>
                    <p className={cn("text-sm", isToday && "font-semibold text-gym-accent")}>{formatDayDate(dayData.date)}</p>
                    <p className={cn("text-[11px] text-muted-foreground", isToday && "text-foreground/80")}>
                      {dayData.horarioDia?.fechado
                        ? "Fechado"
                        : `${dayData.horarioDia?.abre ?? "--:--"} - ${dayData.horarioDia?.fecha ?? "--:--"}`}
                    </p>
                  </div>
                );
              })}
            </div>

            {slotMinutes.map((slot, rowIndex) => (
              <div key={slot} className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] border-b border-border/80 last:border-b-0">
                <div
                  className={cn(
                    "px-3 py-3 text-xs font-semibold text-foreground/80",
                    rowIndex % 2 === 1 ? "bg-secondary/20" : "bg-card"
                  )}
                >
                  {formatMinutes(slot)}
                </div>
                {weekDays.map((dayData) => {
                  const items = byDayBySlot[dayData.dia][slot] ?? [];
                  const isToday = dayData.isoDate === todayIso;
                  return (
                    <div
                      key={`${dayData.dia}-${slot}`}
                      className={cn(
                        "min-h-[160px] border-l p-2",
                        isToday ? "border-l-gym-accent/45 bg-gym-accent/5" : "border-border",
                        !isToday && rowIndex % 2 === 1 && "bg-secondary/10"
                      )}
                    >
                      {items.length === 0 ? (
                        <div
                          className={cn(
                            "h-full rounded-md border border-dashed",
                            isToday ? "border-gym-accent/45 bg-gym-accent/10" : "border-border/55 bg-secondary/20"
                          )}
                        />
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={`${item.id}-${item.diaExibicao}`} className="rounded-lg border border-border/90 bg-card p-3 shadow-sm">
                              <p className="text-xs font-semibold text-foreground">{item.atividade?.nome ?? "Atividade"}</p>

                              <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
                                <p className="break-words">
                                  <span className="text-foreground/70">Local:</span>{" "}
                                  {item.salaId
                                    ? (salaMap.get(item.salaId)?.nome ?? "Sala removida")
                                    : (item.local ?? "Não definido")}
                                </p>
                                <p className="break-words">
                                  <span className="text-foreground/70">Professor:</span>{" "}
                                  {item.funcionarioId
                                    ? (funcionarioMap.get(item.funcionarioId)?.nome ?? "Funcionário removido")
                                    : (item.instrutor ?? "Não definido")}
                                </p>
                              </div>

                              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                                <p className="break-words">
                                  {item.atividade?.permiteCheckin
                                    ? isCheckinWindowOpen(item, dayData.date)
                                      ? `Vagas disponíveis: ${item.capacidade}`
                                      : `Check-in abre ${item.checkinLiberadoMinutosAntes} min antes`
                                    : `Capacidade da sala: ${item.capacidade}`}
                                </p>
                                {item.atividade?.checkinObrigatorio ? (
                                  <span className="inline-flex w-fit rounded-full bg-gym-warning/15 px-2 py-0.5 text-[10px] font-semibold text-gym-warning">
                                    Check-in obrigatório
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-gym-accent" />
          <p>
            Esta visão semanal consome os cadastros de <strong>Administrativo - Atividades - Grade</strong>.
            Em seguida, essa mesma base será usada no calendário operacional de atividades.
          </p>
        </div>
      </div>
    </div>
  );
}
