"use client";

import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface SaleHeaderProps {
  workspace: VendaWorkspace;
}

export function SaleHeader({ workspace }: SaleHeaderProps) {
  const { tenant } = workspace;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Nova Venda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Carrinho unificado de plano, serviço e produto
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Unidade</p>
        <p className="font-medium">{tenant?.nome ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{tenant?.subdomain ?? ""}</p>
      </div>
    </div>
  );
}
