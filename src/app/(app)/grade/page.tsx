"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { listAtividadeGrades, listAtividades } from "@/lib/mock/services";
import type { Atividade, AtividadeGrade, DiaSemana } from "@/lib/types";
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

  async function load() {
    const [g, a] = await Promise.all([
      listAtividadeGrades({ apenasAtivas: true }),
      listAtividades({ apenasAtivas: true }),
    ]);
    setGrades(g);
    setAtividades(a);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);

  const byDay = useMemo(() => {
    const grouped: Record<DiaSemana, (AtividadeGrade & { atividade?: Atividade })[]> = {
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
      grouped[g.diaSemana].push({ ...g, atividade });
    });

    DIA_ORDER.forEach((dia) => {
      grouped[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });

    return grouped;
  }, [grades, atividadeMap]);

  const weekEnd = addDays(weekStart, 6);

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
            <div key={dia} className="rounded-xl border border-border bg-card">
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
                  <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight">{item.atividade?.nome ?? "Atividade"}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.horaInicio}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.horaInicio} - {item.horaFim}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.local ?? "Local não definido"}
                      {item.instrutor ? ` · ${item.instrutor}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Capacidade {item.capacidade}</span>
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
