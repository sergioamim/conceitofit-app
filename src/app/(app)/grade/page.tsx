"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { listAtividadeGrades, listAtividades, listFuncionarios, listHorarios, listSalas } from "@/lib/mock/services";
import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, HorarioFuncionamento, Sala } from "@/lib/types";
import { Button } from "@/components/ui/button";

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

export default function GradePage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [grades, setGrades] = useState<AtividadeGrade[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([]);

  async function load() {
    const [g, a, sal, pro, h] = await Promise.all([
      listAtividadeGrades({ apenasAtivas: true }),
      listAtividades({ apenasAtivas: true }),
      listSalas({ apenasAtivas: true }),
      listFuncionarios({ apenasAtivos: true }),
      listHorarios(),
    ]);
    setGrades(g);
    setAtividades(a);
    setSalas(sal);
    setFuncionarios(pro);
    setHorarios(h);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

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

  const sobDemandaByDay = useMemo(() => {
    const grouped: Record<DiaSemana, (AtividadeGrade & { atividade?: Atividade; diaExibicao: DiaSemana })[]> = {
      SEG: [],
      TER: [],
      QUA: [],
      QUI: [],
      SEX: [],
      SAB: [],
      DOM: [],
    };
    DIA_ORDER.forEach((dia) => {
      grouped[dia] = byDay[dia].filter((item) => item.definicaoHorario === "SOB_DEMANDA");
    });
    return grouped;
  }, [byDay]);

  const weekEnd = addDays(weekStart, 6);
  const nowDate = new Date();

  function isCheckinWindowOpen(item: AtividadeGrade, date: Date) {
    if (item.definicaoHorario !== "PREVIAMENTE") return false;
    const [hh, mm] = item.horaInicio.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hh || 0, mm || 0, 0, 0);
    const openAt = new Date(start.getTime() - item.checkinLiberadoMinutosAntes * 60 * 1000);
    return nowDate >= openAt && nowDate <= start;
  }

  const funcionamentoFaixa = useMemo(() => {
    const abres = horarios.filter((h) => !h.fechado).map((h) => toMinutes(h.abre));
    const fechos = horarios.filter((h) => !h.fechado).map((h) => toMinutes(h.fecha));
    if (abres.length === 0 || fechos.length === 0) return null;
    return `${formatMinutes(Math.min(...abres))} - ${formatMinutes(Math.max(...fechos))}`;
  }, [horarios]);

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
          <Button variant="outline" size="icon" className="border-border" onClick={() => setWeekStart((d) => addDays(d, -7))}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            {weekStart.toLocaleDateString("pt-BR")} - {weekEnd.toLocaleDateString("pt-BR")}
          </div>
          <Button variant="outline" size="icon" className="border-border" onClick={() => setWeekStart((d) => addDays(d, 7))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            {funcionamentoFaixa
              ? `Faixa operacional da unidade: ${funcionamentoFaixa}`
              : "Sem horários de funcionamento configurados para a unidade"}
          </p>
          <p>Exibindo apenas horários com atividade agendada</p>
        </div>
      </div>

      {slotMinutes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          Não há atividades com horário definido nesta semana.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] border-b border-border bg-secondary/30">
              <div className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Horário</div>
              {DIA_ORDER.map((dia, idx) => {
                const date = addDays(weekStart, idx);
                const horarioDia = horarioMap.get(dia);
                return (
                  <div key={dia} className="border-l border-border px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{DIA_LABEL[dia]}</p>
                    <p className="text-sm">{formatDayDate(date)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {horarioDia?.fechado ? "Fechado" : `${horarioDia?.abre ?? "--:--"} - ${horarioDia?.fecha ?? "--:--"}`}
                    </p>
                  </div>
                );
              })}
            </div>

            {slotMinutes.map((slot) => (
              <div key={slot} className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0">
                <div className="px-3 py-3 text-xs font-semibold text-muted-foreground">{formatMinutes(slot)}</div>
                {DIA_ORDER.map((dia, idx) => {
                  const date = addDays(weekStart, idx);
                  const items = byDayBySlot[dia][slot] ?? [];
                  return (
                    <div key={`${dia}-${slot}`} className="min-h-[152px] border-l border-border p-2">
                      {items.length === 0 ? (
                        <div className="h-full rounded-md border border-dashed border-border/50 bg-secondary/20" />
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={`${item.id}-${item.diaExibicao}`} className="rounded-lg border border-border bg-secondary/40 p-3">
                              <p className="text-xs font-semibold">{item.atividade?.nome ?? "Atividade"}</p>

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
                                    ? isCheckinWindowOpen(item, date)
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
        <h3 className="font-display text-base font-bold">Atividades sob demanda</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {DIA_ORDER.map((dia) => {
            const items = sobDemandaByDay[dia];
            return (
              <div key={`sob-demand-${dia}`} className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{DIA_LABEL[dia]}</p>
                {items.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Sem atividades sob demanda</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {items.map((item) => (
                      <p key={`${item.id}-${item.diaExibicao}`} className="truncate text-xs">
                        {item.atividade?.nome ?? "Atividade"}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
