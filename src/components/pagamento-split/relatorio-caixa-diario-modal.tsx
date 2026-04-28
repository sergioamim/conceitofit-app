"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatDateTimeBR } from "@/lib/formatters";
import {
  FORMA_PAGAMENTO_LABEL,
  type RelatorioCaixaDiarioDto,
  obterRelatorioCaixaDiarioApi,
} from "@/lib/api/pagamentos-split";

/**
 * Relatorio diario consolidado (W6 PRD_PAGAMENTO_SPLIT).
 * Lista total por forma de pagamento + linhas de reconciliacao com NSU pra
 * conferencia manual com extrato da maquininha.
 */
interface RelatorioCaixaDiarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RelatorioCaixaDiarioModal({
  open,
  onOpenChange,
  tenantId,
}: RelatorioCaixaDiarioModalProps) {
  const { toast } = useToast();
  const [data, setData] = useState<string>("");
  const [relatorio, setRelatorio] = useState<RelatorioCaixaDiarioDto | null>(null);
  const [loading, setLoading] = useState(false);

  // Default data = hoje (apenas client-side pra evitar hydration mismatch)
  useEffect(() => {
    if (open && !data) {
      setData(todayIsoLocal());
    }
  }, [open, data]);

  // Carrega relatorio quando abre ou data muda
  useEffect(() => {
    if (!open || !data) return;
    let cancelled = false;
    setLoading(true);
    obterRelatorioCaixaDiarioApi(tenantId, data)
      .then((r) => {
        if (!cancelled) setRelatorio(r);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erro ao carregar relatorio";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, data, tenantId, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório de Caixa — Diário</DialogTitle>
          <DialogDescription>
            Parcelas confirmadas no dia, agrupadas por forma de pagamento. Use a
            lista de reconciliação pra conferir com o extrato da maquininha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtro de data */}
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1 max-w-xs">
              <label htmlFor="rel-data" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data
              </label>
              <Input
                id="rel-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                data-testid="relatorio-data"
              />
            </div>
            {loading && (
              <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Total geral */}
          {relatorio && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total confirmado em {data}
              </div>
              <div
                className="mt-1 font-mono text-3xl font-bold text-gym-accent"
                data-testid="relatorio-total"
              >
                {formatBRL(relatorio.totalGeral)}
              </div>
              <div className="text-xs text-muted-foreground">
                {relatorio.qtdParcelasConfirmadas} parcela(s) confirmada(s) ·{" "}
                {relatorio.formas.length} forma(s) usada(s)
              </div>
            </div>
          )}

          {/* Por forma */}
          {relatorio && relatorio.formas.length === 0 && !loading && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma parcela confirmada nesta data.
            </div>
          )}

          {relatorio?.formas.map((f) => (
            <div
              key={f.forma}
              className="rounded-lg border border-border bg-card"
              data-testid={`relatorio-forma-${f.forma}`}
            >
              <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
                <div>
                  <div className="text-sm font-semibold">
                    {FORMA_PAGAMENTO_LABEL[f.forma]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {f.qtd} parcela(s)
                  </div>
                </div>
                <div className="font-mono text-lg font-bold">
                  {formatBRL(f.total)}
                </div>
              </div>
              {f.reconciliacao.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 text-left">Confirmado em</th>
                      <th className="px-3 py-2 text-left">NSU/Cód.</th>
                      <th className="px-3 py-2 text-left">Bandeira</th>
                      <th className="px-3 py-2 text-center">Parcelas</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.reconciliacao.map((r) => (
                      <tr key={r.parcelaId} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDateTimeBR(r.confirmadoEm)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.codigoAutorizacao}
                        </td>
                        <td className="px-3 py-2 text-xs">{r.bandeira ?? "—"}</td>
                        <td className="px-3 py-2 text-center text-xs">
                          {r.numeroParcelas > 1 ? `${r.numeroParcelas}×` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {formatBRL(r.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {f.reconciliacao.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  Sem códigos de autorização (forma sem reconciliação física).
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
