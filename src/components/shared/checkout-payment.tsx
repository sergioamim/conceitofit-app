"use client";

import { useMemo, useState } from "react";
import type { PagamentoVenda, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";

export function CheckoutPayment({
  total,
  onConfirm,
  loading,
  disabledFormasPagamento = [],
}: {
  total: number;
  onConfirm: (data: PagamentoVenda) => void;
  loading?: boolean;
  disabledFormasPagamento?: TipoFormaPagamento[];
}) {
  const [formaPagamento, setFormaPagamento] = useState<TipoFormaPagamento>("PIX");
  const [parcelas, setParcelas] = useState("1");
  const [codigoTransacao, setCodigoTransacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const totalPreview = useMemo(() => formatBRL(total || 0), [total]);
  const effectiveFormaPagamento = disabledFormasPagamento.includes(formaPagamento)
    ? "PIX"
    : formaPagamento;

  function handleConfirm() {
    onConfirm({
      formaPagamento: effectiveFormaPagamento,
      parcelas:
        effectiveFormaPagamento === "CARTAO_CREDITO"
          ? Math.max(1, parseInt(parcelas, 10) || 1)
          : undefined,
      valorPago: Math.max(0, total),
      codigoTransacao:
        effectiveFormaPagamento === "CARTAO_CREDITO"
          ? codigoTransacao.trim() || undefined
          : undefined,
      observacoes: observacoes.trim() || undefined,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-display text-base font-bold">Pagamento</h3>
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="checkout-payment-forma" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</label>
          <Select value={effectiveFormaPagamento} onValueChange={(v) => setFormaPagamento(v as TipoFormaPagamento)}>
            <SelectTrigger id="checkout-payment-forma" aria-label="Forma de pagamento" className="w-full bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              <SelectItem value="CARTAO_CREDITO" disabled={disabledFormasPagamento.includes("CARTAO_CREDITO")}>Cartão crédito</SelectItem>
              <SelectItem value="CARTAO_DEBITO" disabled={disabledFormasPagamento.includes("CARTAO_DEBITO")}>Cartão débito</SelectItem>
              <SelectItem value="BOLETO" disabled={disabledFormasPagamento.includes("BOLETO")}>Boleto</SelectItem>
              <SelectItem value="RECORRENTE" disabled={disabledFormasPagamento.includes("RECORRENTE")}>Recorrente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="checkout-payment-parcelas" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas</label>
            <Input
              id="checkout-payment-parcelas"
              type="number"
              min={1}
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              className="bg-secondary border-border"
              disabled={effectiveFormaPagamento !== "CARTAO_CREDITO"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</label>
            <div className="h-10 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-gym-accent">
              {totalPreview}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-payment-codigo-transacao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Código da transação
          </label>
          <Input
            id="checkout-payment-codigo-transacao"
            value={codigoTransacao}
            onChange={(e) => setCodigoTransacao(e.target.value)}
            className="bg-secondary border-border"
            placeholder="Número do cupom ou identificador impresso para conciliação futura"
          />
          <p className="text-xs text-muted-foreground">
            Número do cupom ou identificador impresso para conciliação futura
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-payment-observacoes" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
          <Input
            id="checkout-payment-observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="bg-secondary border-border"
            placeholder="Opcional"
          />
        </div>

        <Button onClick={handleConfirm} className="w-full" disabled={loading || total <= 0}>
          {loading ? "Finalizando..." : "Finalizar venda"}
        </Button>
      </div>
    </div>
  );
}
