"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface CartItemsProps {
  workspace: VendaWorkspace;
}

export function CartItems({ workspace }: CartItemsProps) {
  const { cart, removeCartItem, setCartItemQuantidade } = workspace;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Itens da venda</h3>
        <span className="text-xs text-muted-foreground">{cart.length} item(ns)</span>
      </div>

      <div className="mt-3 space-y-2">
        {cart.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
        {cart.map((item, idx) => {
          // PLANO: quantidade sempre 1, sem stepper. Demais (PRODUTO/SERVICO)
          // permitem editar via botões +/-. Serviço na prática é 1 sessão
          // (decisão de produto 2026-04-22); operador pode somar sessões se
          // quiser cobrar pack, mesmo comportamento de produto.
          const podeEditarQty = item.tipo !== "PLANO";
          const total = item.valorUnitario * Math.max(1, item.quantidade || 1);
          return (
            <div
              key={`${item.referenciaId}-${idx}`}
              className="rounded-lg border border-border bg-secondary/30 p-3"
              data-testid="cart-item"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.descricao}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-border"
                  onClick={() => removeCartItem(idx)}
                  data-testid={`cart-item-remove-${idx}`}
                >
                  Remover
                </Button>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                {podeEditarQty ? (
                  <div
                    className="inline-flex items-center gap-1"
                    data-testid={`cart-item-qty-stepper-${idx}`}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn("h-6 w-6 border-border")}
                      onClick={() =>
                        setCartItemQuantidade(idx, Math.max(1, item.quantidade - 1))
                      }
                      disabled={item.quantidade <= 1}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="size-3" aria-hidden />
                    </Button>
                    <span
                      className="w-8 text-center text-sm font-mono"
                      data-testid={`cart-item-qty-${idx}`}
                      aria-label={`Quantidade: ${item.quantidade}`}
                    >
                      {item.quantidade}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn("h-6 w-6 border-border")}
                      onClick={() => setCartItemQuantidade(idx, item.quantidade + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="size-3" aria-hidden />
                    </Button>
                    <span className="ml-2 text-xs text-muted-foreground">
                      × {formatBRL(item.valorUnitario)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {formatBRL(item.valorUnitario)}
                  </span>
                )}
                {podeEditarQty ? (
                  <span className="text-sm font-semibold">{formatBRL(total)}</span>
                ) : null}
              </div>
              {item.detalhes && (
                <p className="mt-1 text-[11px] text-muted-foreground">{item.detalhes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
