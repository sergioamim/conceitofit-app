"use client";

import type { Dispatch, SetStateAction } from "react";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PagamentoNoCadastroState } from "./conta-pagar-types";
import { FORMA_PAGAMENTO_LABEL, formatBRL } from "./conta-pagar-types";

type ContaPagarPagamentoInlineProps = {
  registrarComoPaga: boolean;
  setRegistrarComoPaga: Dispatch<SetStateAction<boolean>>;
  pagamento: PagamentoNoCadastroState;
  setPagamento: Dispatch<SetStateAction<PagamentoNoCadastroState>>;
  formasPagamentoUnicas: FormaPagamento[];
  valorContaLiquida: number;
};

export function ContaPagarPagamentoInline({
  registrarComoPaga,
  setRegistrarComoPaga,
  pagamento,
  setPagamento,
  formasPagamentoUnicas,
  valorContaLiquida,
}: ContaPagarPagamentoInlineProps) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={registrarComoPaga}
          onChange={(e) => setRegistrarComoPaga(e.target.checked)}
        />
        Registrar como paga no cadastro
      </label>

      {registrarComoPaga && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data de pagamento
            </label>
            <Input
              type="date"
              value={pagamento.dataPagamento}
              onChange={(e) =>
                setPagamento((p) => ({
                  ...p,
                  dataPagamento: e.target.value,
                }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Forma de pagamento
            </label>
            <Select
              value={pagamento.formaPagamento}
              onValueChange={(value) =>
                setPagamento((p) => ({ ...p, formaPagamento: value as TipoFormaPagamento }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {formasPagamentoUnicas.map((forma) => (
                  <SelectItem key={forma.id} value={forma.tipo}>
                    {FORMA_PAGAMENTO_LABEL[forma.tipo] ?? forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor pago
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={`Padrão: ${formatBRL(valorContaLiquida)}`}
              value={pagamento.valorPago}
              onChange={(e) =>
                setPagamento((p) => ({ ...p, valorPago: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={pagamento.observacoes}
              onChange={(e) =>
                setPagamento((p) => ({ ...p, observacoes: e.target.value }))
              }
              className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
