"use client";

import { BadgeCheck, AlertTriangle, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatBRL, formatDate } from "@/lib/formatters";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import type { PagamentoComAluno } from "@/lib/tenant/financeiro/recebimentos";

const TIPO_LABEL: Record<string, string> = {
  MATRICULA: "Matrícula",
  MENSALIDADE: "Mensalidade",
  TAXA: "Taxa",
  PRODUTO: "Produto",
  AVULSO: "Avulso",
};

interface PagamentosTableProps {
  pagamentos: PagamentoComAluno[];
  nfseBloqueio: string | null;
  onReceber: (pagamento: PagamentoComAluno) => void;
  onReceberSplit?: (pagamento: PagamentoComAluno) => void;
  onEmitirNfse: (pagamento: PagamentoComAluno) => void;
  onDetalhesNfse: (pagamento: PagamentoComAluno) => void;
}

export function PagamentosTable({
  pagamentos,
  nfseBloqueio,
  onReceber,
  onReceberSplit,
  onEmitirNfse,
  onDetalhesNfse,
}: PagamentosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary">
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cliente
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Valor
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vencimento
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              NFS-e
            </th>
            <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pagamentos.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Nenhum pagamento encontrado
              </td>
            </tr>
          )}
          {pagamentos.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-secondary/40">
              <td className="px-4 py-3">
                <p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                {p.descricao}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {TIPO_LABEL[p.tipo] ?? p.tipo}
              </td>
              <td className="px-4 py-3">
                <p className="font-display font-bold text-sm text-gym-accent">
                  {formatBRL(p.valorFinal)}
                </p>
                {p.desconto > 0 && (
                  <p className="text-xs text-muted-foreground">
                    desc. {formatBRL(p.desconto)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="text-sm">{formatDate(p.dataVencimento)}</p>
                {p.dataPagamento && (
                  <p className="text-xs text-gym-teal">
                    Pago em {formatDate(p.dataPagamento)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3">
                <div className="inline-flex items-center gap-2 text-xs">
                  {p.nfseEmitida ? (
                    <button
                      type="button"
                      onClick={() => onDetalhesNfse(p)}
                      className="inline-flex items-center gap-2 rounded-md"
                      title="Detalhes da NFS-e"
                    >
                      <BadgeCheck className="size-4 text-gym-teal" />
                      <span className="font-semibold text-gym-teal">Emitida</span>
                    </button>
                  ) : nfseBloqueio ? (
                    <span
                      className="inline-flex items-center gap-2 rounded-md"
                      title={nfseBloqueio}
                    >
                      <AlertTriangle className="size-4 text-gym-danger" />
                      <span className="font-semibold text-gym-danger">Bloqueada</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEmitirNfse(p)}
                      className="inline-flex items-center gap-2 rounded-md"
                      title="Emitir NFS-e"
                    >
                      <AlertTriangle className="size-4 text-gym-warning" />
                      <span className="font-semibold text-gym-warning">Pendente</span>
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {isPagamentoEmAberto(p.status) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onReceber(p)}
                        className="h-7 text-xs"
                      >
                        Receber
                      </Button>
                      {onReceberSplit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReceberSplit(p)}
                          className="h-7 text-xs"
                          title="Receber dividindo em múltiplas formas"
                          data-testid={`pagamento-receber-split-${p.id}`}
                        >
                          <Split className="mr-1 size-3" />
                          Split
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
