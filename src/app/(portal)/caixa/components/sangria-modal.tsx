"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { criarSangria } from "@/lib/api/caixa";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";

import { SangriaSchema, type SangriaFormData } from "../lib/caixa-schemas";

interface SangriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixaId: string;
  onSuccess: (movimentoId: string) => void;
}

/**
 * Modal "Sangria" — valor + motivo + autorizadoPor.
 *
 * Nota sobre `autorizadoPor`: um endpoint dedicado de gerentes do tenant
 * (`/api/tenant/gerentes`) ainda não está mapeado no FE. Para não bloquear
 * a tela operacional, mantemos input de UUID manual com validação. Quando
 * o endpoint existir, trocar por um `Select` populado via `useQuery`.
 */
export function SangriaModal({
  open,
  onOpenChange,
  caixaId,
  onSuccess,
}: SangriaModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SangriaFormData>({
    resolver: zodResolver(SangriaSchema),
    defaultValues: { valor: 0, motivo: "", autorizadoPor: "" },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  const valorSangria = Number(watch("valor"));
  const canSave =
    Number.isFinite(valorSangria) &&
    valorSangria > 0 &&
    (watch("motivo")?.length ?? 0) >= 5 &&
    Boolean(watch("autorizadoPor")?.trim());

  async function onSubmit(data: SangriaFormData): Promise<void> {
    setSubmitting(true);
    try {
      const result = await criarSangria(caixaId, data);
      reset();
      onSuccess(result.movimento.id);
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
        title: "Falha ao registrar sangria",
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
          <DialogTitle>Registrar sangria</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="sangria-valor">
              Valor (R$) <span className="text-gym-danger">*</span>
            </Label>
            <Input
              id="sangria-valor"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              aria-invalid={Boolean(errors.valor)}
              {...register("valor")}
            />
            {errors.valor ? (
              <p className="text-xs text-gym-danger">{errors.valor.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sangria-motivo">
              Motivo <span className="text-gym-danger">*</span>
            </Label>
            <Textarea
              id="sangria-motivo"
              rows={3}
              placeholder="Ex.: retirada de excedente — entregue ao gerente"
              aria-invalid={Boolean(errors.motivo)}
              {...register("motivo")}
            />
            {errors.motivo ? (
              <p className="text-xs text-gym-danger">{errors.motivo.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Mínimo de 5 caracteres.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sangria-autorizadoPor">
              Autorizado por (UUID do gerente) <span className="text-gym-danger">*</span>
            </Label>
            <Input
              id="sangria-autorizadoPor"
              placeholder="ex.: 123e4567-e89b-12d3-a456-426614174000"
              aria-invalid={Boolean(errors.autorizadoPor)}
              {...register("autorizadoPor")}
            />
            {errors.autorizadoPor ? (
              <p className="text-xs text-gym-danger">
                {errors.autorizadoPor.message}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Listagem de gerentes em integração — informar UUID manualmente
                até a feature chegar.
              </p>
            )}
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
                  Registrando…
                </>
              ) : (
                "Confirmar sangria"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
