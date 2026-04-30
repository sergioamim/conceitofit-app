"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { formatDate } from "@/lib/formatters";
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
import { Textarea } from "@/components/ui/textarea";

const contratoEditSchema = z.object({
  dataInicio: z
    .string()
    .trim()
    .min(1, "Informe a nova data de inicio.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  motivo: z
    .string()
    .trim()
    .min(20, "Informe um motivo com pelo menos 20 caracteres.")
    .max(500, "O motivo deve ter no maximo 500 caracteres."),
});

export type ContratoEditForm = z.input<typeof contratoEditSchema>;

type ContratoEditModalProps = {
  open: boolean;
  alunoNome: string;
  dataInicioAtual: string;
  dataFimAtual: string;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContratoEditForm) => Promise<void> | void;
};

const DEFAULT_VALUES: ContratoEditForm = {
  dataInicio: "",
  motivo: "",
};

export function ContratoEditModal({
  open,
  alunoNome,
  dataInicioAtual,
  dataFimAtual,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: ContratoEditModalProps) {
  const form = useForm<ContratoEditForm>({
    resolver: zodResolver(contratoEditSchema),
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
      reset({
        dataInicio: dataInicioAtual,
        motivo: "",
      });
    }
  }, [dataInicioAtual, open, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar contrato</DialogTitle>
          <DialogDescription>
            Ajuste a data de inicio de {alunoNome}. O motivo e obrigatorio e fica registrado na auditoria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="text-muted-foreground">
              Inicio atual: <span className="font-semibold text-foreground">{formatDate(dataInicioAtual)}</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Vencimento atual: <span className="font-semibold text-foreground">{formatDate(dataFimAtual)}</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              O vencimento sera recalculado preservando a duracao atual do contrato.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contrato-edit-data-inicio">
              Nova data de inicio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contrato-edit-data-inicio"
              type="date"
              aria-invalid={errors.dataInicio ? true : undefined}
              {...register("dataInicio")}
            />
            {errors.dataInicio?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.dataInicio.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contrato-edit-motivo">
              Motivo da alteracao <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="contrato-edit-motivo"
              className="min-h-28 border-border bg-secondary"
              maxLength={500}
              placeholder="Explique por que a data de inicio precisa ser ajustada..."
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
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)} disabled={loading}>
              Fechar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar edicao"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
