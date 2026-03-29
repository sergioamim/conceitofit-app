"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import React from "react";
import { Controller, useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { fetchCep } from "@/lib/shared/cep-lookup";
import { FieldAsyncFeedback, type FieldAsyncFeedbackStatus } from "@/components/shared/field-async-feedback";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { checkUniqueness, type ClienteWizardForm } from "./wizard-types";

export function Step1Dados({
  form,
  showComplementary,
  onToggleComplementary,
}: {
  form: UseFormReturn<ClienteWizardForm>;
  showComplementary: boolean;
  onToggleComplementary: () => void;
}) {
  const { register, control, formState: { errors }, setValue } = form;
  const { tenantId } = useTenantContext();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [cpfStatus, setCpfStatus] = useState<FieldAsyncFeedbackStatus>("idle");
  const [cpfMsg, setCpfMsg] = useState("");
  const [emailStatus, setEmailStatus] = useState<FieldAsyncFeedbackStatus>("idle");
  const [emailMsg, setEmailMsg] = useState("");

  const watchedCpf = useWatch({ control, name: "cpf" });
  const watchedEmail = useWatch({ control, name: "email" });
  const watchedCep = useWatch({ control, name: "enderecoCep" });
  const watchedFoto = useWatch({ control, name: "foto" });
  const canCheckCpf = Boolean(tenantId && watchedCpf && !watchedCpf.includes("_"));
  const canCheckEmail = Boolean(tenantId && watchedEmail && watchedEmail.includes("@"));

  useEffect(() => {
    if (!watchedCep) return;
    fetchCep(watchedCep).then((res) => {
      if (!res) return;
      if (res.logradouro) setValue("enderecoLogradouro", res.logradouro);
      if (res.bairro) setValue("enderecoBairro", res.bairro);
      if (res.localidade) setValue("enderecoCidade", res.localidade);
      if (res.uf) setValue("enderecoEstado", res.uf);
    });
  }, [watchedCep, setValue]);

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

  useEffect(() => {
    if (!cameraOpen) return;
    async function start() {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError("Não foi possível acessar a câmera.");
      }
    }
    start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setValue("foto", dataUrl);
    setCameraOpen(false);
  }

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
          <Input
            id="novo-cliente-rg"
            data-testid="novo-cliente-rg"
            placeholder="00.000.000-0"
            {...register("rg")}
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="novo-cliente-data-nascimento" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data de nascimento (opcional)
          </label>
          <Input
            id="novo-cliente-data-nascimento"
            data-testid="novo-cliente-data-nascimento"
            type="date"
            {...register("dataNascimento")}
            className="bg-card border-border"
          />
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

      {showComplementary && (
        <>
          <div className="space-y-3 pt-1">
            <p className="text-sm font-semibold text-muted-foreground">Endereço (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CEP</label>
                <Controller name="enderecoCep" control={control} render={({ field }) => (
                  <MaskedInput mask="cep" placeholder="00000-000" {...field} value={field.value || ""} className="bg-card border-border" />
                )} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logradouro</label>
                <Input placeholder="Rua, Avenida..." {...register("enderecoLogradouro")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Número</label>
                <Input placeholder="123" {...register("enderecoNumero")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Complemento</label>
                <Input placeholder="Apto, bloco..." {...register("enderecoComplemento")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bairro</label>
                <Input placeholder="Centro" {...register("enderecoBairro")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cidade</label>
                <Input placeholder="São Paulo" {...register("enderecoCidade")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</label>
                <Input placeholder="SP" {...register("enderecoEstado")} className="bg-card border-border" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-sm font-semibold text-muted-foreground">Contato de emergência (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</label>
                <Input placeholder="Nome do contato" {...register("emergenciaNome")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone</label>
                <Controller name="emergenciaTelefone" control={control} render={({ field }) => (
                  <PhoneInput placeholder="(11) 90000-0000" {...field} value={field.value || ""} className="bg-card border-border" />
                )} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parentesco</label>
                <Input placeholder="Ex: irmão" {...register("emergenciaParentesco")} className="bg-card border-border" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-sm font-semibold text-muted-foreground">Saúde e foto (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações médicas</label>
                <Input placeholder="Alergias, restrições..." {...register("observacoesMedicas")} className="bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto</label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="border-border" onClick={() => setCameraOpen(true)}>Capturar foto</Button>
                  {watchedFoto && <Button type="button" variant="outline" className="border-border" onClick={() => setValue("foto", "")}>Remover</Button>}
                </div>
                {cameraOpen && (
                  <div className="mt-2 rounded-md border border-border bg-secondary/40 p-2">
                    {cameraError ? (
                      <p className="text-xs text-gym-danger">{cameraError}</p>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
                        <div className="mt-2 flex justify-end gap-2">
                          <Button type="button" variant="outline" className="border-border" onClick={() => setCameraOpen(false)}>Cancelar</Button>
                          <Button type="button" onClick={capturePhoto}>Capturar</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {watchedFoto && (
                  <Image src={watchedFoto} alt="Foto do cliente" width={64} height={64} unoptimized className="mt-2 rounded-md object-cover" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
