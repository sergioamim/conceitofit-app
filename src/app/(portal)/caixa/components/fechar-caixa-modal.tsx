"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { fecharCaixa } from "@/lib/api/caixa";
import type { SaldoParcialResponse } from "@/lib/api/caixa.types";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";

import {
  FecharCaixaSchema,
  type FecharCaixaFormData,
} from "../lib/caixa-schemas";

interface FecharCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixaId: string;
  saldoAtual: SaldoParcialResponse;
  onSuccess: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
}

/** Tolerância padrão do backend para "sem diferença relevante" (R$ 0,50). */
const DIFF_TOLERANCIA = 0.5;

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Modal "Fechar caixa". Preview da diferença é calculado em tempo real
 * via `useWatch` — cor verde quando `|diff| <= 0,50`, vermelha caso
 * contrário. Respeita hydration: toda aritmética roda após interação.
 */
export function FecharCaixaModal({
  open,
  onOpenChange,
  caixaId,
  saldoAtual,
  onSuccess,
  title = "Fechar caixa",
  description,
  submitLabel = "Confirmar fechamento",
}: FecharCaixaModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FecharCaixaFormData>({
    resolver: zodResolver(FecharCaixaSchema),
    defaultValues: { valorInformado: 0, observacoes: "" },
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const valorInformadoValue = Number(form.watch("valorInformado"));
  const canSave = Number.isFinite(valorInformadoValue) && valorInformadoValue >= 0;

  const valorInformado = useWatch({ control, name: "valorInformado" });
  const valorNumero =
    typeof valorInformado === "number" && Number.isFinite(valorInformado)
      ? valorInformado
      : Number(valorInformado) || 0;
  const diferenca = valorNumero - saldoAtual.total;
  const diffOk = Math.abs(diferenca) <= DIFF_TOLERANCIA;

  async function onSubmit(data: FecharCaixaFormData): Promise<void> {
    setSubmitting(true);
    try {
      await fecharCaixa(caixaId, {
        valorInformado: data.valorInformado,
        observacoes: data.observacoes?.trim() ? data.observacoes.trim() : null,
      });
      reset();
      onSuccess();
    } catch (err) {
      if (isCaixaApiError(err)) {
        const mapped = mapCaixaError(err);
        toast({
          variant: "destructive",
          title: mapped.titulo,
          description: mapped.mensagem,
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Falha ao fechar caixa",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Saldo parcial esperado
            </p>
            <p className="mt-1 text-2xl font-extrabold">
              {BRL.format(saldoAtual.total)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valorInformado">
              Valor conferido no caixa (R$) <span className="text-gym-danger">*</span>
            </Label>
            <Input
              id="valorInformado"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              aria-invalid={Boolean(errors.valorInformado)}
              {...register("valorInformado")}
            />
            {errors.valorInformado ? (
              <p className="text-xs text-gym-danger">
                {errors.valorInformado.message}
              </p>
            ) : null}
          </div>

          <div
            className={
              diffOk
                ? "rounded-xl border border-gym-teal/30 bg-gym-teal/10 p-3 text-sm"
                : "rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-3 text-sm"
            }
            data-testid="fechar-caixa-preview"
            data-diff-ok={diffOk ? "true" : "false"}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Diferença prevista
            </p>
            <p className="mt-1 text-lg font-bold">
              {BRL.format(diferenca)}
            </p>
            <p className="mt-1 text-xs">
              {diffOk
                ? "Dentro da tolerância (≤ R$ 0,50)."
                : "Acima da tolerância — operação registrará alerta."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes-fechar">Observações (opcional)</Label>
            <Input
              id="observacoes-fechar"
              placeholder="Ex.: moedas conferidas, falta troco"
              {...register("observacoes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !canSave}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Fechando…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
