"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { listAtividadeGrades, listAtividades, listFuncionarios, listSalas } from "@/lib/mock/services";
import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, Sala } from "@/lib/types";
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

export default function GradePage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [grades, setGrades] = useState<AtividadeGrade[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  async function load() {
    const [g, a, sal, pro] = await Promise.all([
      listAtividadeGrades({ apenasAtivas: true }),
      listAtividades({ apenasAtivas: true }),
      listSalas({ apenasAtivas: true }),
      listFuncionarios({ apenasAtivos: true }),
    ]);
    setGrades(g);
    setAtividades(a);
    setSalas(sal);
    setFuncionarios(pro);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Grade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão semanal das atividades configuradas na Grade de Atividades
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-7">
        {DIA_ORDER.map((dia, idx) => {
          const date = addDays(weekStart, idx);
          const items = byDay[dia];
          return (
            <div key={dia} className="rounded-xl border border-border bg-card min-h-[280px]">
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{DIA_LABEL[dia]}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{formatDayDate(date)}</p>
              </div>

              <div className="space-y-2 p-2">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/50 p-3 text-center text-[11px] text-muted-foreground/60">
                    Sem atividades
                  </div>
                )}

                {items.map((item) => (
                  <div key={`${item.id}-${item.diaExibicao}`} className="rounded-lg border border-border bg-secondary/30 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight">{item.atividade?.nome ?? "Atividade"}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.definicaoHorario === "SOB_DEMANDA" ? "Sob demanda" : item.horaInicio}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.definicaoHorario === "SOB_DEMANDA" ? "Horário definido sob demanda" : `${item.horaInicio} - ${item.horaFim}`}
                    </p>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <p className="truncate">
                        <span className="text-foreground/70">Sala:</span>{" "}
                        {item.salaId
                          ? (salaMap.get(item.salaId)?.nome ?? "Sala removida")
                          : (item.local ?? "Não definida")}
                      </p>
                      <p className="truncate">
                        <span className="text-foreground/70">Funcionário:</span>{" "}
                        {item.funcionarioId
                          ? (funcionarioMap.get(item.funcionarioId)?.nome ?? "Funcionário removido")
                          : (item.instrutor ?? "Não definido")}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {item.atividade?.permiteCheckin
                          ? isCheckinWindowOpen(item, date)
                            ? `Vagas disponíveis: ${item.capacidade}`
                            : "Check-in ainda indisponível"
                          : `Capacidade da sala: ${item.capacidade}`}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-semibold",
                          item.atividade?.checkinObrigatorio
                            ? "bg-gym-warning/15 text-gym-warning"
                            : item.atividade?.permiteCheckin
                              ? "bg-gym-accent/15 text-gym-accent"
                              : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {item.atividade?.checkinObrigatorio
                          ? "Check-in obrigatório"
                          : item.atividade?.permiteCheckin
                            ? "Check-in permitido"
                            : "Sem check-in"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
