"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";

import { StepDot } from "./wizard-types";
import { Step1Dados } from "./wizard-step-dados";
import { Step2Plano } from "./wizard-step-plano";
import { Step3Pagamento } from "./wizard-step-pagamento";
import { StepSucesso } from "./wizard-step-sucesso";
import { useClienteWizardState } from "./use-cliente-wizard-state";

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
  const w = useClienteWizardState({ onClose, onDone });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onClose();
        w.fullReset();
      }
    }}>
      <RestoreDraftModal
        hasDraft={w.draft.hasDraft && open && w.step === 1 && !w.result}
        onRestore={w.draft.restoreDraft}
        onDiscard={w.draft.discardDraft}
      />
      <DialogContent className="bg-card border-border sm:max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 shrink-0 border-b border-border/50">
          <div className="flex items-start justify-between">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">
                Novo cliente
              </DialogTitle>
            </DialogHeader>
            <FormDraftIndicator lastModified={w.draft.lastModified} />
          </div>

          {w.step <= 3 && (
            <div className="flex items-center gap-4 text-sm mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <StepDot step={s} current={w.step} />
                  {s < 3 && <div className="h-px w-10 bg-border/70 hidden sm:block" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); w.handleNext(); }} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {w.step === 1 && (
              <Step1Dados
                form={w.form}
                showComplementary={w.showComplementary}
                onToggleComplementary={() => w.setShowComplementary((v) => !v)}
              />
            )}
            {w.step === 2 && <Step2Plano planos={w.planos} form={w.form} onSelectPlano={(p) => w.commercial.addPlanoToCart(p)} />}
            {w.step === 3 && <Step3Pagamento fps={w.formas} form={w.form} commercial={w.commercial} />}
            {w.step === 4 && w.result && <StepSucesso result={w.result} plano={w.planos.find((p) => p.id === w.form.getValues().selectedPlano)} onClose={() => { onClose(); w.fullReset(); }} />}
          </div>

          {w.step <= 3 && (
            <div className={cn("shrink-0 p-4 sm:px-6 border-t bg-card transition-colors duration-300", w.isDirty ? "border-t-gym-accent shadow-[0_-4px_15px_-4px_rgba(var(--gym-accent),0.25)]" : "border-border")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (w.step === 1 ? onClose() : w.setStep((s) => s - 1))}
                  className="border-border"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  {w.step === 1 && (
                    <>
                      <Button type="button" variant="secondary" onClick={() => w.handleCreateOnly()} disabled={w.loading || !w.isValid}>
                        Pré-cadastro
                      </Button>
                      <Button type="button" variant="default" onClick={() => w.handleCreateOnly({ openSale: true })} disabled={w.loading || !w.isValid}>
                        Pré-cadastro + venda <ArrowRight className="size-3.5" />
                      </Button>
                      <Button type="button" variant="outline" onClick={w.handleNext} disabled={w.loading || !w.isValid}>
                        Completar cadastro <ArrowRight className="size-3.5" />
                      </Button>
                    </>
                  )}
                  {w.step > 1 && (
                    <Button type="button" onClick={w.handleNext} disabled={w.loading}>
                      {w.loading ? "Salvando..." : "Próximo"} <ArrowRight className="size-3.5" />
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
