"use client";

import { memo, useEffect, useId, useMemo, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateProspectInput, Funcionario, Prospect, OrigemProspect } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prospectSchema, type ProspectFormValues } from "./prospect-schema";

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
  const { register, control, handleSubmit, reset, formState: { isValid } } = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      cpf: "",
      origem: "INSTAGRAM",
      observacoes: "",
      responsavelId: "",
    },
    mode: "onChange",
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
      reset({
        nome: initial.nome,
        telefone: initial.telefone,
        email: initial.email ?? "",
        cpf: initial.cpf ?? "",
        origem: initial.origem,
        observacoes: initial.observacoes ?? "",
        responsavelId: initial.responsavelId ?? "",
      });
    } else {
      reset({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        origem: "INSTAGRAM",
        observacoes: "",
        responsavelId: "",
      });
    }
  }, [initial, open, reset]);

  function onSubmit(values: ProspectFormValues) {
    onSave({
      ...values,
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
        <form onSubmit={handleSubmit(onSubmit)}>
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
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Origem</label>
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
              </div>
              <ProspectSelectField
                label="Responsável"
                control={control}
                name="responsavelId"
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
            <Button type="submit" disabled={!isValid}>
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

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Input id={id} type={type} value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholder} className={className} aria-required={required || undefined} />
      </div>
    );
  }
);
ProspectInputField.displayName = "ProspectInputField";

function ProspectSelectField({
  label,
  control,
  name,
  placeholder,
  withBlankOption = false,
  selectClassName = "bg-secondary border-border",
  children,
}: {
  label: string;
  control: any;
  name: string;
  placeholder: string;
  withBlankOption?: boolean;
  selectClassName?: string;
  children?: ReactNode;
}) {
  const blankValue = "__SEM_SELECAO__";
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label id={`${id}-label`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={withBlankOption && !field.value ? blankValue : field.value}
            onValueChange={(selectedValue) =>
              field.onChange(withBlankOption && selectedValue === blankValue ? "" : selectedValue)
            }
          >
            <SelectTrigger aria-labelledby={`${id}-label`} className={`w-full ${selectClassName}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {withBlankOption && <SelectItem value={blankValue}>Sem responsável</SelectItem>}
              {children}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export { ProspectInputField };
