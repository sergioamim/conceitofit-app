"use client";

import { Button } from "@/components/ui/button";
import { TipoVenda } from "@/lib/types";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface SaleTypeSelectorProps {
  workspace: VendaWorkspace;
}

export function SaleTypeSelector({ workspace }: SaleTypeSelectorProps) {
  const { tipoVenda, setTipoVenda } = workspace;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de venda</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(["PLANO", "SERVICO", "PRODUTO"] as TipoVenda[]).map((tipo) => {
          const label = tipo === "PLANO" ? "Contrato" : tipo === "SERVICO" ? "Serviço" : "Produto";
          return (
            <Button
              key={tipo}
              variant={tipoVenda === tipo ? "default" : "outline"}
              className={tipoVenda === tipo ? "" : "border-border"}
              onClick={() => setTipoVenda(tipo)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
