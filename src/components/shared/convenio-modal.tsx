"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { Convenio, Plano } from "@/lib/types";
import { convenioFormSchema } from "@/lib/forms/administrativo-schemas";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";
import { cn } from "@/lib/utils";

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true },
  { name: "descontoPercentual", label: "Desconto (%)", type: "number", min: 0, step: "0.01", className: "space-y-1.5" },
  { name: "ativo", label: "Ativo", type: "checkbox", checkboxLabel: "Disponivel para renovacao" },
  { name: "observacoes", label: "Observacoes", type: "text" },
];

type ConvenioFormValues = {
  nome: string;
  descontoPercentual: string;
  ativo: boolean;
  planoIds: string[];
  observacoes: string;
};

const DEFAULT_VALUES: ConvenioFormValues = {
  nome: "",
  descontoPercentual: "0",
  ativo: true,
  planoIds: [],
  observacoes: "",
};

function toFormValues(initial?: Convenio | null): ConvenioFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    descontoPercentual: String(initial.descontoPercentual ?? 0),
    ativo: initial.ativo,
    planoIds: initial.planoIds ?? [],
    observacoes: initial.observacoes ?? "",
  };
}

function PlanoSelector({ planos }: { planos: Plano[] }) {
  const { control, setValue } = useFormContext<ConvenioFormValues>();
  const planoIds = useWatch({ control, name: "planoIds" }) ?? [];

  function togglePlano(id: string) {
    const next = planoIds.includes(id) ? planoIds.filter((item) => item !== id) : [...planoIds, id];
    setValue("planoIds", next, { shouldDirty: true });
  }

  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">Planos elegiveis</p>
      <p className="text-xs text-muted-foreground">Se nenhum for selecionado, o convenio vale para todos</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {planos.map((plano) => (
          <button
            key={plano.id}
            type="button"
            onClick={() => togglePlano(plano.id)}
            className={cn(
              "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
              planoIds.includes(plano.id)
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {plano.nome}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConvenioModal({
  open,
  onClose,
  onSave,
  planos,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Convenio, "id">, id?: string) => void;
  planos: Plano[];
  initial?: Convenio | null;
}) {
  function handleSave(values: ConvenioFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        ativo: values.ativo,
        descontoPercentual: Number.parseFloat(values.descontoPercentual) || 0,
        planoIds: values.planoIds.length ? values.planoIds : undefined,
        observacoes: values.observacoes.trim() || undefined,
      },
      initial?.id
    );
  }

  return (
    <CrudModal<ConvenioFormValues>
      open={open}
      onClose={onClose}
      onSave={handleSave}
      initial={toFormValues(initial)}
      initialId={initial?.id}
      title="Novo convenio"
      editTitle="Editar convenio"
      description="Cadastre o convênio, desconto e escopo de planos elegíveis."
      editDescription="Atualize o convênio, desconto e escopo de planos elegíveis."
      fields={FIELDS}
      schema={convenioFormSchema}
      renderAfterFields={() => <PlanoSelector planos={planos} />}
    />
  );
}
