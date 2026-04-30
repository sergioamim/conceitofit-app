"use client";

type DiariasMesHighlightProps = {
  quantidade: number;
  mesLegenda: string;
  notaTooltip?: string;
};

export function DiariasMesHighlight({ quantidade, mesLegenda, notaTooltip }: DiariasMesHighlightProps) {
  return (
    <div
      title={notaTooltip}
      className="rounded-2xl border border-dashed border-gym-accent/40 bg-gym-accent/5 px-4 py-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Diárias no mês</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight">
        {quantidade.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Vigência de 1 dia · {mesLegenda}
      </p>
    </div>
  );
}
