"use client";

import { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { FieldAsyncFeedback, type FieldAsyncFeedbackStatus } from "@/components/shared/field-async-feedback";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { checkUniqueness, type ClienteWizardForm } from "./wizard-types";
import { DadosComplementares } from "./wizard-step-dados-complementar";

export function Step1Dados({
  form,
  showComplementary,
  onToggleComplementary,
}: {
  form: UseFormReturn<ClienteWizardForm>;
  showComplementary: boolean;
  onToggleComplementary: () => void;
}) {
  const { register, control, formState: { errors } } = form;
  const { tenantId } = useTenantContext();

  const [cpfStatus, setCpfStatus] = useState<FieldAsyncFeedbackStatus>("idle");
  const [cpfMsg, setCpfMsg] = useState("");
  const [emailStatus, setEmailStatus] = useState<FieldAsyncFeedbackStatus>("idle");
  const [emailMsg, setEmailMsg] = useState("");

  const watchedCpf = useWatch({ control, name: "cpf" });
  const watchedEmail = useWatch({ control, name: "email" });
  const canCheckCpf = Boolean(tenantId && watchedCpf && !watchedCpf.includes("_"));
  const canCheckEmail = Boolean(tenantId && watchedEmail && watchedEmail.includes("@"));

  useEffect(() => {
    if (!canCheckCpf || !tenantId || !watchedCpf) {
      if (errors.cpf?.type === "manual") form.clearErrors("cpf");
      return;
    }

    const currentCpf = watchedCpf;
    const handler = setTimeout(async () => {
      setCpfStatus("loading");
      setCpfMsg("Checando disponibilidade...");
      const exists = await checkUniqueness(tenantId, currentCpf);
      if (exists) {
        setCpfStatus("error");
        setCpfMsg("Este CPF já está cadastrado.");
        form.setError("cpf", { type: "manual", message: "CPF já cadastrado" });
      } else {
        setCpfStatus("success");
        setCpfMsg("CPF livre");
        if (errors.cpf?.type === "manual") form.clearErrors("cpf");
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [canCheckCpf, watchedCpf, tenantId, form, errors.cpf?.type]);

  useEffect(() => {
    if (!canCheckEmail || !tenantId || !watchedEmail) {
      if (errors.email?.type === "manual") form.clearErrors("email");
      return;
    }

    const currentEmail = watchedEmail;
    const handler = setTimeout(async () => {
      setEmailStatus("loading");
      setEmailMsg("Checando disponibilidade...");
      const exists = await checkUniqueness(tenantId, currentEmail);
      if (exists) {
        setEmailStatus("error");
        setEmailMsg("E-mail já cadastrado vinculado a outro cliente.");
        form.setError("email", { type: "manual", message: "E-mail em uso" });
      } else {
        setEmailStatus("success");
        setEmailMsg("E-mail disponível");
        if (errors.email?.type === "manual") form.clearErrors("email");
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [canCheckEmail, watchedEmail, tenantId, form, errors.email?.type]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label
            htmlFor="novo-cliente-nome"
            className={cn("text-xs font-semibold uppercase tracking-wide", errors.nome ? "text-destructive" : "text-muted-foreground")}
          >
            Nome completo *
          </label>
          <Input
            id="novo-cliente-nome"
            data-testid="novo-cliente-nome"
            placeholder="João da Silva"
            {...register("nome")}
            className={cn("bg-card", errors.nome ? "border-destructive focus-ring-destructive" : "border-border")}
          />
          <FieldAsyncFeedback status={errors.nome ? "error" : "idle"} message={errors.nome?.message} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="novo-cliente-email"
            className={cn("text-xs font-semibold uppercase tracking-wide", errors.email ? "text-destructive" : "text-muted-foreground")}
          >
            E-mail (opcional)
          </label>
          <Input
            id="novo-cliente-email"
            data-testid="novo-cliente-email"
            type="email"
            placeholder="joao@email.com"
            {...register("email")}
            className={cn("bg-card", errors.email ? "border-destructive focus-ring-destructive" : "border-border")}
          />
          <FieldAsyncFeedback status={errors.email?.message ? "error" : emailStatus} message={errors.email?.message || emailMsg} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="novo-cliente-telefone"
            className={cn("text-xs font-semibold uppercase tracking-wide", errors.telefone ? "text-destructive" : "text-muted-foreground")}
          >
            Telefone *
          </label>
          <Controller name="telefone" control={control} render={({ field }) => (
            <PhoneInput
              id="novo-cliente-telefone"
              data-testid="novo-cliente-telefone"
              placeholder="(11) 99999-0000"
              {...field}
              className={cn("bg-card", errors.telefone ? "border-destructive focus-ring-destructive" : "border-border")}
            />
          )} />
          <FieldAsyncFeedback status={errors.telefone ? "error" : "idle"} message={errors.telefone?.message} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="novo-cliente-telefone-sec" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone secundário</label>
          <Controller name="telefoneSec" control={control} render={({ field }) => (
            <PhoneInput
              id="novo-cliente-telefone-sec"
              data-testid="novo-cliente-telefone-sec"
              placeholder="(11) 90000-0000"
              {...field}
              value={field.value || ""}
              className="bg-card border-border"
            />
          )} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="novo-cliente-cpf"
            className={cn("text-xs font-semibold uppercase tracking-wide", errors.cpf ? "text-destructive" : "text-muted-foreground")}
          >
            CPF *
          </label>
          <Controller name="cpf" control={control} render={({ field }) => (
            <MaskedInput
              id="novo-cliente-cpf"
              data-testid="novo-cliente-cpf"
              mask="cpf"
              placeholder="000.000.000-00"
              {...field}
              className={cn("bg-card", errors.cpf ? "border-destructive focus-ring-destructive" : "border-border")}
            />
          )} />
          <FieldAsyncFeedback status={errors.cpf?.message ? "error" : cpfStatus} message={errors.cpf?.message || cpfMsg} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="novo-cliente-rg" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RG</label>
          <Input id="novo-cliente-rg" data-testid="novo-cliente-rg" placeholder="00.000.000-0" {...register("rg")} className="bg-card border-border" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="novo-cliente-data-nascimento" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data de nascimento (opcional)
          </label>
          <Input id="novo-cliente-data-nascimento" data-testid="novo-cliente-data-nascimento" type="date" {...register("dataNascimento")} className="bg-card border-border" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sexo (opcional)</label>
          <Controller name="sexo" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <button type="button" onClick={onToggleComplementary} className="text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
          {showComplementary ? "Ocultar dados complementares" : "Adicionar dados complementares (opcional)"}
        </button>
      </div>

      {showComplementary && <DadosComplementares form={form} />}
    </div>
  );
}
