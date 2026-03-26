"use client";

import type { Sala } from "@/lib/types";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true },
  { name: "descricao", label: "Descricao", type: "text" },
  { name: "capacidadePadrao", label: "Capacidade padrao", type: "number", min: 1 },
  { name: "ativo", label: "Ativo", type: "checkbox", checkboxLabel: "Sala ativa" },
];

type SalaFormValues = {
  nome: string;
  descricao: string;
  capacidadePadrao: string;
  ativo: boolean;
};

const DEFAULT_VALUES: SalaFormValues = {
  nome: "",
  descricao: "",
  capacidadePadrao: "",
  ativo: true,
};

function toFormValues(initial?: Sala | null): SalaFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    descricao: initial.descricao ?? "",
    capacidadePadrao: initial.capacidadePadrao ? String(initial.capacidadePadrao) : "",
    ativo: initial.ativo,
  };
}

export function SalaModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Sala, "id" | "tenantId">, id?: string) => void;
  initial?: Sala | null;
}) {
  function handleSave(values: SalaFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        descricao: values.descricao.trim() || undefined,
        capacidadePadrao: values.capacidadePadrao
          ? Math.max(1, Number.parseInt(values.capacidadePadrao, 10) || 1)
          : undefined,
        ativo: values.ativo,
      },
      initial?.id
    );
  }

  return (
    <CrudModal<SalaFormValues>
      open={open}
      onClose={onClose}
      onSave={handleSave}
      initial={toFormValues(initial)}
      initialId={initial?.id}
      title="Nova sala"
      editTitle="Editar sala"
      fields={FIELDS}
      contentClassName="border-border bg-card sm:max-w-sm"
    />
  );
}
