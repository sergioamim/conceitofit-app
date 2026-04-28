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
import { FecharCaixaModal } from "@/app/(portal)/caixa/components/fechar-caixa-modal";
import type { CaixaResponse, SaldoParcialResponse } from "@/lib/api/caixa.types";

interface CaixaDiaAnteriorVendaModalProps {
  open: boolean;
  caixaAtivo: CaixaResponse;
  saldoAtual: SaldoParcialResponse;
  onContinuar: () => void;
  onCancelar: () => void;
  onCaixaFechado: () => void;
}

/**
 * Wave A1: modal exibido quando operador tenta finalizar venda mas o caixa
 * aberto é de dia anterior. 3 ações:
 *
 * - **Continuar venda assim mesmo**: dispara nova venda com flag
 *   `?aceitarCaixaDiaAnterior=true`. Backend pula a checagem.
 * - **Conferir e fechar caixa**: abre o `FecharCaixaModal` com o saldo
 *   atual; após fechar, callback notifica fluxo (pra orientar operador
 *   a abrir um novo caixa em /caixa).
 * - **Cancelar**: descarta a venda. Operador volta ao cockpit.
 */
export function CaixaDiaAnteriorVendaModal({
  open,
  caixaAtivo,
  saldoAtual,
  onContinuar,
  onCancelar,
  onCaixaFechado,
}: CaixaDiaAnteriorVendaModalProps) {
  const [fecharOpen, setFecharOpen] = useState(false);
  const abertoEmFmt = caixaAtivo.abertoEm
    ? caixaAtivo.abertoEm.slice(0, 10).split("-").reverse().join("/")
    : "—";

  return (
    <>
      <AlertDialog
        open={open && !fecharOpen}
        onOpenChange={(next) => {
          if (!next) onCancelar();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Caixa aberto em dia anterior</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  O caixa em uso foi aberto em <b>{abertoEmFmt}</b>. O ideal é
                  encerrar o caixa anterior antes de prosseguir, mas você pode
                  registrar a venda mesmo assim.
                </p>
                <p className="text-muted-foreground">
                  Como prefere prosseguir?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={onCancelar}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFecharOpen(true)}
            >
              Conferir e fechar caixa
            </Button>
            <AlertDialogAction onClick={onContinuar}>
              Continuar venda assim mesmo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {fecharOpen ? (
        <FecharCaixaModal
          open
          onOpenChange={(o) => {
            if (!o) setFecharOpen(false);
          }}
          caixaId={caixaAtivo.id}
          saldoAtual={saldoAtual}
          onSuccess={() => {
            setFecharOpen(false);
            onCaixaFechado();
          }}
          title="Fechar caixa anterior"
          description="Confirme o saldo do caixa anterior. Após o fechamento, você poderá abrir um novo caixa em Meu Caixa e refazer a venda."
          submitLabel="Fechar caixa"
        />
      ) : null}
    </>
  );
}
