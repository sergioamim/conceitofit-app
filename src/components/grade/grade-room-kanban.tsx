"use client";

import { useMemo } from "react";
import type {
  Atividade,
  AtividadeGrade,
  AulaSessao,
  DiaSemana,
  Funcionario,
  Sala,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";

const DIA_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DIA_SHORT: Record<DiaSemana, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
  SAB: "Sáb",
  DOM: "Dom",
};

const SEM_SALA_ID = "__sem_sala__";
const HORAS_DIA_OPERACAO = 16; // janela de uso útil

function timeToMin(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

interface CardItem {
  grade: AtividadeGrade;
  atividade: Atividade;
  sessao?: AulaSessao;
}

export interface GradeRoomKanbanProps {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
  sessoes: AulaSessao[];
  weekDates: { dia: DiaSemana; isoDate: string; date: Date }[];
  todayIso: string;
}

export function GradeRoomKanban({
  grades,
  atividades,
  salas,
  funcionarios,
  sessoes,
  weekDates,
  todayIso,
}: GradeRoomKanbanProps) {
  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const funcionarioMap = useMemo(
    () => new Map(funcionarios.map((f) => [f.id, f])),
    [funcionarios],
  );
  const sessaoLookup = useMemo(() => {
    const m = new Map<string, AulaSessao>();
    sessoes.forEach((s) => m.set(`${s.atividadeGradeId}|${s.data}`, s));
    return m;
  }, [sessoes]);

  // Agrupa cards por sala → dia
  const grouped = useMemo(() => {
    type ByDay = Record<DiaSemana, CardItem[]>;
    const empty = (): ByDay => ({
      SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [], DOM: [],
    });
    const byRoom = new Map<string, ByDay>();
    grades.forEach((g) => {
      if (g.definicaoHorario !== "PREVIAMENTE") return;
      const a = atividadeMap.get(g.atividadeId);
      if (!a) return;
      const key = g.salaId ?? SEM_SALA_ID;
      const room = byRoom.get(key) ?? empty();
      g.diasSemana.forEach((dia) => {
        const wd = weekDates.find((w) => w.dia === dia);
        const sessao = wd ? sessaoLookup.get(`${g.id}|${wd.isoDate}`) : undefined;
        room[dia].push({ grade: g, atividade: a, sessao });
      });
      byRoom.set(key, room);
    });
    byRoom.forEach((byDay) => {
      DIA_ORDER.forEach((d) => {
        byDay[d].sort((x, y) => timeToMin(x.grade.horaInicio) - timeToMin(y.grade.horaInicio));
      });
    });
    return byRoom;
  }, [grades, atividadeMap, weekDates, sessaoLookup]);

  // Lista final de salas a renderizar (com aulas no período)
  const roomsToRender = useMemo(() => {
    const out: { id: string; nome: string }[] = [];
    salas.forEach((s) => {
      if (grouped.has(s.id)) out.push({ id: s.id, nome: s.nome });
    });
    if (grouped.has(SEM_SALA_ID)) {
      out.push({ id: SEM_SALA_ID, nome: "Sem sala definida" });
    }
    return out;
  }, [salas, grouped]);

  if (roomsToRender.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhuma sala com aulas programadas nesta semana.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
      <div className="flex min-w-min gap-3">
        {roomsToRender.map((room) => {
          const byDay = grouped.get(room.id)!;
          const aulasFlat = DIA_ORDER.flatMap((d) => byDay[d]);
          const horasUso = aulasFlat.reduce((s, c) => s + c.grade.duracaoMinutos, 0) / 60;
          const capSemana = HORAS_DIA_OPERACAO * 7;
          const pctUso = Math.min(horasUso / capSemana, 1);

          return (
            <div key={room.id} className="flex w-60 shrink-0 flex-col gap-2">
              <div className="rounded-lg border border-border bg-card px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-1 shrink-0 rounded-sm bg-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {room.nome.split("·")[0].trim()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {aulasFlat.length} aulas · {Math.round(horasUso)}h/sem
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded bg-secondary">
                  <div
                    className="h-full bg-muted-foreground"
                    style={{ width: `${pctUso * 100}%` }}
                  />
                </div>
              </div>

              {weekDates.map((wd) => {
                const aulas = byDay[wd.dia];
                const isToday = wd.isoDate === todayIso;
                if (aulas.length === 0) {
                  return (
                    <div
                      key={wd.dia}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-dashed border-border px-2.5 py-1.5 text-[10px] text-muted-foreground",
                        isToday && "border-gym-accent/60",
                      )}
                    >
                      <span>
                        {DIA_SHORT[wd.dia]} · {wd.date.getDate()}
                      </span>
                      <span>livre</span>
                    </div>
                  );
                }
                return (
                  <div key={wd.dia}>
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isToday ? "text-gym-accent" : "text-muted-foreground",
                        )}
                      >
                        {DIA_SHORT[wd.dia]} · {wd.date.getDate()}
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                      <span className="text-[10px] text-muted-foreground">{aulas.length}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {aulas.map(({ grade, atividade, sessao }) => {
                        const cor = getModalidadeCor(atividade);
                        const cap = sessao?.capacidade ?? grade.capacidade;
                        const ocup = sessao?.vagasOcupadas;
                        const pct = ocup != null && cap > 0 ? ocup / cap : null;
                        const prof = grade.funcionarioId
                          ? funcionarioMap.get(grade.funcionarioId)
                          : null;
                        const profIni = prof
                          ? prof.nome
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "";

                        return (
                          <div
                            key={`${grade.id}-${wd.dia}`}
                            className="cursor-grab rounded border border-border px-2.5 py-1.5 text-xs"
                            style={{
                              background: cor.bg,
                              borderLeftColor: cor.cor,
                              borderLeftWidth: 3,
                            }}
                            title={`${atividade.nome} · ${grade.horaInicio}${prof ? ` · ${prof.nome}` : ""}`}
                          >
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className="font-mono text-[10px] font-semibold"
                                style={{ color: cor.text, opacity: 0.85 }}
                              >
                                {grade.horaInicio}
                              </span>
                              <span
                                className="flex-1 truncate text-xs font-bold"
                                style={{ color: cor.text }}
                              >
                                {atividade.nome}
                              </span>
                            </div>
                            {prof || pct != null ? (
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                {prof ? (
                                  <>
                                    <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-secondary text-[8px] font-bold">
                                      {profIni}
                                    </span>
                                    <span className="flex-1 truncate">
                                      {prof.nome.split(" ")[0]}
                                    </span>
                                  </>
                                ) : (
                                  <span className="flex-1" />
                                )}
                                {pct != null ? (
                                  <span
                                    className={cn(
                                      "font-mono font-bold",
                                      pct >= 1
                                        ? "text-destructive"
                                        : pct >= 0.85
                                          ? "text-gym-warning"
                                          : "text-muted-foreground",
                                    )}
                                  >
                                    {ocup}/{cap}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
