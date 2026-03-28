"use client";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/formatters";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface CartItemsProps {
  workspace: VendaWorkspace;
}

export function CartItems({ workspace }: CartItemsProps) {
  const { cart, removeCartItem } = workspace;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold">Itens da venda</h3>
        <span className="text-xs text-muted-foreground">{cart.length} item(ns)</span>
      </div>

      <div className="mt-3 space-y-2">
        {cart.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
        {cart.map((item, idx) => (
          <div key={`${item.referenciaId}-${idx}`} className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.descricao}</p>
              <Button variant="outline" size="sm" className="h-7 border-border" onClick={() => removeCartItem(idx)}>Remover</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.tipo === "PLANO" ? formatBRL(item.valorUnitario) : `${item.quantidade} x ${formatBRL(item.valorUnitario)}`}
            </p>
            {item.detalhes && <p className="text-[11px] text-muted-foreground">{item.detalhes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
