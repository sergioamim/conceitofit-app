"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

type FormaPagamentoFormValues = {
  nome: string;
  tipo: TipoFormaPagamento;
  taxaPercentual: string;
  parcelasMax: string;
  emitirAutomaticamente: boolean;
  instrucoes: string;
  ativo: boolean;
};

const DEFAULT_VALUES: FormaPagamentoFormValues = {
  nome: "",
  tipo: "PIX",
  taxaPercentual: "0",
  parcelasMax: "1",
  emitirAutomaticamente: false,
  instrucoes: "",
  ativo: true,
};

function toFormValues(initial?: FormaPagamento | null): FormaPagamentoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    tipo: initial.tipo,
    taxaPercentual: String(initial.taxaPercentual ?? 0),
    parcelasMax: String(initial.parcelasMax ?? 1),
    emitirAutomaticamente: Boolean(initial.emitirAutomaticamente),
    instrucoes: initial.instrucoes ?? "",
    ativo: initial.ativo,
  };
}

export function FormaPagamentoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<FormaPagamento, "id" | "tenantId">, id?: string) => void;
  initial?: FormaPagamento | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormaPagamentoFormValues>({
    defaultValues: toFormValues(initial),
  });
  const tipo = useWatch({ control, name: "tipo" });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function handleSave(values: FormaPagamentoFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        tipo: values.tipo,
        taxaPercentual: Number.parseFloat(values.taxaPercentual) || 0,
        parcelasMax: Number.parseInt(values.parcelasMax, 10) || 1,
        emitirAutomaticamente: values.emitirAutomaticamente,
        instrucoes: values.instrucoes.trim() || undefined,
        ativo: values.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar forma de pagamento" : "Nova forma de pagamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome da forma de pagamento." })}
                className="border-border bg-secondary"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</label>
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as TipoFormaPagamento)}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {Object.entries(TIPO_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Taxa (%)</label>
                <Input type="number" min={0} step="0.01" {...register("taxaPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas máximas</label>
                <Input type="number" min={1} step="1" {...register("parcelasMax")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("ativo")} />
                  <span className="text-muted-foreground">Disponível</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emissão de NFSe</label>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("emitirAutomaticamente")} />
                  <span className="text-muted-foreground">
                    Emitir NFSe automaticamente ao receber pagamento
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ao marcar, toda baixa desse tipo de pagamento dispara emissão automática de NFSe.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Instruções</label>
              <Input {...register("instrucoes")} className="border-border bg-secondary" />
            </div>
            {tipo === "RECORRENTE" ? (
              <p className="text-xs text-muted-foreground">
                Formas recorrentes devem manter as parcelas e instruções alinhadas à cobrança automática.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
