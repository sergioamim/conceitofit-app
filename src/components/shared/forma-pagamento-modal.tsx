"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";

const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartao de Credito" },
  { value: "CARTAO_DEBITO", label: "Cartao de Debito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "RECORRENTE", label: "Recorrente" },
];

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true },
  { name: "tipo", label: "Tipo *", type: "select", options: TIPO_OPTIONS, className: "space-y-1.5" },
  { name: "taxaPercentual", label: "Taxa (%)", type: "number", min: 0, step: "0.01", className: "space-y-1.5" },
  { name: "parcelasMax", label: "Parcelas maximas", type: "number", min: 1, step: "1", className: "space-y-1.5" },
  { name: "ativo", label: "Ativo", type: "checkbox", checkboxLabel: "Disponivel" },
  {
    name: "emitirAutomaticamente",
    label: "Emissao de NFSe",
    type: "checkbox",
    checkboxLabel: "Emitir NFSe automaticamente ao receber pagamento",
    helperText: "Ao marcar, toda baixa desse tipo de pagamento dispara emissao automatica de NFSe.",
  },
  { name: "instrucoes", label: "Instrucoes", type: "text" },
];

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

function RecorrenteNote() {
  const { control } = useFormContext<FormaPagamentoFormValues>();
  const tipo = useWatch({ control, name: "tipo" });

  if (tipo !== "RECORRENTE") return null;

  return (
    <p className="text-xs text-muted-foreground">
      Formas recorrentes devem manter as parcelas e instrucoes alinhadas a cobranca automatica.
    </p>
  );
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
    <CrudModal<FormaPagamentoFormValues>
      open={open}
      onClose={onClose}
      onSave={handleSave}
      initial={toFormValues(initial)}
      initialId={initial?.id}
      title="Nova forma de pagamento"
      editTitle="Editar forma de pagamento"
      fields={FIELDS}
      renderAfterFields={() => <RecorrenteNote />}
    />
  );
}
