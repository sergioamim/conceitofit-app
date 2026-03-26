"use client";

import { Check } from "lucide-react";
import type { Plano } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { getPublicPlanQuote, type PublicPlanQuote } from "@/lib/public/services";
import { cn } from "@/lib/utils";

export type PlanoSelectorCardVariant = "grid" | "compact";

export interface PlanoSelectorCardProps {
  plano: Plano;
  selected?: boolean;
  onSelect?: (plano: Plano) => void;
  /** Pre-computed quote; if omitted the card computes one from plano */
  quote?: PublicPlanQuote;
  parcelasAnuidade?: number;
  variant?: PlanoSelectorCardVariant;
  className?: string;
}

export function PlanoSelectorCard({
  plano,
  selected = false,
  onSelect,
  quote: externalQuote,
  parcelasAnuidade = 1,
  variant = "grid",
  className,
}: PlanoSelectorCardProps) {
  const quote = externalQuote ?? getPublicPlanQuote(plano, parcelasAnuidade);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(plano)}
        className={cn(
          "cursor-pointer rounded-lg border p-3 text-left transition-colors",
          selected
            ? "border-gym-accent bg-gym-accent/10"
            : "border-border bg-secondary/30 hover:bg-secondary/50",
          className,
        )}
      >
        <p className="text-sm font-semibold">{plano.nome}</p>
        <p className="mt-1 font-display text-lg font-bold text-gym-accent">
          {formatCurrency(Number(plano.valor ?? 0))}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {plano.tipo} · {plano.duracaoDias} dias
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Matrícula: {formatCurrency(Number(plano.valorMatricula ?? 0))}
        </p>
        {plano.cobraAnuidade && Number(plano.valorAnuidade ?? 0) > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Anuidade: {formatCurrency(Number(plano.valorAnuidade ?? 0))} (até{" "}
            {Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1))}x)
          </p>
        )}
      </button>
    );
  }

  // variant === "grid" — full card for public landing
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(plano)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(plano);
        }
      }}
      className={cn(
        "rounded-2xl border border-border/70 bg-card/70 px-6 py-6 backdrop-blur transition-colors",
        selected && "ring-1 ring-gym-accent/40",
        plano.destaque && !selected && "ring-1 ring-gym-accent/40",
        onSelect && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {plano.tipo}
          </p>
          <h3 className="mt-3 font-display text-2xl font-bold">{plano.nome}</h3>
        </div>
        {plano.destaque ? (
          <span className="rounded-full bg-gym-accent/15 px-3 py-1 text-xs font-semibold text-gym-accent">
            Mais vendido
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="font-display text-4xl font-bold text-gym-accent">
          {formatCurrency(plano.valor)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Total inicial estimado: {formatCurrency(quote.total)}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {quote.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-secondary/25 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{item.descricao}</p>
              {item.detalhes ? (
                <p className="text-xs text-muted-foreground">{item.detalhes}</p>
              ) : null}
            </div>
            <p className="text-sm font-semibold">{formatCurrency(item.valor)}</p>
          </div>
        ))}
      </div>

      {(plano.beneficios ?? []).length > 0 ? (
        <div className="mt-6 space-y-2">
          {(plano.beneficios ?? []).slice(0, 3).map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Check className="size-4 text-gym-teal" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
