/**
 * Card "Composição por categoria" — donut + legenda com valores e %.
 * Espelho de `dashboard.jsx:90-131` do design.
 */

import { formatBRL } from "@/lib/formatters";
import type { CategoriaDef } from "@/lib/finance/contas-status";
import { Donut } from "./donut";

export type CategoriaBreakdownConta = {
  categoria: string;
  valor: number;
  pago: boolean;
};

export type CategoriaBreakdownProps = {
  contas: CategoriaBreakdownConta[];
  categorias: CategoriaDef[];
  title?: string;
  subtitle?: string;
  /** Limite de linhas na legenda (top N por valor). Default: 5. */
  topN?: number;
  className?: string;
};

export function CategoriaBreakdown({
  contas,
  categorias,
  title = "Composição por categoria",
  subtitle = "Contas em aberto, por tipo",
  topN = 5,
  className,
}: CategoriaBreakdownProps) {
  const byCat = new Map<string, number>();
  for (const c of contas) {
    if (c.pago) continue;
    byCat.set(c.categoria, (byCat.get(c.categoria) ?? 0) + c.valor);
  }
  const segments = categorias
    .map((cat) => ({
      label: cat.nome,
      color: cat.color,
      value: byCat.get(cat.id) ?? 0,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-[15px] font-bold">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-secondary text-muted-foreground text-[11px] font-semibold">
          {segments.length} categoria{segments.length === 1 ? "" : "s"}
        </span>
      </div>

      {segments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma conta em aberto no período.
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Donut segments={segments} size={140} thickness={18} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total
              </div>
              <div className="font-bold text-[15px] tabular-nums">
                {formatBRL(total)}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {segments.slice(0, topN).map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{s.label}</span>
                <span className="tabular-nums font-semibold">{formatBRL(s.value)}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
                  {((s.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
