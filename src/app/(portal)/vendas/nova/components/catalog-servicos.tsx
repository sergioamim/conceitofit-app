"use client";

import { Plus } from "lucide-react";
import type { Servico } from "@/lib/shared/types/plano";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/**
 * Shape oficial: `Servico` de `@/lib/shared/types/plano`.
 *
 * A story pede `preco: number` — o tipo oficial usa `valor: number`, mantemos o
 * shape oficial (política "adote o shape oficial") e lemos `servico.valor`.
 */
export interface CatalogServicosProps {
  servicos: Servico[];
  /** Disparado ao clicar no `+`. */
  onAdd?: (servico: Servico) => void;
  className?: string;
}

/**
 * Grid de serviços com botão `+` à direita (AC2).
 *
 * Puro: sem fetch (AC4). Preço em `font-mono` (AC5).
 * Responsivo (AC6): 1 coluna em mobile, 2 em sm+, 3 em lg+ — serviços têm
 * pouca info e o layout em coluna única desperdiçava espaço horizontal.
 */
export function CatalogServicos({ servicos, onAdd, className }: CatalogServicosProps) {
  if (servicos.length === 0) {
    return (
      <div
        data-testid="catalog-servicos-empty"
        className={cn(
          "rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Nenhum serviço disponível no momento.
      </div>
    );
  }

  return (
    <ul
      aria-label="Catálogo de serviços"
      className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {servicos.map((servico) => (
        <li
          key={servico.id}
          data-testid={`catalog-servico-${servico.id}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-secondary/30"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{servico.nome}</p>
            {servico.descricao && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {servico.descricao}
              </p>
            )}
            <p className="mt-1 font-mono text-sm font-bold text-gym-accent">
              {formatBRL(Number(servico.valor ?? 0))}
            </p>
          </div>

          {onAdd && (
            <button
              type="button"
              aria-label={`Adicionar serviço ${servico.nome}`}
              onClick={() => onAdd(servico)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
