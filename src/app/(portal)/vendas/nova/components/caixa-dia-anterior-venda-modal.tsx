"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AbrirCaixaForm } from "@/app/(portal)/caixa/components/abrir-caixa-form";
import { FecharCaixaModal } from "@/app/(portal)/caixa/components/fechar-caixa-modal";
import type { CaixaResponse, SaldoParcialResponse } from "@/lib/api/caixa.types";

interface CaixaDiaAnteriorVendaModalProps {
  open: boolean;
  /** DIA_ANTERIOR: caixa antigo precisa ser fechado. NAO_ABERTO: nao ha caixa. */
  kind: "DIA_ANTERIOR" | "NAO_ABERTO";
  /** Obrigatorio quando kind=DIA_ANTERIOR; ignorado em NAO_ABERTO. */
  caixaAtivo: CaixaResponse | null;
  saldoAtual: SaldoParcialResponse | null;
  /** Apenas DIA_ANTERIOR: prossegue venda mesmo com caixa antigo aberto. */
  onContinuar: () => void;
  onCancelar: () => void;
  /** Disparado apos abertura inline de novo caixa — parent reexecuta a venda. */
  onCaixaAberto: () => void;
}

/**
 * Modal de bloqueio de venda por restricao de caixa. Cobre dois cenarios:
 *
 * - **DIA_ANTERIOR**: caixa esta aberto mas eh de outro dia. 3 acoes: continuar
 *   assim mesmo, conferir+fechar+abrir novo, ou cancelar.
 * - **NAO_ABERTO**: nao ha caixa ativo. 2 acoes: abrir caixa inline ou cancelar.
 *
 * Apos fechar (DIA_ANTERIOR) ou direto (NAO_ABERTO), exibe o
 * `AbrirCaixaForm` em dialog inline. Ao abrir o caixa, dispara
 * `onCaixaAberto` para o parent reexecutar a venda original.
 */
export function CaixaDiaAnteriorVendaModal({
  open,
  kind,
  caixaAtivo,
  saldoAtual,
  onContinuar,
  onCancelar,
  onCaixaAberto,
}: CaixaDiaAnteriorVendaModalProps) {
  // Etapas: 'alert' (alerta com acoes) -> 'fechar' (so DIA_ANTERIOR) -> 'abrir' (form inline)
  const [step, setStep] = useState<"alert" | "fechar" | "abrir">(
    kind === "NAO_ABERTO" ? "alert" : "alert",
  );

  const abertoEmFmt =
    caixaAtivo?.abertoEm
      ? caixaAtivo.abertoEm.slice(0, 10).split("-").reverse().join("/")
      : "—";

  const isDiaAnterior = kind === "DIA_ANTERIOR";

  return (
    <>
      <AlertDialog
        open={open && step === "alert"}
        onOpenChange={(next) => {
          if (!next) onCancelar();
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDiaAnterior
                ? "Caixa aberto em dia anterior"
                : "Nenhum caixa aberto"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {isDiaAnterior ? (
                  <>
                    <p>
                      O caixa em uso foi aberto em <b>{abertoEmFmt}</b>. O
                      recomendado é encerrar o caixa anterior e abrir um novo
                      antes de prosseguir.
                    </p>
                    <p className="text-muted-foreground">
                      Como prefere prosseguir?
                    </p>
                  </>
                ) : (
                  <p>
                    Você precisa abrir um caixa antes de registrar a venda.
                    Abra agora e a venda será refeita automaticamente.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Botoes empilhados verticalmente — evita estouro horizontal com 3 acoes */}
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            {isDiaAnterior ? (
              <>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep("fechar")}
                >
                  Conferir, fechar e abrir novo caixa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onContinuar}
                >
                  Continuar venda assim mesmo
                </Button>
                <AlertDialogCancel className="mt-0 w-full" onClick={onCancelar}>
                  Cancelar venda
                </AlertDialogCancel>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep("abrir")}
                >
                  Abrir caixa agora
                </Button>
                <AlertDialogCancel className="mt-0 w-full" onClick={onCancelar}>
                  Cancelar venda
                </AlertDialogCancel>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {step === "fechar" && caixaAtivo && saldoAtual ? (
        <FecharCaixaModal
          open
          onOpenChange={(o) => {
            if (!o) setStep("alert");
          }}
          caixaId={caixaAtivo.id}
          saldoAtual={saldoAtual}
          onSuccess={() => {
            // Encadeia: apos fechar, abre form de novo caixa inline.
            setStep("abrir");
          }}
          title="Fechar caixa anterior"
          description="Confirme o saldo do caixa anterior. Após fechar, abra um novo caixa para concluir a venda."
          submitLabel="Fechar caixa"
        />
      ) : null}

      {step === "abrir" ? (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setStep("alert");
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Abrir novo caixa</DialogTitle>
            </DialogHeader>
            <AbrirCaixaForm
              onSuccess={() => {
                // Caixa novo criado — parent reexecuta a venda.
                onCaixaAberto();
              }}
              onCaixaJaAberto={() => {
                // Race condition: alguem abriu antes. Tenta reexecutar mesmo assim.
                onCaixaAberto();
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
