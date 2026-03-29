"use client";

import { useState } from "react";
import type {
  ContaPagar,
  FormaPagamento,
  TipoFormaPagamento,
} from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";

function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0)
  );
}

export type PagamentoFormState = {
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  valorPago: string;
  observacoes: string;
};

type PagarContaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagar | null;
  formasPagamento: FormaPagamento[];
  todayISO: string;
  onSubmit: (contaId: string, form: PagamentoFormState) => Promise<void>;
};

export function PagarContaModal({
  open,
  onOpenChange,
  conta,
  formasPagamento,
  todayISO,
  onSubmit,
}: PagarContaModalProps) {
  const [form, setForm] = useState<PagamentoFormState>({
    dataPagamento: todayISO,
    formaPagamento: "PIX",
    valorPago: "",
    observacoes: "",
  });

  // Reset form when a new conta is selected
  const [prevConta, setPrevConta] = useState<ContaPagar | null>(conta);
  if (conta !== prevConta) {
    setPrevConta(conta);
    setForm({
      dataPagamento: todayISO,
      formaPagamento: "PIX",
      valorPago: "",
      observacoes: "",
    });
  }

  async function handleSubmit() {
    if (!conta) return;
    await onSubmit(conta.id, form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Baixar conta</DialogTitle>
          <DialogDescription>
            Registrar pagamento para {conta?.fornecedor ?? "fornecedor"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data de pagamento
            </label>
            <Input
              type="date"
              value={form.dataPagamento}
              onChange={(e) =>
                setForm((v) => ({ ...v, dataPagamento: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Forma de pagamento
            </label>
            <Select
              value={form.formaPagamento}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, formaPagamento: value as TipoFormaPagamento }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.id} value={forma.tipo}>
                    {forma.nome}
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
              placeholder={`Padrão: ${formatBRL(conta ? contaTotal(conta) : 0)}`}
              value={form.valorPago}
              onChange={(e) => setForm((v) => ({ ...v, valorPago: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) =>
                setForm((v) => ({ ...v, observacoes: e.target.value }))
              }
              className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSubmit}>Confirmar pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
