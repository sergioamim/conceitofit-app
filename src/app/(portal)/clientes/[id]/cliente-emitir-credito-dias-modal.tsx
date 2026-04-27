"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { zodResolver } from "@/lib/forms/zod-resolver";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  emitirCreditoDiasFormSchema,
  type EmitirCreditoDiasForm,
} from "./cliente-credito-dias-modal.schema";

function addDays(dateString: string, days: number): string | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day || !Number.isFinite(days)) return null;
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

const DEFAULT_VALUES: EmitirCreditoDiasForm = {
  dias: 1,
  motivo: "",
};

interface ClienteEmitirCreditoDiasModalProps {
  open: boolean;
  contratoDataFim: string;
  loading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EmitirCreditoDiasForm) => Promise<void> | void;
}

export function ClienteEmitirCreditoDiasModal({
  open,
  contratoDataFim,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: ClienteEmitirCreditoDiasModalProps) {
  const form = useForm<EmitirCreditoDiasForm>({
    resolver: zodResolver(emitirCreditoDiasFormSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const dias = watch("dias");
  const novaDataFim = typeof dias === "number" ? addDays(contratoDataFim, dias) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Creditar dias</DialogTitle>
          <DialogDescription>
            Ajuste o vencimento do contrato ativo com trilha de auditoria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="text-muted-foreground">
              Vencimento atual:{" "}
              <span className="font-semibold text-foreground">
                {formatDate(contratoDataFim)}
              </span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Novo vencimento:{" "}
              <span className="font-semibold text-foreground">
                {novaDataFim ? formatDate(novaDataFim) : "Preencha a quantidade de dias"}
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credito-dias-quantidade">
              Dias <span className="text-destructive">*</span>
            </Label>
            <Input
              id="credito-dias-quantidade"
              type="number"
              min={1}
              max={30}
              step={1}
              aria-invalid={errors.dias ? true : undefined}
              {...register("dias", { valueAsNumber: true })}
            />
            {errors.dias?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.dias.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credito-dias-motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="credito-dias-motivo"
              className="min-h-28 border-border bg-secondary"
              maxLength={500}
              placeholder="Descreva o motivo do crédito de dias..."
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creditando...
                </>
              ) : (
                "Creditar dias"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
