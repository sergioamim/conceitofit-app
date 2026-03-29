"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getBusinessTodayIso } from "@/lib/business-date";
import {
  createAlunoComMatriculaService,
  createAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno, Sexo, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFormDraft } from "@/hooks/use-form-draft";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";

import {
  clienteWizardSchema,
  type ClienteWizardForm,
  type CriarAlunoComMatriculaResponse,
  normalizeDraftEmail,
  StepDot,
} from "./wizard-types";
import { Step1Dados } from "./wizard-step-dados";
import { Step2Plano } from "./wizard-step-plano";
import { Step3Pagamento } from "./wizard-step-pagamento";
import { StepSucesso } from "./wizard-step-sucesso";

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
