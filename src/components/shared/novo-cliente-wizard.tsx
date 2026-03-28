"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import React from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { fetchCep } from "@/lib/shared/cep-lookup";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldAsyncFeedback, type FieldAsyncFeedbackStatus } from "@/components/shared/field-async-feedback";

import { getBusinessTodayIso } from "@/lib/business-date";
import {
  checkAlunoDuplicidadeService,
  createAlunoComMatriculaService,
  createAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno, FormaPagamento, Plano, Sexo, TipoFormaPagamento } from "@/lib/types";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFormDraft } from "@/hooks/use-form-draft";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import { formatBRL } from "@/lib/formatters";

const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

// ─── Step indicator ────────────────────────────────────────────────────────

const STEP_LABELS = ["Dados", "Plano", "Pagamento"];

type CriarAlunoComMatriculaResponse = Awaited<ReturnType<typeof createAlunoComMatriculaService>>;

function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
        done ? "bg-gym-teal text-background shadow-sm" : active ? "bg-gym-accent text-background shadow-sm" : "bg-muted text-muted-foreground"
      )}>
        {done ? <Check className="size-4" /> : step}
      </div>
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wide",
        active ? "text-foreground" : "text-muted-foreground"
      )}>
        {STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}

// ─── ZOD SCHEMA PARA O WIZARD ──────────────────────────────────────────────

const clienteWizardSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido").or(z.literal("")),
  telefone: z.string().min(10, "Informe um telefone válido com DDD"),
  telefoneSec: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido").regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato CPF inválido"),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  enderecoCep: z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero: z.string().optional(),
  enderecoComplemento: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoEstado: z.string().optional(),
  emergenciaNome: z.string().optional(),
  emergenciaTelefone: z.string().optional(),
  emergenciaParentesco: z.string().optional(),
  observacoesMedicas: z.string().optional(),
  foto: z.string().optional(),

  selectedPlano: z.string().optional(),

  pagamento: z.object({
    dataInicio: z.string().optional(),
    formaPagamento: z.string().optional(),
    desconto: z.string().optional(),
  }),
});

type ClienteWizardForm = z.infer<typeof clienteWizardSchema>;

async function checkUniqueness(tenantId: string, search: string) {
  if (!search) return false;
  try {
    const result = await checkAlunoDuplicidadeService({ tenantId, search });
    return result.exists;
  } catch {
    return false;
  }
}

function Step1Dados({
  form,
  showComplementary,
  onToggleComplementary,
}: {
  form: ReturnType<typeof useForm<ClienteWizardForm>>;
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

function Step2Plano({ 
  planos, 
  form,
  onSelectPlano
}: { 
  planos: Plano[]; 
  form: ReturnType<typeof useForm<ClienteWizardForm>>;
  onSelectPlano: (plano: Plano) => void;
}) {
  const { control, setValue } = form;
  const selected = useWatch({ control, name: "selectedPlano" });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Escolha o plano administrativo</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos.map((p) => (
          <button key={p.id} type="button" onClick={() => {
            setValue("selectedPlano", p.id);
            onSelectPlano(p);
          }}
            className={cn("relative rounded-xl border p-4 text-left transition-all",
              selected === p.id ? "border-gym-accent bg-gym-accent/5 shadow-sm" : "border-border bg-secondary/40 hover:border-border/80"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-gym-accent px-2 py-0.5 text-[10px] font-bold uppercase text-background">Popular</span>
            )}
            <div className="font-display font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{TIPO_PLANO_LABEL[p.tipo]} · {p.duracaoDias} dias</div>
            <div className="mt-2 font-display text-xl font-extrabold text-gym-accent">{formatBRL(p.valor)}</div>
            {p.valorMatricula > 0 && <div className="text-xs text-muted-foreground">+ {formatBRL(p.valorMatricula)} matrícula</div>}
            {p.beneficios?.slice(0, 2).map((b) => (
              <div key={b} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3 text-gym-teal" />{b}
              </div>
            ))}
            {selected === p.id && <CheckCircle2 className="absolute right-3 top-3 size-4 text-gym-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Pagamento({ 
  fps, form, commercial
}: {
  fps: FormaPagamento[];
  form: ReturnType<typeof useForm<ClienteWizardForm>>;
  commercial: ReturnType<typeof useCommercialFlow>;
}) {
  const { register, control } = form;
  const { dryRun, selectedPlano } = commercial;

  return (
    <div className="space-y-5">
      {selectedPlano && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="text-muted-foreground">Plano: <span className="font-semibold text-foreground">{selectedPlano.nome}</span></p>
          <p className="text-muted-foreground">Valor: <span className="font-bold text-gym-accent">{formatBRL(selectedPlano.valor)}</span></p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data de início *
          </label>
          <Input 
            type="date" 
            {...register("pagamento.dataInicio")} 
            onChange={(e) => {
              register("pagamento.dataInicio").onChange(e);
              commercial.setDataInicioPlano(e.target.value);
            }}
            className="bg-card border-border" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento *</label>
          <Controller name="pagamento.formaPagamento" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {fps.map((fp) => (
                  <SelectItem 
                    key={fp.id} 
                    value={fp.tipo}
                    disabled={fp.tipo === "RECORRENTE" && !!selectedPlano && !selectedPlano.permiteCobrancaRecorrente}
                  >
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desconto (R$)</label>
          <Input 
            type="number" 
            min={0} 
            placeholder="0,00" 
            {...register("pagamento.desconto")} 
            onChange={(e) => {
              register("pagamento.desconto").onChange(e);
              commercial.setManualDiscount(parseFloat(e.target.value) || 0);
            }}
            className="bg-card border-border" 
          />
        </div>
      </div>
      {dryRun && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(dryRun.subtotal)}</span></div>
          {dryRun.descontoTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Descontos</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoTotal)}</span></div>}
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Total final</span>
            <span className="font-display text-base font-bold text-gym-accent">{formatBRL(dryRun.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepSucesso({ result, plano, onClose }: { result: CriarAlunoComMatriculaResponse; plano?: Plano; onClose: () => void }) {
  return (
    <div className="space-y-5 text-center py-2">
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-gym-teal/15">
          <CheckCircle2 className="size-7 text-gym-teal" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Cadastro realizado!</h3>
        <p className="mt-1 text-sm text-muted-foreground">{result.aluno.nome} está ativo com {plano?.nome}.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-left text-sm">
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
          <p className="mt-1 font-semibold truncate" title={result.aluno.nome}>{result.aluno.nome}</p>
          <p className="text-xs text-muted-foreground">{result.aluno.cpf}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Matrícula</p>
          <p className="mt-1 font-semibold truncate" title={plano?.nome}>{plano?.nome}</p>
          {result.matricula && (
            <p className="text-xs text-muted-foreground">Inicia {formatDate(result.matricula.dataInicio)}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamento</p>
          <p className="mt-1 font-display font-bold text-gym-accent">{formatBRL(result.pagamento?.valorFinal || 0)}</p>
          <p className="text-xs text-gym-warning">Pendente</p>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">Fechar</Button>
    </div>
  );
}

function normalizeDraftEmail(nome: string, cpf: string, email?: string) {
  const trimmed = email?.trim();
  if (trimmed) return trimmed;
  const cpfDigits = (cpf || "").replace(/\D/g, "");
  const slug = (nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = slug || cpfDigits || "cliente";
  return `${base}.${Date.now()}@temporario.local`;
}

interface CreateOnlyOptions {
  openSale?: boolean;
}

export function NovoClienteWizard({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: (created?: Aluno, opts?: CreateOnlyOptions) => void | Promise<void>;
}) {
  const { tenantId } = useTenantContext();
  const [step, setStep] = useState(1);
  const commercial = useCommercialFlow({
    tenantId,
  });

  const { planos, formasPagamento: formas, clearCart, dryRun } = commercial;
  const [showComplementary, setShowComplementary] = useState(false);
  
  const [result, setResult] = useState<CriarAlunoComMatriculaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ClienteWizardForm>({
    resolver: zodResolver(clienteWizardSchema),
    mode: "onBlur",
    defaultValues: {
      nome: "", email: "", telefone: "", telefoneSec: "", cpf: "", rg: "",
      dataNascimento: "", sexo: "",
      enderecoCep: "", enderecoLogradouro: "", enderecoNumero: "", enderecoComplemento: "",
      enderecoBairro: "", enderecoCidade: "", enderecoEstado: "",
      emergenciaNome: "", emergenciaTelefone: "", emergenciaParentesco: "",
      observacoesMedicas: "", foto: "",
      selectedPlano: "",
      pagamento: {
        dataInicio: getBusinessTodayIso(),
        formaPagamento: "",
        desconto: "",
      }
    }
  });

  const { hasDraft, restoreDraft, discardDraft, clearDraft, lastModified } = useFormDraft({
    key: "novo_cliente_wizard",
    form,
  });

  const { formState: { isDirty, isValid }, trigger, getValues, reset } = form;

  function fullReset() {
    setStep(1);
    setShowComplementary(false);
    reset();
    setResult(null);
    clearCart();
  }

  async function handleNext() {
    if (step === 1) {
      const ok = await trigger(["nome", "telefone", "cpf", "email"]);
      if (!ok) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const pId = getValues("selectedPlano");
      if (!pId) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!tenantId) return;
      const ok = await trigger(["pagamento.formaPagamento", "pagamento.dataInicio"]);
      if (!ok) return;

      const vals = getValues();
      const plano = planos.find((p) => p.id === vals.selectedPlano);
      if (!plano || !vals.pagamento.formaPagamento || !dryRun) return;
      
      setLoading(true);
      try {
        const resp = await createAlunoComMatriculaService({
          tenantId,
          data: {
            nome: vals.nome,
            email: normalizeDraftEmail(vals.nome, vals.cpf, vals.email),
            telefone: vals.telefone,
            telefoneSec: vals.telefoneSec,
            cpf: vals.cpf,
            rg: vals.rg,
            dataNascimento: vals.dataNascimento || "2000-01-01",
            sexo: (vals.sexo || "OUTRO") as Sexo,
            endereco: vals.enderecoCep ? {
              cep: vals.enderecoCep,
              logradouro: vals.enderecoLogradouro,
              numero: vals.enderecoNumero,
              complemento: vals.enderecoComplemento,
              bairro: vals.enderecoBairro,
              cidade: vals.enderecoCidade,
              estado: vals.enderecoEstado,
            } : undefined,
            contatoEmergencia: vals.emergenciaNome ? {
              nome: vals.emergenciaNome,
              telefone: vals.emergenciaTelefone || "",
              parentesco: vals.emergenciaParentesco,
            } : undefined,
            observacoesMedicas: vals.observacoesMedicas,
            foto: vals.foto,
            planoId: dryRun?.planoContexto.planoId || (vals.selectedPlano as string),
            dataInicio: dryRun?.planoContexto.dataInicio || (vals.pagamento.dataInicio as string),
            formaPagamento: vals.pagamento.formaPagamento as TipoFormaPagamento,
            desconto: dryRun?.descontoTotal ?? (parseFloat(vals.pagamento.desconto || "0") || 0),
          },
        });
        setResult(resp);
        setStep(4);
        clearDraft();
        if (onDone) {
          void onDone(resp.aluno);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleCreateOnly(options?: CreateOnlyOptions) {
    if (!tenantId) return;
    const ok = await trigger(["nome", "telefone", "cpf", "email"]);
    if (!ok) return;

    setLoading(true);
    const vals = getValues();
    try {
      const created = await createAlunoService({
        tenantId,
        data: {
          nome: vals.nome,
          email: normalizeDraftEmail(vals.nome, vals.cpf, vals.email),
          telefone: vals.telefone,
          telefoneSec: vals.telefoneSec,
          cpf: vals.cpf,
          rg: vals.rg,
          dataNascimento: vals.dataNascimento || "2000-01-01",
          sexo: (vals.sexo || "OUTRO") as Sexo,
          endereco: vals.enderecoCep ? {
            cep: vals.enderecoCep,
            logradouro: vals.enderecoLogradouro,
            numero: vals.enderecoNumero,
            complemento: vals.enderecoComplemento,
            bairro: vals.enderecoBairro,
            cidade: vals.enderecoCidade,
            estado: vals.enderecoEstado,
          } : undefined,
          contatoEmergencia: vals.emergenciaNome ? {
            nome: vals.emergenciaNome,
            telefone: vals.emergenciaTelefone || "",
            parentesco: vals.emergenciaParentesco,
          } : undefined,
          observacoesMedicas: vals.observacoesMedicas,
          foto: vals.foto,
        },
      });
      clearDraft();
      if (onDone) {
        await onDone(created, options);
      }
      onClose();
      fullReset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onClose();
        fullReset();
      }
    }}>
      <RestoreDraftModal
        hasDraft={hasDraft && open && step === 1 && !result}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
      />
      <DialogContent className="bg-card border-border sm:max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 shrink-0 border-b border-border/50">
          <div className="flex items-start justify-between">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">
                Novo cliente
              </DialogTitle>
            </DialogHeader>
            <FormDraftIndicator lastModified={lastModified} />
          </div>

          {step <= 3 && (
            <div className="flex items-center gap-4 text-sm mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <StepDot step={s} current={step} />
                  {s < 3 && <div className="h-px w-10 bg-border/70 hidden sm:block" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <Step1Dados
              form={form}
              showComplementary={showComplementary}
              onToggleComplementary={() => setShowComplementary((v) => !v)}
            />
          )}
          {step === 2 && <Step2Plano planos={planos} form={form} onSelectPlano={(p) => commercial.addPlanoToCart(p)} />}
          {step === 3 && <Step3Pagamento fps={formas} form={form} commercial={commercial} />}
          {step === 4 && result && <StepSucesso result={result} plano={planos.find((p) => p.id === form.getValues().selectedPlano)} onClose={() => { onClose(); fullReset(); }} />}

          </div>
          {step <= 3 && (
            <div className={cn("shrink-0 p-4 sm:px-6 border-t bg-card transition-colors duration-300", isDirty ? "border-t-gym-accent shadow-[0_-4px_15px_-4px_rgba(var(--gym-accent),0.25)]" : "border-border")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
                  className="border-border"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  {step === 1 && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleCreateOnly()}
                        disabled={loading || !isValid}
                      >
                        Pré-cadastro
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => handleCreateOnly({ openSale: true })}
                        disabled={loading || !isValid}
                      >
                        Pré-cadastro + venda <ArrowRight className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNext}
                        disabled={loading || !isValid}
                      >
                        Completar cadastro <ArrowRight className="size-3.5" />
                      </Button>
                    </>
                  )}
                  {step > 1 && (
                    <Button type="button" onClick={handleNext} disabled={loading}>
                      {loading ? "Salvando..." : "Próximo"} <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
