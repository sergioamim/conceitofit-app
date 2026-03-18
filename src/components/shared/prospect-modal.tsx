"use client";

import { memo, useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type { CreateProspectInput, Funcionario, Prospect, OrigemProspect } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORIGEM_LABELS: Record<OrigemProspect, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

function ProspectModalComponent({
  open,
  onClose,
  onSave,
  funcionarios,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProspectInput) => void;
  funcionarios: Funcionario[];
  initial?: Prospect | null;
}) {
  const [form, setForm] = useState<CreateProspectInput>({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    origem: "INSTAGRAM",
    observacoes: "",
    responsavelId: "",
  });

  const origemOptions = useMemo(
    () =>
      Object.entries(ORIGEM_LABELS).map(([value, label]) => ({
        value: value as OrigemProspect,
        label,
      })),
    []
  );

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        telefone: initial.telefone,
        email: initial.email ?? "",
        cpf: initial.cpf ?? "",
        origem: initial.origem,
        observacoes: initial.observacoes ?? "",
        responsavelId: initial.responsavelId ?? "",
      });
    } else {
      setForm({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        origem: "INSTAGRAM",
        observacoes: "",
        responsavelId: "",
      });
    }
  }, [initial, open]);

  const updateField = useCallback((key: keyof CreateProspectInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const fieldHandlers = useMemo(
    () => ({
      nome: (value: string) => updateField("nome", value),
      telefone: (value: string) => updateField("telefone", value),
      cpf: (value: string) => updateField("cpf", value),
      email: (value: string) => updateField("email", value),
      observacoes: (value: string) => updateField("observacoes", value),
      origem: (value: string) => updateField("origem", value as OrigemProspect),
      responsavelId: (value: string) => updateField("responsavelId", value),
    }),
    [updateField]
  );

  function handleSubmit() {
    if (!form.nome || !form.telefone) return;
    onSave({
      ...form,
      responsavelId: form.responsavelId ? form.responsavelId : undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Prospect" : "Novo Prospect"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <ProspectInputField
              label="Nome *"
              value={form.nome}
              placeholder="Nome completo"
              onValueChange={fieldHandlers.nome}
            />
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone *</label>
              <PhoneInput
                placeholder="(11) 99999-0000"
                value={form.telefone}
                onChange={fieldHandlers.telefone}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
              <MaskedInput
                mask="cpf"
                placeholder="000.000.000-00"
                value={form.cpf ?? ""}
                onChange={fieldHandlers.cpf}
                className="bg-secondary border-border"
              />
            </div>
            <ProspectInputField
              label="E-mail"
              type="email"
              value={form.email ?? ""}
              placeholder="exemplo@email.com"
              onValueChange={fieldHandlers.email}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ProspectSelectField
              label="Origem"
              value={form.origem}
              onValueChange={fieldHandlers.origem}
              options={origemOptions}
              placeholder="Selecione"
              selectClassName="bg-secondary border-border"
            />
            <ProspectSelectField
              label="Responsável"
              value={form.responsavelId ?? ""}
              onValueChange={fieldHandlers.responsavelId}
              placeholder="Sem responsável"
              withBlankOption
              selectClassName="bg-secondary border-border"
            >
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </ProspectSelectField>
          </div>
          <ProspectInputField
            label="Observações"
            value={form.observacoes ?? ""}
            placeholder="Observações do prospect"
            onValueChange={fieldHandlers.observacoes}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.nome || !form.telefone}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ProspectModal = memo(ProspectModalComponent);
ProspectModal.displayName = "ProspectModal";

type SelectOption = {
  value: string;
  label: string;
};

const ProspectInputField = memo(
  ({
    label,
    value,
    placeholder,
    type = "text",
    onValueChange,
    className = "bg-secondary border-border",
  }: {
    label: string;
    value: string;
    placeholder: string;
    type?: string;
    className?: string;
    onValueChange: (value: string) => void;
  }) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(event.target.value);
    };

    return (
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Input type={type} value={value} onChange={handleChange} placeholder={placeholder} className={className} />
      </div>
    );
  }
);
ProspectInputField.displayName = "ProspectInputField";

const ProspectSelectField = memo(
  ({
    label,
    value,
    placeholder,
    onValueChange,
    options = [],
    withBlankOption = false,
    selectClassName = "bg-secondary border-border",
    children,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onValueChange: (value: string) => void;
    options?: SelectOption[];
    withBlankOption?: boolean;
    selectClassName?: string;
    children?: ReactNode;
  }) => {
    const blankValue = "__SEM_SELECAO__";

    return (
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Select
          value={withBlankOption && !value ? blankValue : value}
          onValueChange={(selectedValue) =>
            onValueChange(withBlankOption && selectedValue === blankValue ? "" : selectedValue)
          }
        >
          <SelectTrigger className={`w-full ${selectClassName}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {withBlankOption && <SelectItem value={blankValue}>Sem responsável</SelectItem>}
            {children
              ? children
              : options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);
ProspectSelectField.displayName = "ProspectSelectField";

export { ProspectInputField, ProspectSelectField };
