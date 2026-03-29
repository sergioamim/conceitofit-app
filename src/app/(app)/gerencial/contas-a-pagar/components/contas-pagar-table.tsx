"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { isContaPagarEmAberto, isContaPagarPendente } from "@/lib/domain/status-helpers";
import { ContasPagarWorkspace, formatDate, formatBRL, contaTotal, CATEGORIA_LABEL, GRUPO_DRE_LABEL } from "../hooks/use-contas-pagar-workspace";

interface ContasPagarTableProps {
  workspace: ContasPagarWorkspace;
}

export function ContasPagarTable({ workspace }: ContasPagarTableProps) {
  const {
    loading,
    filtered,
    tipoContaMap,
    setSelectedConta,
    setOpenPagarConta,
    abrirModalEdicao,
    handleCancelarConta,
  } = workspace;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-3 text-left font-semibold">Vencimento</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Tipo de conta</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Fornecedor</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Descrição</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Categoria</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Valor</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-muted-foreground">
                Carregando...
              </td>
            </tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-muted-foreground">
                Nenhuma conta encontrada no período.
              </td>
            </tr>
          )}
          {!loading &&
            filtered.map((conta) => {
              const tipoConta = conta.tipoContaId ? tipoContaMap.get(conta.tipoContaId) : undefined;
              return (
                <tr key={conta.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(conta.dataVencimento)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tipoConta?.nome ?? "Sem tipo (legado)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {GRUPO_DRE_LABEL[conta.grupoDre ?? "DESPESA_OPERACIONAL"]}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{conta.fornecedor}</p>
                    {conta.documentoFornecedor && (
                      <p className="text-xs text-muted-foreground">{conta.documentoFornecedor}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{conta.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{CATEGORIA_LABEL[conta.categoria]}</td>
                  <td className="px-4 py-3 font-semibold text-gym-accent">{formatBRL(contaTotal(conta))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={conta.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isContaPagarEmAberto(conta.status) && (
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setSelectedConta(conta);
                            setOpenPagarConta(true);
                          }}
                        >
                          Pagar
                        </Button>
                      )}
                      {conta.status !== "CANCELADA" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-border"
                          onClick={() => abrirModalEdicao(conta)}
                        >
                          Editar
                        </Button>
                      )}
                      {isContaPagarPendente(conta.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-border"
                          onClick={() => handleCancelarConta(conta.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
