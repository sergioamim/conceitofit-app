"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ContaPagar,
  FormaPagamento,
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
import { pagarContaSchema, type PagarContaFormValues } from "./pagar-conta-schema";

function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0)
  );
}

export type PagamentoFormState = PagarContaFormValues;

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
  const { register, control, handleSubmit, reset } = useForm<PagarContaFormValues>({
    resolver: zodResolver(pagarContaSchema),
    defaultValues: {
      dataPagamento: todayISO,
      formaPagamento: "PIX",
      valorPago: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    reset({
      dataPagamento: todayISO,
      formaPagamento: "PIX",
      valorPago: "",
      observacoes: "",
    });
  }, [conta, todayISO, reset]);

  async function onFormSubmit(values: PagarContaFormValues) {
    if (!conta) return;
    await onSubmit(conta.id, values);
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
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de pagamento
              </label>
              <Input
                type="date"
                {...register("dataPagamento")}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento
              </label>
              <Controller
                control={control}
                name="formaPagamento"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
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
                {...register("valorPago")}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <textarea
                {...register("observacoes")}
                className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="submit">Confirmar pagamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
