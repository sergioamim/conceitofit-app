"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getBusinessTodayIso } from "@/lib/business-date";
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";
import type { FormaPagamento, Pagamento, TipoFormaPagamento } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";

const receberPagamentoSchema = z.object({
  dataPagamento: requiredTrimmedString("Informe a data do pagamento."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"], {
    message: "Selecione a forma de pagamento.",
  }).or(z.literal("")),
  codigoTransacao: optionalTrimmedString().default(""),
  observacoes: optionalTrimmedString().default(""),
}).superRefine((values, ctx) => {
  if ((values.formaPagamento === "CARTAO_CREDITO" || values.formaPagamento === "CARTAO_DEBITO") && !values.codigoTransacao?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["codigoTransacao"],
      message: "Informe o código de autorização da maquininha.",
    });
  }
});

type ReceberPagamentoFormValues = z.infer<typeof receberPagamentoSchema>;

export function ReceberPagamentoModal({
  pagamento,
  formasPagamento,
  convenio,
  onClose,
  onConfirm,
}: {
  pagamento: Pagamento;
  formasPagamento: FormaPagamento[];
  convenio?: { nome: string; descontoPercentual: number };
  onClose: () => void;
  onConfirm: (data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    codigoTransacao?: string;
    observacoes?: string;
  }) => void;
}) {
  const formasAtivas = useMemo(() => formasPagamento.filter((f) => f.ativo), [formasPagamento]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ReceberPagamentoFormValues>({
    resolver: zodResolver(receberPagamentoSchema),
    defaultValues: {
      dataPagamento: getBusinessTodayIso(),
      formaPagamento: "",
      codigoTransacao: "",
      observacoes: "",
    },
    mode: "onChange",
  });
  const formaPagamento = useWatch({ control, name: "formaPagamento" });

  function onSubmit(values: ReceberPagamentoFormValues) {
    if (!values.formaPagamento) return;
    onConfirm({
      dataPagamento: values.dataPagamento,
      formaPagamento: values.formaPagamento,
      codigoTransacao: (values.formaPagamento === "CARTAO_CREDITO" || values.formaPagamento === "CARTAO_DEBITO")
        ? values.codigoTransacao.trim() || undefined
        : undefined,
      observacoes: values.observacoes.trim() || undefined,
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Receber pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              <p className="font-medium">{pagamento.descricao}</p>
              <p className="text-muted-foreground">
                Valor: <span className="font-semibold text-foreground">{formatBRL(pagamento.valorFinal)}</span>
              </p>
              {convenio ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Convênio: <span className="font-semibold text-foreground">{convenio.nome}</span> · {convenio.descontoPercentual}%
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="receber-data-pagamento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data do pagamento *
              </label>
              <Input id="receber-data-pagamento" type="date" aria-required {...register("dataPagamento")} className="border-border bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <label id="receber-forma-label" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento *
              </label>
              <Controller
                control={control}
                name="formaPagamento"

                render={({ field }) => (
                  <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                    <SelectTrigger aria-labelledby="receber-forma-label" aria-required className="w-full border-border bg-secondary">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="__none__">Selecione</SelectItem>
                      {formasAtivas.map((fp) => (
                        <SelectItem key={fp.id} value={fp.tipo}>
                          {fp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {(formaPagamento === "CARTAO_CREDITO" || formaPagamento === "CARTAO_DEBITO") ? (
              <div className="space-y-1.5">
                <label htmlFor="receber-codigo-transacao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Código de autorização *
                </label>
                <Input
                  id="receber-codigo-transacao"
                  {...register("codigoTransacao")}
                  className="border-border bg-secondary"
                  placeholder="Código impresso no cupom da maquininha"
                />
                {errors.codigoTransacao ? (
                  <p className="text-xs text-gym-danger">{errors.codigoTransacao.message}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label htmlFor="receber-observacoes" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input id="receber-observacoes" {...register("observacoes")} className="border-border bg-secondary" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
