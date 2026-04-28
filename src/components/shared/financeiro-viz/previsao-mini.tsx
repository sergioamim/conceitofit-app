/**
 * Card "Previsão próximas semanas" — barras coloridas para 4 buckets
 * (Atraso, Esta semana, +1 sem, +2 sem, +3 sem). Espelho de
 * `dashboard.jsx:134-161`.
 */

import { formatBRL } from "@/lib/formatters";
import { diasPara } from "@/lib/finance/contas-status";
import { BarChart } from "./bar-chart";

export type PrevisaoConta = {
  dataVencimento: string;
  valor: number;
  pago: boolean;
};

export type PrevisaoMiniProps = {
  contas: PrevisaoConta[];
  mode: "pagar" | "receber";
  /** ISO `YYYY-MM-DD`. */
  today: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

const BUCKETS = [
  { start: -60, end: -1, label: "Atraso", color: "var(--gym-danger, #dc3545)" },
  { start: 0, end: 6, label: "Esta sem.", color: "var(--gym-warning, #e09020)" },
  { start: 7, end: 13, label: "+1 sem", colorKey: "future" as const },
  { start: 14, end: 20, label: "+2 sem", colorKey: "future" as const },
  { start: 21, end: 27, label: "+3 sem", colorKey: "future" as const },
];

export function PrevisaoMini({
  contas,
  mode,
  today,
  title = "Previsão próximas semanas",
  subtitle,
  className,
}: PrevisaoMiniProps) {
  const futureColor = mode === "pagar" ? "var(--gym-accent, #6b8c1a)" : "var(--gym-teal, #1ea06a)";
  const bars = BUCKETS.map((b) => {
    const value = contas
      .filter((c) => {
        if (c.pago) return false;
        const d = diasPara(c.dataVencimento, today);
        return d >= b.start && d <= b.end;
      })
      .reduce((s, c) => s + c.valor, 0);
    return {
      label: b.label,
      value,
      color: "color" in b ? b.color : futureColor,
    };
  });

  const total = bars.reduce((s, b) => s + b.value, 0);
  const resolvedSubtitle =
    subtitle ?? (mode === "pagar" ? "Valores a desembolsar" : "Valores esperados");

  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-[15px] font-bold">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">{resolvedSubtitle}</p>
        </div>
      </div>
      <BarChart bars={bars} height={130} defaultColor={futureColor} />
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">Total 30 dias</span>
        <span className="font-bold tabular-nums">{formatBRL(total)}</span>
      </div>
    </div>
  );
}
