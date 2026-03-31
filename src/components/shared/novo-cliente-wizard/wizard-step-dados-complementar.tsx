"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { fetchCep } from "@/lib/shared/cep-lookup";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClienteWizardForm } from "./wizard-types";

export function DadosComplementares({
  form,
}: {
  form: UseFormReturn<ClienteWizardForm>;
}) {
  const { register, control, setValue } = form;

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const watchedCep = useWatch({ control, name: "enderecoCep" });
  const watchedFoto = useWatch({ control, name: "foto" });

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
  );
}
