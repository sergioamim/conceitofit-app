"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutPayment } from "@/components/shared/checkout-payment";
import { formatBRL } from "@/lib/formatters";
import { VendaWorkspace } from "../hooks/use-venda-workspace";
import { PagamentoVenda } from "@/lib/types";

interface SaleSummaryProps {
  workspace: VendaWorkspace;
  handleConfirmPayment: (pagamento: PagamentoVenda) => Promise<void>;
}

export function SaleSummary({ workspace, handleConfirmPayment }: SaleSummaryProps) {
  const {
    subtotal,
    cupomCode,
    setCupomCode,
    applyCupom,
    cupomAppliedCode,
    cupomPercent,
    dryRun,
    selectedConvenio,
    cupomError,
    acrescimoGeral,
    setAcrescimoGeral,
    total,
    saving,
    selectedPlano,
  } = workspace;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-display text-base font-bold">Resumo</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Cupom</span>
            <div className="flex items-center gap-2">
              <Input
                value={cupomCode}
                onChange={(e) => setCupomCode(e.target.value.toUpperCase())}
                placeholder="Código"
                className="h-8 w-32 bg-secondary border-border"
              />
              <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => applyCupom(cupomCode)}>
                Aplicar
              </Button>
            </div>
          </div>
          {cupomAppliedCode && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gym-teal">Cupom {cupomAppliedCode} aplicado ({cupomPercent}%)</span>
              <span className="text-gym-teal">- {formatBRL(dryRun?.descontoCupom ?? (subtotal * cupomPercent / 100))}</span>
            </div>
          )}
          {selectedConvenio && (dryRun?.descontoConvenio ?? 0) > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gym-teal">
                Convênio {selectedConvenio.nome} aplicado ({selectedConvenio.descontoPercentual}%)
              </span>
              <span className="text-gym-teal">- {formatBRL(dryRun?.descontoConvenio ?? 0)}</span>
            </div>
          )}
          {cupomError && <p className="text-xs text-gym-danger">{cupomError}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Acréscimo</span>
            <Input type="number" min={0} step="0.01" value={acrescimoGeral} onChange={(e) => setAcrescimoGeral(e.target.value)} className="h-8 w-28 bg-secondary border-border" />
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="text-gym-accent">{formatBRL(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <CheckoutPayment
        total={total}
        onConfirm={handleConfirmPayment}
        loading={saving}
        disabledFormasPagamento={
          selectedPlano && !selectedPlano.permiteCobrancaRecorrente ? ["RECORRENTE"] : []
        }
      />
    </div>
  );
}
