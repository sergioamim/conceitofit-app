"use client";

import { Plus } from "lucide-react";
import type { Produto } from "@/lib/shared/types/plano";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/**
 * Shape oficial: `Produto` de `@/lib/shared/types/plano`.
 *
 * Diferenças vs pseudo-schema da story:
 * - `preco` → `valorVenda` (adotamos o oficial)
 * - `thumbnailUrl` não existe no oficial (ainda) → aceitamos via prop opcional
 *   por id via `thumbnails` ou via campo extendido interno; por ora assumimos
 *   sem imagem (placeholder `--muted`).
 */
export interface CatalogProdutosProps {
  produtos: Produto[];
  /** Map opcional id → URL de thumbnail (fica fora do tipo de domínio). */
  thumbnails?: Record<string, string>;
  /** Disparado ao clicar no `+`. */
  onAdd?: (produto: Produto) => void;
  className?: string;
}

/**
 * Grid 3x2 de produtos com thumbnail placeholder (AC3).
 *
 * Puro: sem fetch (AC4). Preço em `font-mono` (AC5).
 * Responsivo (AC6):
 * - 1 coluna < 480px
 * - 2 colunas a partir de sm (~640px)
 * - 3 colunas a partir de lg (≥1024px, alinhado ao layout right-collapsed ≥1280px)
 */
export function CatalogProdutos({
  produtos,
  thumbnails,
  onAdd,
  className,
}: CatalogProdutosProps) {
  if (produtos.length === 0) {
    return (
      <div
        data-testid="catalog-produtos-empty"
        className={cn(
          "rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Nenhum produto disponível no momento.
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Catálogo de produtos"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {produtos.map((produto) => {
        const thumb = thumbnails?.[produto.id];
        return (
          <div
            key={produto.id}
            role="listitem"
            data-testid={`catalog-produto-${produto.id}`}
            className="flex flex-col rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/30"
          >
            <div
              data-testid={`catalog-produto-${produto.id}-thumb`}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-lg",
                !thumb && "bg-muted",
              )}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={produto.nome}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex size-full items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  sem foto
                </div>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-sm font-semibold">{produto.nome}</p>

            <p className="mt-1 font-mono text-sm font-bold text-gym-accent">
              {formatBRL(Number(produto.valorVenda ?? 0))}
            </p>

            {onAdd && (
              <button
                type="button"
                aria-label={`Adicionar produto ${produto.nome}`}
                onClick={() => onAdd(produto)}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-secondary text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
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
