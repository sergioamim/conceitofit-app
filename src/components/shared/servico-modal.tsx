"use client";

import { useEffect } from "react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverPopover } from "@/components/shared/hover-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

const servicoFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do serviço."),
  sku: z.string(),
  categoria: z.string(),
  descricao: z.string(),
  sessoes: z.string(),
  valor: z.string(),
  custo: z.string(),
  duracaoMinutos: z.string(),
  validadeDias: z.string(),
  comissaoPercentual: z.string(),
  aliquotaImpostoPercentual: z.string(),
  permiteDesconto: z.boolean(),
  tipoCobranca: z.enum(["UNICO", "RECORRENTE"]),
  recorrenciaDias: z.string(),
  agendavel: z.boolean(),
  permiteAcessoCatraca: z.boolean(),
  permiteVoucher: z.boolean(),
  ativo: z.boolean(),
});

type ServicoFormValues = z.infer<typeof servicoFormSchema>;

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
    watch,
    formState: { errors },
  } = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(initial),
  });

  const canSave = Boolean(watch("nome")?.trim());
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure dados comerciais, cobrança e disponibilidade operacional do serviço.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label
                htmlFor="servico-nome"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nome *
              </label>
              <Input
                id="servico-nome"
                autoFocus
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome do serviço." })}
                aria-invalid={errors.nome ? "true" : "false"}
                aria-describedby={errors.nome ? "servico-nome-error" : undefined}
                className="border-border bg-secondary"
              />
              {errors.nome ? (
                <p id="servico-nome-error" className="text-xs text-gym-danger">
                  {errors.nome.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="servico-sku" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU / Código interno</label>
                <Input id="servico-sku" {...register("sku")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-categoria" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</label>
                <Input id="servico-categoria" {...register("categoria")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="servico-descricao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input id="servico-descricao" {...register("descricao")} className="border-border bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="servico-sessoes" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sessões</label>
                <Input id="servico-sessoes" type="number" min={1} step="1" {...register("sessoes")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-ativo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
                <div className="flex items-center gap-2 text-sm">
                  <input id="servico-ativo" type="checkbox" {...register("ativo")} />
                  <label htmlFor="servico-ativo" className="cursor-pointer text-muted-foreground">Disponível</label>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-duracao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração por sessão (min)</label>
                <Input id="servico-duracao" type="number" min={1} {...register("duracaoMinutos")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="servico-tipo-cobranca" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de cobrança</label>
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
                      <SelectTrigger id="servico-tipo-cobranca" className="w-full border-border bg-secondary">
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
                <label htmlFor="servico-recorrencia" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recorrência (dias)</label>
                <Input id="servico-recorrencia" type="number" min={1} {...register("recorrenciaDias")} className="border-border bg-secondary" disabled={tipoCobranca !== "RECORRENTE"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="servico-valor" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$)</label>
                <Input id="servico-valor" type="number" min={0} step="0.01" {...register("valor")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-custo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custo (R$)</label>
                <Input id="servico-custo" type="number" min={0} step="0.01" {...register("custo")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-comissao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comissão (%)</label>
                <Input id="servico-comissao" type="number" min={0} step="0.01" {...register("comissaoPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-imposto" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Imposto (%)</label>
                <Input id="servico-imposto" type="number" min={0} step="0.01" {...register("aliquotaImpostoPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="servico-validade" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Validade (dias)
                  <HoverPopover content="Use para serviços com expiração após a venda ou consumo."><span className="cursor-help text-muted-foreground">ⓘ</span></HoverPopover>
                </label>
                <Input id="servico-validade" type="number" min={1} {...register("validadeDias")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="servico-permite-desconto" className="flex items-center gap-2 text-sm text-muted-foreground">
                <input id="servico-permite-desconto" type="checkbox" {...register("permiteDesconto")} />
                Permite desconto
              </label>
              <label htmlFor="servico-agendavel" className="flex items-center gap-2 text-sm text-muted-foreground">
                <input id="servico-agendavel" type="checkbox" {...register("agendavel")} />
                Serviço agendável
              </label>
              <label htmlFor="servico-catraca" className="flex items-center gap-2 text-sm text-muted-foreground">
                <input id="servico-catraca" type="checkbox" {...register("permiteAcessoCatraca")} />
                Libera acesso na catraca
              </label>
              <label htmlFor="servico-voucher" className="flex items-center gap-2 text-sm text-muted-foreground">
                <input id="servico-voucher" type="checkbox" {...register("permiteVoucher")} />
                Aceita voucher
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
