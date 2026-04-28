"use client";

/**
 * Linha do tempo de vencimentos — próximos N dias, barras coloridas por
 * estado. Espelho de `/tmp/design-p1/contas-a-pagar-receber/project/timeline.jsx`.
 *
 * Hidratation-safe: `today` e datas sempre como props string ISO. A
 * computação de grupos roda em render mas é 100% determinística sobre
 * inputs — safe para SSR.
 */

import { Calendar } from "lucide-react";
import { useMemo } from "react";
import { formatBRL } from "@/lib/formatters";
import { diasPara } from "@/lib/finance/contas-status";

export type TimelineConta = {
  id: string;
  dataVencimento: string;
  valor: number;
  /** Se true, conta considerada quitada — fica fora do grupo. */
  pago: boolean;
};

export type TimelineVencimentosProps = {
  contas: TimelineConta[];
  /** "pagar" = academia desembolsa; "receber" = academia cobra. Muda a cor do futuro. */
  mode: "pagar" | "receber";
  /** ISO `YYYY-MM-DD`. */
  today: string;
  /** Dias antes e depois de `today` a exibir (inclusive). Default: -3 .. +14. */
  rangeBefore?: number;
  rangeAfter?: number;
  onDayClick?: (iso: string, contasDoDia: TimelineConta[]) => void;
  className?: string;
};

const DIA_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function somaDias(iso: string, delta: number): string {
  // Determinístico: ancora em 12:00 UTC, adiciona delta dias, volta para ISO.
  const t = new Date(iso + "T12:00:00Z").getTime() + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

function diaSemana(iso: string): string {
  const day = new Date(iso + "T12:00:00Z").getUTCDay();
  return DIA_SEMANA[day];
}

function diaNum(iso: string): string {
  return iso.split("-")[2];
}

function isWeekend(iso: string): boolean {
  const day = new Date(iso + "T12:00:00Z").getUTCDay();
  return day === 0 || day === 6;
}

export function TimelineVencimentos({
  contas,
  mode,
  today,
  rangeBefore = 3,
  rangeAfter = 14,
  onDayClick,
  className,
}: TimelineVencimentosProps) {
  const { groups, maxTotal } = useMemo(() => {
    const g: Array<{
      delta: number;
      iso: string;
      items: TimelineConta[];
      total: number;
    }> = [];
    for (let i = -rangeBefore; i <= rangeAfter; i++) {
      const iso = somaDias(today, i);
      const items = contas.filter((c) => !c.pago && c.dataVencimento === iso);
      const total = items.reduce((s, c) => s + c.valor, 0);
      g.push({ delta: i, iso, items, total });
    }
    return { groups: g, maxTotal: Math.max(1, ...g.map((x) => x.total)) };
  }, [contas, today, rangeBefore, rangeAfter]);

  const futureColor = mode === "pagar" ? "var(--gym-accent, #6b8c1a)" : "var(--gym-teal, #1ea06a)";

  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-[15px] font-bold flex items-center gap-2">
            <Calendar size={15} className="text-gym-accent" aria-hidden="true" />
            Linha do tempo — próximos vencimentos
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {mode === "pagar"
              ? `Valores a desembolsar nos próximos ${rangeAfter} dias`
              : `Valores esperados nos próximos ${rangeAfter} dias`}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gym-danger" aria-hidden="true" />
            Atraso
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gym-warning" aria-hidden="true" />
            Hoje
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: futureColor }}
              aria-hidden="true"
            />
            Futuro
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 pb-1">
        <div className="flex gap-1.5 min-w-max">
          {groups.map((g) => {
            const isPast = g.delta < 0;
            const isToday = g.delta === 0;
            const weekend = isWeekend(g.iso);
            const color = isPast
              ? "var(--gym-danger, #dc3545)"
              : isToday
                ? "var(--gym-warning, #e09020)"
                : futureColor;
            const barH = g.total > 0 ? Math.max(8, (g.total / maxTotal) * 80) : 4;
            const hasItems = g.items.length > 0;

            return (
              <button
                key={g.iso}
                type="button"
                onClick={hasItems && onDayClick ? () => onDayClick(g.iso, g.items) : undefined}
                disabled={!hasItems}
                className={`flex-1 min-w-[64px] max-w-[84px] flex flex-col items-stretch p-1.5 rounded-lg transition-colors ${
                  isToday ? "bg-gym-warning/10" : ""
                } ${hasItems ? "hover:bg-secondary cursor-pointer" : "cursor-default"}`}
                aria-label={`${diaSemana(g.iso)} ${diaNum(g.iso)} — ${g.items.length} conta(s) no dia, total ${formatBRL(g.total)}`}
              >
                <div
                  className={`text-[9px] font-semibold uppercase tracking-wider text-center ${
                    weekend ? "text-muted-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {diaSemana(g.iso)}
                </div>
                <div
                  className={`text-[18px] font-bold text-center tabular-nums leading-tight ${
                    isToday
                      ? "text-gym-warning"
                      : isPast
                        ? "text-gym-danger"
                        : "text-foreground"
                  }`}
                >
                  {diaNum(g.iso)}
                </div>
                <div className="flex items-end justify-center mt-2 h-[90px]">
                  {hasItems ? (
                    <div
                      className="w-full rounded-t-md flex flex-col justify-end relative"
                      style={{
                        height: `${barH}px`,
                        background: color,
                        opacity: isPast ? 0.85 : 1,
                      }}
                    >
                      {g.items.length > 1 ? (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-border text-[9px] font-bold flex items-center justify-center text-foreground">
                          {g.items.length}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="w-full h-1 rounded-full bg-border/50" />
                  )}
                </div>
                <div
                  className={`text-[10px] font-semibold text-center mt-2 tabular-nums ${
                    g.total > 0 ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  {g.total > 0 ? formatBRL(g.total).replace("R$", "").trim() : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Exposto só para testes — evita repetir a lógica determinística. */
export const __test__ = { somaDias, diaSemana, diaNum, isWeekend, diasPara };
