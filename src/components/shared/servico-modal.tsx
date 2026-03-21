"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverPopover } from "@/components/shared/hover-popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ServicoFormValues = {
  nome: string;
  sku: string;
  categoria: string;
  descricao: string;
  sessoes: string;
  valor: string;
  custo: string;
  duracaoMinutos: string;
  validadeDias: string;
  comissaoPercentual: string;
  aliquotaImpostoPercentual: string;
  permiteDesconto: boolean;
  tipoCobranca: "UNICO" | "RECORRENTE";
  recorrenciaDias: string;
  agendavel: boolean;
  permiteAcessoCatraca: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
};

const DEFAULT_VALUES: ServicoFormValues = {
  nome: "",
  sku: "",
  categoria: "",
  descricao: "",
  sessoes: "",
  valor: "",
  custo: "",
  duracaoMinutos: "",
  validadeDias: "",
  comissaoPercentual: "",
  aliquotaImpostoPercentual: "",
  permiteDesconto: true,
  tipoCobranca: "UNICO",
  recorrenciaDias: "",
  agendavel: true,
  permiteAcessoCatraca: false,
  permiteVoucher: false,
  ativo: true,
};

function toFormValues(initial?: Servico | null): ServicoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    sku: initial.sku ?? "",
    categoria: initial.categoria ?? "",
    descricao: initial.descricao ?? "",
    sessoes: initial.sessoes ? String(initial.sessoes) : "",
    valor: initial.valor ? String(initial.valor) : "",
    custo: initial.custo ? String(initial.custo) : "",
    duracaoMinutos: initial.duracaoMinutos ? String(initial.duracaoMinutos) : "",
    validadeDias: initial.validadeDias ? String(initial.validadeDias) : "",
    comissaoPercentual: initial.comissaoPercentual ? String(initial.comissaoPercentual) : "",
    aliquotaImpostoPercentual: initial.aliquotaImpostoPercentual ? String(initial.aliquotaImpostoPercentual) : "",
    permiteDesconto: initial.permiteDesconto,
    tipoCobranca: initial.tipoCobranca,
    recorrenciaDias: initial.recorrenciaDias ? String(initial.recorrenciaDias) : "",
    agendavel: initial.agendavel,
    permiteAcessoCatraca: initial.permiteAcessoCatraca,
    permiteVoucher: initial.permiteVoucher,
    ativo: initial.ativo,
  };
}

export function ServicoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Servico, "id" | "tenantId">, id?: string) => void;
  initial?: Servico | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServicoFormValues>({
    defaultValues: toFormValues(initial),
  });
  const tipoCobranca = useWatch({ control, name: "tipoCobranca" });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function handleSave(values: ServicoFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        sku: values.sku.trim().toUpperCase() || undefined,
        categoria: values.categoria.trim() || undefined,
        descricao: values.descricao.trim() || undefined,
        sessoes: values.sessoes ? Math.max(1, Number.parseInt(values.sessoes, 10)) : undefined,
        valor: values.valor ? Math.max(0, Number.parseFloat(values.valor)) : 0,
        custo: values.custo ? Math.max(0, Number.parseFloat(values.custo)) : undefined,
        duracaoMinutos: values.duracaoMinutos ? Math.max(1, Number.parseInt(values.duracaoMinutos, 10)) : undefined,
        validadeDias: values.validadeDias ? Math.max(1, Number.parseInt(values.validadeDias, 10)) : undefined,
        comissaoPercentual: values.comissaoPercentual ? Math.max(0, Number.parseFloat(values.comissaoPercentual)) : undefined,
        aliquotaImpostoPercentual: values.aliquotaImpostoPercentual
          ? Math.max(0, Number.parseFloat(values.aliquotaImpostoPercentual))
          : undefined,
        permiteDesconto: values.permiteDesconto,
        tipoCobranca: values.tipoCobranca,
        recorrenciaDias:
          values.tipoCobranca === "RECORRENTE" && values.recorrenciaDias
            ? Math.max(1, Number.parseInt(values.recorrenciaDias, 10))
            : undefined,
        agendavel: values.agendavel,
        permiteAcessoCatraca: values.permiteAcessoCatraca,
        permiteVoucher: values.permiteVoucher,
        ativo: values.ativo,
      },
      initial?.id
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="servico-modal-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="servico-modal-title" className="font-display text-lg font-bold">
            {initial ? "Editar serviço" : "Novo serviço"}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome do serviço." })}
                className="border-border bg-secondary"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU / Código interno</label>
                <Input {...register("sku")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</label>
                <Input {...register("categoria")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input {...register("descricao")} className="border-border bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sessões</label>
                <Input type="number" min={1} step="1" {...register("sessoes")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("ativo")} />
                  <span className="text-muted-foreground">Disponível</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração por sessão (min)</label>
                <Input type="number" min={1} {...register("duracaoMinutos")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de cobrança</label>
                <Controller
                  control={control}
                  name="tipoCobranca"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const nextValue = value as "UNICO" | "RECORRENTE";
                        field.onChange(nextValue);
                        if (nextValue !== "RECORRENTE") {
                          setValue("recorrenciaDias", "", { shouldDirty: true });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="UNICO">Único</SelectItem>
                        <SelectItem value="RECORRENTE">Recorrente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recorrência (dias)</label>
                <Input type="number" min={1} {...register("recorrenciaDias")} className="border-border bg-secondary" disabled={tipoCobranca !== "RECORRENTE"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$)</label>
                <Input type="number" min={0} step="0.01" {...register("valor")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custo (R$)</label>
                <Input type="number" min={0} step="0.01" {...register("custo")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comissão (%)</label>
                <Input type="number" min={0} step="0.01" {...register("comissaoPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Imposto (%)</label>
                <Input type="number" min={0} step="0.01" {...register("aliquotaImpostoPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Validade (dias)
                  <HoverPopover content="Use para serviços com expiração após a venda ou consumo." />
                </label>
                <Input type="number" min={1} {...register("validadeDias")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("permiteDesconto")} />
                Permite desconto
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("agendavel")} />
                Serviço agendável
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("permiteAcessoCatraca")} />
                Libera acesso na catraca
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("permiteVoucher")} />
                Aceita voucher
              </label>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar" : "Criar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
