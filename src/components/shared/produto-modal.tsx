"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProdutoFormValues = {
  nome: string;
  sku: string;
  codigoBarras: string;
  categoria: string;
  marca: string;
  unidadeMedida: Produto["unidadeMedida"];
  descricao: string;
  valorVenda: string;
  custo: string;
  comissaoPercentual: string;
  aliquotaImpostoPercentual: string;
  controlaEstoque: boolean;
  estoqueAtual: string;
  estoqueMinimo: string;
  permiteDesconto: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
};

const DEFAULT_VALUES: ProdutoFormValues = {
  nome: "",
  sku: "",
  codigoBarras: "",
  categoria: "",
  marca: "",
  unidadeMedida: "UN",
  descricao: "",
  valorVenda: "",
  custo: "",
  comissaoPercentual: "",
  aliquotaImpostoPercentual: "",
  controlaEstoque: true,
  estoqueAtual: "0",
  estoqueMinimo: "",
  permiteDesconto: true,
  permiteVoucher: false,
  ativo: true,
};

function toFormValues(initial?: Produto | null): ProdutoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    sku: initial.sku,
    codigoBarras: initial.codigoBarras ?? "",
    categoria: initial.categoria ?? "",
    marca: initial.marca ?? "",
    unidadeMedida: initial.unidadeMedida,
    descricao: initial.descricao ?? "",
    valorVenda: String(initial.valorVenda ?? 0),
    custo: initial.custo ? String(initial.custo) : "",
    comissaoPercentual: initial.comissaoPercentual ? String(initial.comissaoPercentual) : "",
    aliquotaImpostoPercentual: initial.aliquotaImpostoPercentual ? String(initial.aliquotaImpostoPercentual) : "",
    controlaEstoque: initial.controlaEstoque,
    estoqueAtual: String(initial.estoqueAtual ?? 0),
    estoqueMinimo: initial.estoqueMinimo ? String(initial.estoqueMinimo) : "",
    permiteDesconto: initial.permiteDesconto,
    permiteVoucher: initial.permiteVoucher,
    ativo: initial.ativo,
  };
}

export function ProdutoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Produto, "id" | "tenantId">, id?: string) => void;
  initial?: Produto | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProdutoFormValues>({
    defaultValues: toFormValues(initial),
  });
  const controlaEstoque = useWatch({ control, name: "controlaEstoque" });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  useEffect(() => {
    if (!controlaEstoque) {
      setValue("estoqueAtual", "0");
      setValue("estoqueMinimo", "");
    }
  }, [controlaEstoque, setValue]);

  function handleSave(values: ProdutoFormValues) {
    const nome = values.nome.trim();
    const sku = values.sku.trim().toUpperCase();
    if (!nome || !sku) return;
    onSave(
      {
        nome,
        sku,
        codigoBarras: values.codigoBarras.trim() || undefined,
        categoria: values.categoria.trim() || undefined,
        marca: values.marca.trim() || undefined,
        unidadeMedida: values.unidadeMedida,
        descricao: values.descricao.trim() || undefined,
        valorVenda: values.valorVenda ? Math.max(0, Number.parseFloat(values.valorVenda)) : 0,
        custo: values.custo ? Math.max(0, Number.parseFloat(values.custo)) : undefined,
        comissaoPercentual: values.comissaoPercentual ? Math.max(0, Number.parseFloat(values.comissaoPercentual)) : undefined,
        aliquotaImpostoPercentual: values.aliquotaImpostoPercentual
          ? Math.max(0, Number.parseFloat(values.aliquotaImpostoPercentual))
          : undefined,
        controlaEstoque: values.controlaEstoque,
        estoqueAtual: values.controlaEstoque ? Math.max(0, Number.parseFloat(values.estoqueAtual) || 0) : 0,
        estoqueMinimo:
          values.controlaEstoque && values.estoqueMinimo ? Math.max(0, Number.parseFloat(values.estoqueMinimo)) : undefined,
        permiteDesconto: values.permiteDesconto,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome do produto." })}
                  className="border-border bg-secondary"
                />
                {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU *</label>
                <Input
                  {...register("sku", { validate: (value) => value.trim().length > 0 || "Informe o SKU do produto." })}
                  className="border-border bg-secondary"
                />
                {errors.sku ? <p className="text-xs text-gym-danger">{errors.sku.message}</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código de barras</label>
                <Input {...register("codigoBarras")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</label>
                <Input {...register("categoria")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Marca</label>
                <Input {...register("marca")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
                <Controller
                  control={control}
                  name="unidadeMedida"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as Produto["unidadeMedida"])}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="UN">UN</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ML">ML</SelectItem>
                        <SelectItem value="CX">CX</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input {...register("descricao")} className="border-border bg-secondary" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preço venda (R$)</label>
                <Input type="number" min={0} step="0.01" {...register("valorVenda")} className="border-border bg-secondary" />
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
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("controlaEstoque")} />
                Controla estoque
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("permiteDesconto")} />
                Permite desconto
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("permiteVoucher")} />
                Permite voucher
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estoque atual</label>
                <Input type="number" min={0} step="0.001" {...register("estoqueAtual")} className="border-border bg-secondary" disabled={!controlaEstoque} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estoque mínimo</label>
                <Input type="number" min={0} step="0.001" {...register("estoqueMinimo")} className="border-border bg-secondary" disabled={!controlaEstoque} />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("ativo")} />
                Produto ativo
              </label>
            </div>
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
