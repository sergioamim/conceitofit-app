"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { zodResolver } from "@/lib/forms/zod-resolver";
import { formatDate } from "@/lib/formatters";
import type { ContratoCreditoDias } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  estornarCreditoDiasFormSchema,
  type EstornarCreditoDiasForm,
} from "./cliente-credito-dias-modal.schema";

const DEFAULT_VALUES: EstornarCreditoDiasForm = {
  motivo: "",
};

interface ClienteEstornarCreditoDiasModalProps {
  open: boolean;
  credito: ContratoCreditoDias | null;
  loading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EstornarCreditoDiasForm) => Promise<void> | void;
}

export function ClienteEstornarCreditoDiasModal({
  open,
  credito,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: ClienteEstornarCreditoDiasModalProps) {
  const form = useForm<EstornarCreditoDiasForm>({
    resolver: zodResolver(estornarCreditoDiasFormSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  if (!credito) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estornar crédito</DialogTitle>
          <DialogDescription>
            O contrato voltará do vencimento {formatDate(credito.dataFimPosterior)} para{" "}
            {formatDate(credito.dataFimAnterior)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium text-foreground">+{credito.dias} dias</p>
            <p className="mt-1 text-muted-foreground">{credito.motivo}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Emitido em {formatDate(credito.emitidoEm.split("T")[0] ?? credito.emitidoEm)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estorno-credito-dias-motivo">
              Motivo do estorno <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="estorno-credito-dias-motivo"
              className="min-h-28 border-border bg-secondary"
              maxLength={500}
              placeholder="Explique por que o crédito deve ser estornado..."
              aria-invalid={errors.motivo ? true : undefined}
              {...register("motivo")}
            />
            {errors.motivo?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.motivo.message}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-xs text-gym-danger">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Estornando...
                </>
              ) : (
                "Estornar crédito"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
