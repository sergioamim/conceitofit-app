"use client";

import type { BandeiraCartao } from "@/lib/types";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true },
  { name: "taxaPercentual", label: "Taxa (%)", type: "number", min: 0, step: "0.01", className: "space-y-1.5" },
  { name: "diasRepasse", label: "Dias para repasse", type: "number", min: 0, step: "1", className: "space-y-1.5" },
  { name: "ativo", label: "Ativo", type: "checkbox", checkboxLabel: "Disponivel" },
];

type BandeiraCartaoFormValues = {
  nome: string;
  taxaPercentual: string;
  diasRepasse: string;
  ativo: boolean;
};

const DEFAULT_VALUES: BandeiraCartaoFormValues = {
  nome: "",
  taxaPercentual: "0",
  diasRepasse: "30",
  ativo: true,
};

function toFormValues(initial?: BandeiraCartao | null): BandeiraCartaoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    taxaPercentual: String(initial.taxaPercentual ?? 0),
    diasRepasse: String(initial.diasRepasse ?? 30),
    ativo: initial.ativo,
  };
}

export function BandeiraCartaoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<BandeiraCartao, "id">, id?: string) => void;
  initial?: BandeiraCartao | null;
}) {
  function handleSave(values: BandeiraCartaoFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        taxaPercentual: Number.parseFloat(values.taxaPercentual) || 0,
        diasRepasse: Number.parseInt(values.diasRepasse, 10) || 0,
        ativo: values.ativo,
      },
      initial?.id
    );
  }

  return (
    <CrudModal<BandeiraCartaoFormValues>
      open={open}
      onClose={onClose}
      onSave={handleSave}
      initial={toFormValues(initial)}
      initialId={initial?.id}
      title="Nova bandeira"
      editTitle="Editar bandeira"
      fields={FIELDS}
      fieldsClassName="grid gap-4 py-2"
    />
  );
}
