"use client";

import { ArrowLeft, Link2, Save, ShoppingCart } from "lucide-react";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";

import { Step1Dados } from "./wizard-step-dados";
import { useClienteWizardState, type CreateOnlyOptions } from "./use-cliente-wizard-state";

export type NovoClienteWizardOptions = CreateOnlyOptions;

/**
 * Wizard "Novo cliente" — VUN-5.1.
 *
 * Após VUN-5.1 o wizard tem **um único step** (Dados) e termina com 3 CTAs
 * no footer:
 *   1. Salvar             → cria Prospect e volta para listagem
 *   2. Vender             → cria Prospect e redireciona para o cockpit
 *   3. Vincular agregador → cria Prospect e abre modal VincularAgregador
 *
 * A navegação real (push, modal) fica a cargo do `onDone` no caller, que
 * recebe o `Aluno` criado e o objeto `opts` com `openSale | linkAggregator`.
 */
export function NovoClienteWizard({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: (created?: Aluno, opts?: NovoClienteWizardOptions) => void | Promise<void>;
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
        hasDraft={w.draft.hasDraft && open && !w.loading}
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
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Default do <form> = "Salvar". Vender / Vincular usam botões dedicados.
            void w.handleCreateOnly();
          }}
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Step1Dados
              form={w.form}
              showComplementary={w.showComplementary}
              onToggleComplementary={() => w.setShowComplementary((v) => !v)}
            />
          </div>

          <div className={cn(
            "shrink-0 p-4 sm:px-6 border-t bg-card transition-colors duration-300",
            w.isDirty ? "border-t-gym-accent shadow-[0_-4px_15px_-4px_rgba(var(--gym-accent),0.25)]" : "border-border",
          )}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                className="border-border"
                disabled={w.loading}
              >
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void w.handleCreateOnly()}
                  disabled={w.loading || !w.canSave}
                  data-testid="wizard-cta-salvar"
                >
                  <Save className="size-3.5" />
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => void w.handleCreateOnly({ openSale: true })}
                  disabled={w.loading || !w.canSave}
                  data-testid="wizard-cta-vender"
                >
                  <ShoppingCart className="size-3.5" />
                  Vender
                </Button>
                <Button
                  type="button"
                  onClick={() => void w.handleCreateOnly({ linkAggregator: true })}
                  disabled={w.loading || !w.canSave}
                  data-testid="wizard-cta-vincular-agregador"
                >
                  <Link2 className="size-3.5" />
                  Vincular agregador
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
