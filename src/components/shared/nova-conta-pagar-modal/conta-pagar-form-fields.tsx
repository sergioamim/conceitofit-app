"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ContaPagar, TipoContaPagar } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NovaContaFormState } from "./conta-pagar-types";
import { CATEGORIA_LABEL, GRUPO_DRE_LABEL } from "./conta-pagar-types";

type ContaPagarFormFieldsProps = {
  form: NovaContaFormState;
  setForm: Dispatch<SetStateAction<NovaContaFormState>>;
  tiposAtivos: TipoContaPagar[];
  tiposConta: TipoContaPagar[];
  applyTipoConta: (tipoId: string) => void;
};

export function ContaPagarFormFields({
  form,
  setForm,
  tiposAtivos,
  applyTipoConta,
}: ContaPagarFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tipo de conta
        </label>
        <Select value={form.tipoContaId} onValueChange={applyTipoConta}>
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
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fornecedor
        </label>
        <Input
          value={form.fornecedor}
          onChange={(e) => setForm((v) => ({ ...v, fornecedor: e.target.value }))}
          placeholder="Nome do fornecedor *"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documento do fornecedor
        </label>
        <Input
          value={form.documentoFornecedor}
          onChange={(e) => setForm((v) => ({ ...v, documentoFornecedor: e.target.value }))}
          placeholder="CPF/CNPJ"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Descrição
        </label>
        <Input
          value={form.descricao}
          onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))}
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
          value={CATEGORIA_LABEL[form.categoria]}
          className="bg-secondary border-border text-muted-foreground"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grupo DRE (somente leitura)
        </label>
        <Input
          readOnly
          value={GRUPO_DRE_LABEL[form.grupoDre]}
          className="bg-secondary border-border text-muted-foreground"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Centro de custo
        </label>
        <Input
          value={form.centroCusto}
          onChange={(e) => setForm((v) => ({ ...v, centroCusto: e.target.value }))}
          placeholder="Opcional"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Regime
        </label>
        <Select
          value={form.regime}
          onValueChange={(value) =>
            setForm((f) => ({ ...f, regime: value as ContaPagar["regime"] }))
          }
        >
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="AVULSA">Avulsa</SelectItem>
            <SelectItem value="FIXA">Fixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Competência
        </label>
        <Input
          type="date"
          value={form.competencia}
          onChange={(e) => setForm((v) => ({ ...v, competencia: e.target.value }))}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data de emissão
        </label>
        <Input
          type="date"
          value={form.dataEmissao}
          onChange={(e) => setForm((v) => ({ ...v, dataEmissao: e.target.value }))}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data de vencimento
        </label>
        <Input
          type="date"
          value={form.dataVencimento}
          onChange={(e) =>
            setForm((v) => ({
              ...v,
              dataVencimento: e.target.value,
              recorrenciaDiaDoMes: v.recorrenciaDiaDoMes || e.target.value.split("-")[2] || "",
            }))
          }
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
          value={form.valorOriginal}
          onChange={(e) => setForm((v) => ({ ...v, valorOriginal: e.target.value }))}
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
          value={form.desconto}
          onChange={(e) => setForm((v) => ({ ...v, desconto: e.target.value }))}
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
          value={form.jurosMulta}
          onChange={(e) => setForm((v) => ({ ...v, jurosMulta: e.target.value }))}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Observações
        </label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm((v) => ({ ...v, observacoes: e.target.value }))}
          className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}
