"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { formatBRL, formatDate } from "@/lib/formatters";
import { ContasPagarWorkspace, contaTotal } from "../hooks/use-contas-pagar-workspace";

interface ContasPagarHeaderProps {
  workspace: ContasPagarWorkspace;
}

export function ContasPagarHeader({ workspace }: ContasPagarHeaderProps) {
  const { filtered, setOpenNovaConta } = workspace;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Pagar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestão de despesas da unidade com classificação DRE e recorrência.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ExportMenu
          data={filtered}
          columns={[
            { label: "Vencimento", accessor: (r) => formatDate(r.dataVencimento) },
            { label: "Fornecedor", accessor: (r) => r.fornecedor ?? "" },
            { label: "Descrição", accessor: (r) => r.descricao ?? "" },
            { label: "Categoria", accessor: (r) => r.categoria ?? "" },
            { label: "Valor", accessor: (r) => formatBRL(contaTotal(r)) },
            { label: "Status", accessor: "status" },
          ] satisfies ExportColumn<(typeof filtered)[number]>[]}
          filename="contas-a-pagar"
          title="Contas a Pagar"
        />
        <Button onClick={() => setOpenNovaConta(true)}>
          <Plus className="size-4" />
          Nova conta
        </Button>
      </div>
    </div>
  );
}
