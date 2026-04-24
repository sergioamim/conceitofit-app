"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";

function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0)
  );
}

const pagamentoFormSchema = z.object({
  dataPagamento: requiredTrimmedString("Informe a data de pagamento."),
  formaPagamento: requiredTrimmedString("Selecione a forma de pagamento."),
  valorPago: z.string(),
  observacoes: optionalTrimmedString(),
});

type PagamentoFormValues = z.infer<typeof pagamentoFormSchema>;

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

function defaultValues(todayISO: string): PagamentoFormValues {
  return {
    dataPagamento: todayISO,
    formaPagamento: "PIX",
    valorPago: "",
    observacoes: "",
  };
}

export function PagarContaModal({
  open,
  onOpenChange,
  conta,
  formasPagamento,
  todayISO,
  onSubmit,
}: PagarContaModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PagamentoFormValues>({
    resolver: zodResolver(pagamentoFormSchema),
    mode: "onTouched",
    defaultValues: defaultValues(todayISO),
  });

  const canSave = Boolean(watch("dataPagamento")) && Boolean(watch("formaPagamento"));

  // Reset form when a new conta is selected
  useEffect(() => {
    reset(defaultValues(todayISO));
  }, [conta, reset, todayISO]);

  function onFormSubmit(values: PagamentoFormValues) {
    if (!conta) return;
    onSubmit(conta.id, {
      dataPagamento: values.dataPagamento,
      formaPagamento: values.formaPagamento as TipoFormaPagamento,
      valorPago: values.valorPago,
      observacoes: values.observacoes ?? "",
    });
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
                Data de pagamento *
              </label>
              <Input
                type="date"
                {...register("dataPagamento")}
                className="bg-secondary border-border"
              />
              {errors.dataPagamento ? (
                <p className="text-xs text-gym-danger">{errors.dataPagamento.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento *
              </label>
              <Controller
                control={control}
                name="formaPagamento"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
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
                )}
              />
              {errors.formaPagamento ? (
                <p className="text-xs text-gym-danger">{errors.formaPagamento.message}</p>
              ) : null}
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
            <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="submit" disabled={!canSave}>Confirmar pagamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
