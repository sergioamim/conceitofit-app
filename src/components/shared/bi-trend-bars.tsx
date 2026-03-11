"use client";

import type { BiSeriePonto } from "@/lib/types";

type BiTrendBarsProps = {
  points: BiSeriePonto[];
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function BiTrendBars({ points }: BiTrendBarsProps) {
  const maxReceita = Math.max(1, ...points.map((item) => item.receita));

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Sem série histórica para o recorte atual.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {points.map((point) => (
        <div key={`${point.periodoInicio}-${point.periodoFim}`} className="rounded-lg border border-border bg-secondary/20 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{point.label}</p>
              <p className="text-xs text-muted-foreground">{formatBRL(point.receita)}</p>
            </div>
            <div className="flex gap-2 text-[11px] text-muted-foreground">
              <span>Conv. {point.conversaoPct.toFixed(1)}%</span>
              <span>Oc. {point.ocupacaoPct.toFixed(1)}%</span>
              <span>Ret. {point.retencaoPct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-gym-accent transition-all"
              style={{ width: `${Math.max(6, Math.round((point.receita / maxReceita) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
