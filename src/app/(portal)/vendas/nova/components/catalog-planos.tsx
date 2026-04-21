"use client";

import { Plus } from "lucide-react";
import type { Plano } from "@/lib/shared/types/plano";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/**
 * Shape oficial vem de `@/lib/shared/types/plano` (Plano).
 *
 * A story (VUN-2.2) usa duas flags de UI — `recomendado` e `destaque`:
 * - `destaque` JÁ EXISTE no Plano oficial (boolean required) → "card invertido"
 * - `recomendado` NÃO EXISTE no Plano oficial → ribbon dourado (UI-only)
 *
 * Em vez de mutar o tipo de domínio, aceitamos `recomendado` como prop opcional
 * por item (`planoRecomendadoId`) — mais explícito e evita duplicar o tipo.
 */
export interface CatalogPlanosProps {
  planos: Plano[];
  /** Id do plano que deve exibir o ribbon "Recomendado" dourado. */
  planoRecomendadoId?: string;
  /** Id do plano atualmente selecionado (para highlight). */
  selectedPlanoId?: string;
  /** Handler chamado ao clicar no card ou no botão `+`. */
  onAdd?: (plano: Plano) => void;
  className?: string;
}

/**
 * Grid 2x2 de planos (AC1).
 *
 * Ribbon "Recomendado" dourado em `planoRecomendadoId` — usa `amber-400/500` pois
 * o design system ainda não expõe um token `--gold` dedicado (documentado no PR).
 * Card invertido (cores trocadas) para itens com `plano.destaque === true`.
 *
 * Puro: não faz fetch — consome `planos` via props (AC4).
 * Responsivo (AC6): `grid-cols-1` em <640px, `grid-cols-2` a partir de sm.
 */
export function CatalogPlanos({
  planos,
  planoRecomendadoId,
  selectedPlanoId,
  onAdd,
  className,
}: CatalogPlanosProps) {
  if (planos.length === 0) {
    return (
      <div
        data-testid="catalog-planos-empty"
        className={cn(
          "rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Nenhum plano disponível no momento.
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Catálogo de planos"
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}
    >
      {planos.map((plano) => {
        const isRecomendado = plano.id === planoRecomendadoId;
        const isDestaque = plano.destaque;
        const isSelected = plano.id === selectedPlanoId;

        return (
          <div
            key={plano.id}
            role="listitem"
            data-testid={`catalog-plano-${plano.id}`}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4 transition-colors",
              // Card invertido quando em destaque: cores trocadas (primary bg)
              isDestaque
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-secondary/30",
              isSelected && "ring-2 ring-gym-accent/60",
            )}
          >
            {isRecomendado && (
              <span
                data-testid={`catalog-plano-${plano.id}-ribbon`}
                className="absolute right-0 top-3 rounded-l-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm"
              >
                Recomendado
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider",
                    isDestaque ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {plano.tipo}
                </p>
                <h3 className="mt-1 truncate font-display text-lg font-bold">{plano.nome}</h3>
              </div>
            </div>

            <p
              className={cn(
                "mt-3 font-mono text-2xl font-bold",
                isDestaque ? "text-primary-foreground" : "text-gym-accent",
              )}
            >
              {formatBRL(Number(plano.valor ?? 0))}
            </p>

            <p
              className={cn(
                "mt-1 text-xs",
                isDestaque ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {plano.duracaoDias} dias
            </p>

            {onAdd && (
              <button
                type="button"
                aria-label={`Adicionar plano ${plano.nome}`}
                onClick={() => onAdd(plano)}
                className={cn(
                  "mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors",
                  isDestaque
                    ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                <Plus className="size-3.5" aria-hidden />
                Adicionar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
