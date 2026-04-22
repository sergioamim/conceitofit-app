"use client";

import { User, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chip no header do cockpit (VUN-Onda-4 — 2026-04-22) mostrando o cliente
 * atualmente selecionado. Substitui o campo de busca de cliente da coluna
 * esquerda (removida). Click em "Trocar" limpa a seleção e abre a busca
 * universal (⌘K) via custom event já existente em `universal-search.tsx`.
 *
 * Sem cliente selecionado, renderiza o estado "Selecionar cliente" como
 * call-to-action convidando o operador a abrir o ⌘K.
 */
interface HeaderClienteChipProps {
  clienteQuery: string;
  clienteSelecionado: boolean;
  onTrocar: () => void;
  /**
   * Dispatcher pra abrir a busca universal. Geralmente emite
   * `FOCUS_UNIVERSAL_SEARCH_EVENT` via `window.dispatchEvent`.
   */
  onAbrirBusca: () => void;
}

export function HeaderClienteChip({
  clienteQuery,
  clienteSelecionado,
  onTrocar,
  onAbrirBusca,
}: HeaderClienteChipProps) {
  if (!clienteSelecionado) {
    return (
      <button
        type="button"
        onClick={onAbrirBusca}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white/70 transition",
          "hover:border-white/30 hover:bg-white/10 hover:text-white",
        )}
        data-testid="cockpit-cliente-chip-empty"
        aria-label="Selecionar cliente"
      >
        <User className="size-3.5" aria-hidden />
        Selecionar cliente
      </button>
    );
  }

  // Label compacto: tenta mostrar só o nome antes do primeiro separador "·".
  const displayLabel = clienteQuery.split(" · ")[0] ?? clienteQuery;

  return (
    <div
      className="inline-flex max-w-[320px] items-center gap-1.5 rounded-full border border-gym-accent/40 bg-gym-accent/10 pl-3 pr-1 py-0.5 text-[12px] text-gym-accent"
      data-testid="cockpit-cliente-chip"
    >
      <User className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate font-medium" title={clienteQuery}>
        {displayLabel}
      </span>
      <button
        type="button"
        onClick={() => {
          onTrocar();
          onAbrirBusca();
        }}
        className={cn(
          "ml-1 inline-flex size-5 items-center justify-center rounded-full text-gym-accent/70 transition",
          "hover:bg-gym-accent/20 hover:text-gym-accent",
        )}
        data-testid="cockpit-cliente-chip-trocar"
        aria-label={`Trocar cliente (atual: ${clienteQuery})`}
        title="Trocar cliente"
      >
        <X className="size-3" aria-hidden />
      </button>
    </div>
  );
}
