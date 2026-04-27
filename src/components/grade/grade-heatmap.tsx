"use client";

import { useMemo } from "react";
import type {
  Atividade,
  AtividadeGrade,
  AulaSessao,
  DiaSemana,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";

const DIA_SHORT: Record<DiaSemana, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
  SAB: "Sáb",
  DOM: "Dom",
};

const HORA_INI = 6;
const HORA_FIM = 22;

function timeToMin(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/** Cor de fundo da célula (verde-oliva por % ocupação). */
function heatColor(pct: number, hasAulas: boolean): string {
  if (!hasAulas) return "var(--secondary)";
  const l = 0.96 - pct * 0.46;
  const c = 0.05 + pct * 0.13;
  return `oklch(${l} ${c} 130)`;
}

function textColor(pct: number, hasAulas: boolean): string {
  if (!hasAulas) return "var(--muted-foreground)";
  return pct > 0.55 ? "#fff" : "#3e520e";
}

interface CellAgg {
  pct: number;
  ocupadas: number;
  capacidade: number;
  aulas: { atividade: Atividade; horaInicio: string; pct: number }[];
}

export interface GradeHeatmapProps {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  sessoes: AulaSessao[];
  /** Datas da semana atual (SEG..DOM) em ISO YYYY-MM-DD. */
  weekDates: { dia: DiaSemana; isoDate: string }[];
  todayIso: string;
}

export function GradeHeatmap({
  grades,
  atividades,
  sessoes,
  weekDates,
  todayIso,
}: GradeHeatmapProps) {
  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);

  const horas = useMemo(() => {
    const out: number[] = [];
    for (let h = HORA_INI; h < HORA_FIM; h++) out.push(h);
    return out;
  }, []);

  // Map: "{atividadeGradeId}|{isoDate}" → AulaSessao
  const sessaoLookup = useMemo(() => {
    const m = new Map<string, AulaSessao>();
    sessoes.forEach((s) => m.set(`${s.atividadeGradeId}|${s.data}`, s));
    return m;
  }, [sessoes]);

  // Cells: hora → dia → CellAgg
  const cells = useMemo(() => {
    return horas.map((h) =>
      weekDates.map((wd) => {
        const slotMin = h * 60;
        const aulas: CellAgg["aulas"] = [];
        let ocupTotal = 0;
        let capTotal = 0;
        grades.forEach((g) => {
          if (g.definicaoHorario !== "PREVIAMENTE") return;
          if (!g.diasSemana.includes(wd.dia)) return;
          const ini = timeToMin(g.horaInicio);
          if (ini < slotMin || ini >= slotMin + 60) return;
          const a = atividadeMap.get(g.atividadeId);
          if (!a) return;
          const sessao = sessaoLookup.get(`${g.id}|${wd.isoDate}`);
          const cap = sessao?.capacidade ?? g.capacidade;
          const ocup = sessao?.vagasOcupadas ?? 0;
          const pct = cap > 0 ? ocup / cap : 0;
          aulas.push({ atividade: a, horaInicio: g.horaInicio, pct });
          ocupTotal += ocup;
          capTotal += cap;
        });
        const pct = capTotal > 0 ? ocupTotal / capTotal : 0;
        return { pct, ocupadas: ocupTotal, capacidade: capTotal, aulas };
      }),
    );
  }, [horas, weekDates, grades, atividadeMap, sessaoLookup]);

  // Top lotados (>=85%)
  const topLotados = useMemo(() => {
    const items: { dia: DiaSemana; hora: string; nome: string; pct: number; cor: string }[] = [];
    sessoes.forEach((s) => {
      if (s.capacidade <= 0) return;
      const pct = s.vagasOcupadas / s.capacidade;
      if (pct < 0.85) return;
      const grade = grades.find((g) => g.id === s.atividadeGradeId);
      const a = atividadeMap.get(s.atividadeId);
      if (!grade || !a) return;
      const wd = weekDates.find((w) => w.isoDate === s.data);
      if (!wd) return;
      items.push({
        dia: wd.dia,
        hora: s.horaInicio,
        nome: a.nome,
        pct,
        cor: getModalidadeCor(a).cor,
      });
    });
    items.sort((a, b) => b.pct - a.pct);
    return items.slice(0, 5);
  }, [sessoes, grades, atividadeMap, weekDates]);

  // Métricas globais
  const metricas = useMemo(() => {
    let ocup = 0;
    let cap = 0;
    sessoes.forEach((s) => {
      ocup += s.vagasOcupadas;
      cap += s.capacidade;
    });
    return {
      mediaPct: cap > 0 ? ocup / cap : 0,
      totalAulas: sessoes.length,
      totalLotadas: sessoes.filter((s) => s.capacidade > 0 && s.vagasOcupadas >= s.capacidade).length,
    };
  }, [sessoes]);

  // Sugestões heurísticas: slots vazios adjacentes a lotados (demanda reprimida)
  const sugestoes = useMemo(() => {
    const out: string[] = [];
    horas.forEach((h, hi) => {
      weekDates.forEach((wd, di) => {
        const cell = cells[hi]?.[di];
        if (!cell || cell.aulas.length > 0) return;
        const above = cells[hi - 1]?.[di];
        const below = cells[hi + 1]?.[di];
        if (above && above.pct >= 0.95) {
          out.push(`Adicionar slot ${DIA_SHORT[wd.dia]} ${String(h).padStart(2, "0")}:00 — ${above.aulas[0]?.atividade.nome ?? "aula"} lotada às ${String(h - 1).padStart(2, "0")}:00`);
        } else if (below && below.pct >= 0.95) {
          out.push(`Adicionar slot ${DIA_SHORT[wd.dia]} ${String(h).padStart(2, "0")}:00 — ${below.aulas[0]?.atividade.nome ?? "aula"} lotada às ${String(h + 1).padStart(2, "0")}:00`);
        }
      });
    });
    return out.slice(0, 3);
  }, [horas, weekDates, cells]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          sugestoes.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        <SidebarMetric pct={metricas.mediaPct} />
        <TopLotadosCard items={topLotados} />
        {sugestoes.length > 0 ? <SugestoesCard items={sugestoes} /> : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ocupação por horário
            </p>
            <h3 className="mt-0.5 text-base font-bold">Mapa de calor</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>vazio</span>
            <div className="flex gap-0.5">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
                <div
                  key={p}
                  className="h-3.5 w-4 rounded-sm"
                  style={{ background: heatColor(p, true) }}
                />
              ))}
            </div>
            <span>lotado</span>
          </div>
        </div>

        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `40px repeat(${weekDates.length}, minmax(0,1fr)) 44px`,
          }}
        >
          <div />
          {weekDates.map((wd) => {
            const isToday = wd.isoDate === todayIso;
            return (
              <div key={wd.dia} className="px-0.5 py-1 text-center">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isToday ? "text-gym-accent" : "text-muted-foreground",
                  )}
                >
                  {DIA_SHORT[wd.dia]}
                </p>
              </div>
            );
          })}
          <p className="self-end pb-1 text-center text-[10px] text-muted-foreground">Méd.</p>

          {horas.map((h, hi) => {
            const linha = cells[hi];
            let lineOcup = 0;
            let lineCap = 0;
            linha.forEach((c) => {
              lineOcup += c.ocupadas;
              lineCap += c.capacidade;
            });
            const pctLinha = lineCap > 0 ? lineOcup / lineCap : 0;
            return (
              <CellsRow
                key={h}
                hora={h}
                cells={linha}
                pctLinha={pctLinha}
                weekDates={weekDates}
                todayIso={todayIso}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TopLotado {
  dia: DiaSemana;
  hora: string;
  nome: string;
  pct: number;
  cor: string;
}

function SidebarMetric({ pct }: { pct: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Ocupação média
      </p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight leading-none">
        {Math.round(pct * 100)}%
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-gym-teal to-gym-accent"
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function TopLotadosCard({ items }: { items: TopLotado[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Horários mais cheios
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          Sem registros de alta ocupação na semana.
        </p>
      ) : (
        <div className="max-h-[140px] space-y-0 overflow-y-auto">
          {items.map((r, i) => (
            <div
              key={`${r.dia}-${r.hora}-${i}`}
              className={cn(
                "flex items-center gap-2 py-1 text-xs",
                i < items.length - 1 && "border-b border-border/60",
              )}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: r.cor }} />
              <span className="font-mono text-[11px] font-semibold">
                {DIA_SHORT[r.dia]} {r.hora}
              </span>
              <span className="flex-1 truncate text-muted-foreground">{r.nome}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  r.pct >= 1
                    ? "bg-destructive/15 text-destructive"
                    : "bg-gym-warning/15 text-gym-warning",
                )}
              >
                {Math.round(r.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SugestoesCard({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Sugestões
      </p>
      <div className="max-h-[140px] space-y-1.5 overflow-y-auto">
        {items.map((s, i) => (
          <div
            key={i}
            className="rounded-md border border-gym-accent/30 bg-gym-accent/10 p-2 text-[11px] leading-snug text-foreground"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CellsRowProps {
  hora: number;
  cells: CellAgg[];
  pctLinha: number;
  weekDates: { dia: DiaSemana; isoDate: string }[];
  todayIso: string;
}

function CellsRow({ hora, cells, pctLinha, weekDates, todayIso }: CellsRowProps) {
  return (
    <>
      <p className="self-center pr-1.5 text-right font-mono text-[10px] text-muted-foreground">
        {String(hora).padStart(2, "0")}:00
      </p>
      {cells.map((c, i) => {
        const has = c.aulas.length > 0;
        const isToday = weekDates[i]?.isoDate === todayIso;
        const label = c.aulas.map((a) => a.atividade.nome).join(", ");
        return (
          <div
            key={i}
            title={has ? `${label} · ${c.ocupadas}/${c.capacidade}` : ""}
            className={cn(
              "flex min-h-[34px] flex-col justify-between rounded-md p-1.5 text-[10px] transition",
              has ? "cursor-pointer hover:opacity-90" : "",
              isToday && "ring-1 ring-gym-accent",
            )}
            style={{ background: heatColor(c.pct, has), color: textColor(c.pct, has) }}
          >
            {has ? (
              <>
                <p className="truncate font-bold leading-tight">{label.slice(0, 18)}</p>
                <div className="flex items-baseline justify-between text-[9px] opacity-95">
                  <span>
                    {c.aulas.length} {c.aulas.length > 1 ? "aulas" : "aula"}
                  </span>
                  <span className="font-bold">{Math.round(c.pct * 100)}%</span>
                </div>
              </>
            ) : (
              <span className="m-auto opacity-50">—</span>
            )}
          </div>
        );
      })}
      <div
        className="grid place-items-center rounded-md text-[10px] font-bold"
        style={{ background: heatColor(pctLinha, true), color: textColor(pctLinha, true) }}
      >
        {Math.round(pctLinha * 100)}%
      </div>
    </>
  );
}
