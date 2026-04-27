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

const DIA_FULL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

const PX_HORA = 96;
const HORA_INI = 6;
const HORA_FIM = 22;

const SEM_SALA_ID = "__sem_sala__";

function timeToMin(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

interface CardItem {
  grade: AtividadeGrade;
  atividade: Atividade;
  sessao?: AulaSessao;
}

export interface GradeDayFocusProps {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
  sessoes: AulaSessao[];
  weekDates: { dia: DiaSemana; isoDate: string; date: Date }[];
  selectedDia: DiaSemana;
  onSelectDia: (dia: DiaSemana) => void;
  todayIso: string;
  nowDate: Date;
}

export function GradeDayFocus({
  grades,
  atividades,
  salas,
  funcionarios,
  sessoes,
  weekDates,
  selectedDia,
  onSelectDia,
  todayIso,
  nowDate,
}: GradeDayFocusProps) {
  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const funcionarioMap = useMemo(
    () => new Map(funcionarios.map((f) => [f.id, f])),
    [funcionarios],
  );

  const selected = weekDates.find((w) => w.dia === selectedDia) ?? weekDates[0];
  const isToday = selected?.isoDate === todayIso;

  const sessaoLookup = useMemo(() => {
    const m = new Map<string, AulaSessao>();
    sessoes.forEach((s) => m.set(`${s.atividadeGradeId}|${s.data}`, s));
    return m;
  }, [sessoes]);

  // Aulas do dia selecionado, agrupadas por sala
  const cardsByRoom = useMemo(() => {
    const grouped = new Map<string, CardItem[]>();
    grades.forEach((g) => {
      if (g.definicaoHorario !== "PREVIAMENTE") return;
      if (!g.diasSemana.includes(selectedDia)) return;
      const a = atividadeMap.get(g.atividadeId);
      if (!a) return;
      const key = g.salaId ?? SEM_SALA_ID;
      const arr = grouped.get(key) ?? [];
      const sessao = selected ? sessaoLookup.get(`${g.id}|${selected.isoDate}`) : undefined;
      arr.push({ grade: g, atividade: a, sessao });
      grouped.set(key, arr);
    });
    grouped.forEach((arr) =>
      arr.sort((x, y) => timeToMin(x.grade.horaInicio) - timeToMin(y.grade.horaInicio)),
    );
    return grouped;
  }, [grades, atividadeMap, selectedDia, sessaoLookup, selected]);

  // Salas a renderizar (só as com aulas no dia + categoria "sem sala" se houver)
  const roomsToRender = useMemo(() => {
    const out: { id: string; nome: string }[] = [];
    salas.forEach((s) => {
      if (cardsByRoom.has(s.id)) out.push({ id: s.id, nome: s.nome });
    });
    if (cardsByRoom.has(SEM_SALA_ID)) {
      out.push({ id: SEM_SALA_ID, nome: "Sem sala definida" });
    }
    return out;
  }, [salas, cardsByRoom]);

  // KPIs do dia
  const kpis = useMemo(() => {
    let totalAulas = 0;
    let cap = 0;
    let ocup = 0;
    let lotadas = 0;
    const profSet = new Set<string>();
    const salaSet = new Set<string>();
    cardsByRoom.forEach((arr, salaKey) => {
      arr.forEach(({ grade, sessao }) => {
        totalAulas++;
        cap += sessao?.capacidade ?? grade.capacidade;
        ocup += sessao?.vagasOcupadas ?? 0;
        if (sessao && sessao.capacidade > 0 && sessao.vagasOcupadas >= sessao.capacidade) {
          lotadas++;
        }
        if (grade.funcionarioId) profSet.add(grade.funcionarioId);
        if (salaKey !== SEM_SALA_ID) salaSet.add(salaKey);
      });
    });
    return {
      totalAulas,
      reservas: ocup,
      capacidade: cap,
      ocupacaoPct: cap > 0 ? Math.round((ocup / cap) * 100) : 0,
      lotadas,
      professores: profSet.size,
      salasEmUso: salaSet.size,
      salasTotal: salas.length,
    };
  }, [cardsByRoom, salas]);

  const totalW = (HORA_FIM - HORA_INI) * PX_HORA;
  const horas = Array.from({ length: HORA_FIM - HORA_INI + 1 }, (_, i) => HORA_INI + i);
  const nowOffset = isToday
    ? ((nowDate.getHours() * 60 + nowDate.getMinutes()) / 60 - HORA_INI) * PX_HORA
    : null;

  return (
    <div className="space-y-3">
      {/* Mini-strip da semana */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${weekDates.length}, minmax(0,1fr))` }}
      >
        {weekDates.map((w) => {
          const sel = w.dia === selectedDia;
          const dayCount = grades.filter(
            (g) => g.definicaoHorario === "PREVIAMENTE" && g.diasSemana.includes(w.dia),
          ).length;
          return (
            <button
              key={w.dia}
              type="button"
              onClick={() => onSelectDia(w.dia)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition",
                sel
                  ? "border-gym-accent bg-gym-accent text-white"
                  : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  sel ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {DIA_FULL[w.dia]}
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-lg font-bold leading-none">{w.date.getDate()}</span>
                <span className={cn("text-[10px]", sel ? "opacity-85" : "text-muted-foreground")}>
                  {dayCount} {dayCount === 1 ? "aula" : "aulas"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* KPIs do dia */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card px-4 py-3">
        <Kpi label="Aulas" value={kpis.totalAulas} sub="programadas" />
        <Kpi
          label="Reservas"
          value={kpis.reservas}
          sub={`de ${kpis.capacidade} vagas`}
        />
        <Kpi label="Ocupação" value={`${kpis.ocupacaoPct}%`} sub="média do dia" />
        <Kpi
          label="Lotadas"
          value={kpis.lotadas}
          sub="≥ 100% ocup"
          danger={kpis.lotadas > 0}
        />
        <Kpi label="Professores" value={kpis.professores} sub="em escala" />
        <Kpi
          label="Salas em uso"
          value={kpis.salasEmUso}
          sub={`de ${kpis.salasTotal}`}
        />
      </div>

      {/* Timeline horizontal por sala */}
      {roomsToRender.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma aula programada para este dia.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
          <div style={{ minWidth: totalW + 200 }}>
            <div className="mb-2 grid" style={{ gridTemplateColumns: `200px ${totalW}px` }}>
              <div />
              <div className="relative h-5">
                {horas.map((h, i) => (
                  <span
                    key={h}
                    className="absolute top-0 -translate-x-1/2 font-mono text-[10px] font-semibold text-muted-foreground"
                    style={{ left: i * PX_HORA }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>

            {roomsToRender.map((room) => {
              const cards = cardsByRoom.get(room.id) ?? [];
              const horasUso = cards.reduce((s, c) => s + c.grade.duracaoMinutos, 0) / 60;
              return (
                <div
                  key={room.id}
                  className="mb-1.5 grid"
                  style={{ gridTemplateColumns: `200px ${totalW}px` }}
                >
                  <div className="flex items-center gap-2 pr-3">
                    <span className="h-9 w-1 shrink-0 rounded-sm bg-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {room.nome.split("·")[0].trim()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {cards.length} aulas · {horasUso.toFixed(1)}h em uso
                      </p>
                    </div>
                  </div>
                  <div className="relative h-16 rounded-md border border-border bg-card">
                    {horas.map((h, i) => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 w-px bg-border/40"
                        style={{ left: i * PX_HORA }}
                      />
                    ))}
                    {nowOffset != null && nowOffset >= 0 && nowOffset <= totalW ? (
                      <div
                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-destructive opacity-70"
                        style={{ left: nowOffset }}
                      />
                    ) : null}
                    {cards.map(({ grade, atividade, sessao }) => {
                      const cor = getModalidadeCor(atividade);
                      const left = ((timeToMin(grade.horaInicio) - HORA_INI * 60) / 60) * PX_HORA;
                      const w = (grade.duracaoMinutos / 60) * PX_HORA;
                      const cap = sessao?.capacidade ?? grade.capacidade;
                      const ocup = sessao?.vagasOcupadas;
                      const lotada = ocup != null && cap > 0 && ocup >= cap;
                      const prof = grade.funcionarioId
                        ? funcionarioMap.get(grade.funcionarioId)
                        : null;

                      return (
                        <div
                          key={`${grade.id}-${atividade.id}`}
                          className="absolute top-1 bottom-1 overflow-hidden rounded border border-border px-2 py-1"
                          style={{
                            left: left + 2,
                            width: w - 4,
                            background: cor.bg,
                            borderLeftColor: cor.cor,
                            borderLeftWidth: 3,
                          }}
                          title={`${atividade.nome} · ${grade.horaInicio}–${grade.horaFim}${prof ? ` · ${prof.nome}` : ""}`}
                        >
                          <div className="flex items-center gap-1">
                            <p
                              className="flex-1 truncate text-xs font-bold"
                              style={{ color: cor.text }}
                            >
                              {atividade.nome}
                            </p>
                            {lotada ? (
                              <span className="rounded-full bg-destructive px-1.5 py-px text-[8px] font-bold uppercase text-white">
                                Lotada
                              </span>
                            ) : null}
                          </div>
                          <div
                            className="mt-0.5 flex items-center gap-1.5 text-[10px]"
                            style={{ color: cor.text, opacity: 0.85 }}
                          >
                            <span className="font-mono">
                              {grade.horaInicio}–{grade.horaFim}
                            </span>
                            {w >= 180 && prof ? (
                              <>
                                <span>·</span>
                                <span className="truncate">{prof.nome.split(" ")[0]}</span>
                              </>
                            ) : null}
                            {w >= 240 && ocup != null ? (
                              <>
                                <span>·</span>
                                <span className="font-mono font-bold">
                                  {ocup}/{cap}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  danger,
}: {
  label: string;
  value: number | string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-[110px] flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight",
            danger && "text-destructive",
          )}
        >
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}
