"use client";

import { memo, useEffect, useId, useMemo, type ChangeEvent, type ReactNode } from "react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateProspectInput, Funcionario, Prospect, OrigemProspect } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";

const ORIGEM_LABELS: Record<OrigemProspect, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

const prospectFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do prospect."),
  telefone: requiredTrimmedString("Informe o telefone."),
  email: z.union([z.literal(""), z.string().email("E-mail inválido.")]).optional(),
  cpf: optionalTrimmedString(),
  origem: requiredTrimmedString("Selecione a origem."),
  observacoes: optionalTrimmedString(),
  responsavelId: optionalTrimmedString(),
});

type ProspectFormValues = z.infer<typeof prospectFormSchema>;

const DEFAULT_VALUES: ProspectFormValues = {
  nome: "",
  telefone: "",
  email: "",
  cpf: "",
  origem: "INSTAGRAM",
  observacoes: "",
  responsavelId: "",
};

function toFormValues(initial?: Prospect | null): ProspectFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    telefone: initial.telefone,
    email: initial.email ?? "",
    cpf: initial.cpf ?? "",
    origem: initial.origem,
    observacoes: initial.observacoes ?? "",
    responsavelId: initial.responsavelId ?? "",
  };
}

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
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(initial),
  });

  const canSave =
    Boolean(watch("nome")?.trim()) &&
    Boolean(watch("telefone")?.trim()) &&
    Boolean(watch("origem")?.trim());

  const origemOptions = useMemo(
    () =>
      Object.entries(ORIGEM_LABELS).map(([value, label]) => ({
        value: value as OrigemProspect,
        label,
      })),
    []
  );

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function onFormSubmit(values: ProspectFormValues) {
    onSave({
      nome: values.nome,
      telefone: values.telefone,
      email: values.email || "",
      cpf: values.cpf || "",
      origem: values.origem as OrigemProspect,
      observacoes: values.observacoes || "",
      responsavelId: values.responsavelId ? values.responsavelId : undefined,
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
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  placeholder="Nome completo"
                  {...register("nome")}
                  className="bg-secondary border-border"
                  aria-required
                />
                {errors.nome ? (
                  <p className="text-xs text-gym-danger">{errors.nome.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone *</label>
                <Controller
                  control={control}
                  name="telefone"
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="(11) 99999-0000"
                      value={field.value}
                      onChange={field.onChange}
                      className="bg-secondary border-border"
                      aria-label="Telefone"
                      aria-required
                    />
                  )}
                />
                {errors.telefone ? (
                  <p className="text-xs text-gym-danger">{errors.telefone.message}</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
                <Controller
                  control={control}
                  name="cpf"
                  render={({ field }) => (
                    <MaskedInput
                      mask="cpf"
                      placeholder="000.000.000-00"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="bg-secondary border-border"
                      aria-label="CPF"
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                <Input
                  type="email"
                  placeholder="exemplo@email.com"
                  {...register("email")}
                  className="bg-secondary border-border"
                />
                {errors.email ? (
                  <p className="text-xs text-gym-danger">{errors.email.message}</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Origem *</label>
                <Controller
                  control={control}
                  name="origem"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {origemOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.origem ? (
                  <p className="text-xs text-gym-danger">{errors.origem.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Responsável</label>
                <Controller
                  control={control}
                  name="responsavelId"
                  render={({ field }) => {
                    const blankValue = "__SEM_SELECAO__";
                    return (
                      <Select
                        value={!field.value ? blankValue : field.value}
                        onValueChange={(selectedValue) =>
                          field.onChange(selectedValue === blankValue ? "" : selectedValue)
                        }
                      >
                        <SelectTrigger className="w-full bg-secondary border-border">
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value={blankValue}>Sem responsável</SelectItem>
                          {funcionarios.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input
                placeholder="Observações do prospect"
                {...register("observacoes")}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
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
    required = false,
  }: {
    label: string;
    value: string;
    placeholder: string;
    type?: string;
    className?: string;
    onValueChange: (value: string) => void;
    required?: boolean;
  }) => {
    const id = useId();
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(event.target.value);
    };

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Input id={id} type={type} value={value} onChange={handleChange} placeholder={placeholder} className={className} aria-required={required || undefined} />
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

    const id = useId();

    return (
      <div className="space-y-1.5">
        <label id={`${id}-label`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Select
          value={withBlankOption && !value ? blankValue : value}
          onValueChange={(selectedValue) =>
            onValueChange(withBlankOption && selectedValue === blankValue ? "" : selectedValue)
          }
        >
          <SelectTrigger aria-labelledby={`${id}-label`} className={`w-full ${selectClassName}`}>
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
