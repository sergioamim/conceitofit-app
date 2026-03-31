"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { ContaPagar, TipoContaPagar } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIA_LABEL, GRUPO_DRE_LABEL } from "./conta-pagar-types";
import type { ContaPagarFormValues } from "./conta-pagar-schema";

type ContaPagarFormFieldsProps = {
  tiposAtivos: TipoContaPagar[];
  tiposConta: TipoContaPagar[];
  applyTipoConta: (tipoId: string) => void;
};

export function ContaPagarFormFields({
  tiposAtivos,
  applyTipoConta,
}: ContaPagarFormFieldsProps) {
  const { register, control, watch, setValue } = useFormContext<ContaPagarFormValues>();
  const categoria = watch("categoria");
  const grupoDre = watch("grupoDre");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tipo de conta
        </label>
        <Controller
          control={control}
          name="tipoContaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={applyTipoConta}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione o tipo *" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {tiposAtivos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fornecedor
        </label>
        <Input
          {...register("fornecedor")}
          placeholder="Nome do fornecedor *"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documento do fornecedor
        </label>
        <Input
          {...register("documentoFornecedor")}
          placeholder="CPF/CNPJ"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Descrição
        </label>
        <Input
          {...register("descricao")}
          placeholder="Descrição da conta *"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categoria operacional (herdada do tipo)
        </label>
        <Input
          readOnly
          value={CATEGORIA_LABEL[categoria]}
          className="bg-secondary border-border text-muted-foreground"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grupo DRE (somente leitura)
        </label>
        <Input
          readOnly
          value={GRUPO_DRE_LABEL[grupoDre]}
          className="bg-secondary border-border text-muted-foreground"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Centro de custo
        </label>
        <Input
          {...register("centroCusto")}
          placeholder="Opcional"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Regime
        </label>
        <Controller
          control={control}
          name="regime"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="AVULSA">Avulsa</SelectItem>
                <SelectItem value="FIXA">Fixa</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Competência
        </label>
        <Input
          type="date"
          {...register("competencia")}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data de emissão
        </label>
        <Input
          type="date"
          {...register("dataEmissao")}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data de vencimento
        </label>
        <Input
          type="date"
          {...register("dataVencimento")}
          onChange={(e) => {
            register("dataVencimento").onChange(e);
            const dia = e.target.value.split("-")[2] || "";
            const currentDia = watch("recorrenciaDiaDoMes");
            if (!currentDia) setValue("recorrenciaDiaDoMes", dia);
          }}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Valor original
        </label>
        <Input
          type="number"
          min={0}
          step="0.01"
          {...register("valorOriginal")}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Desconto
        </label>
        <Input
          type="number"
          min={0}
          step="0.01"
          {...register("desconto")}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Juros / Multa
        </label>
        <Input
          type="number"
          min={0}
          step="0.01"
          {...register("jurosMulta")}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Observações
        </label>
        <textarea
          {...register("observacoes")}
          className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}
