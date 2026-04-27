"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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

import {
  editarContratoFormSchema,
  type EditarContratoForm,
} from "./cliente-credito-dias-modal.schema";

function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculatePreviewDataFim(
  dataInicioAtual: string,
  dataFimAtual: string,
  novaDataInicio: string,
): string | null {
  const inicioAtual = parseLocalDate(dataInicioAtual);
  const fimAtual = parseLocalDate(dataFimAtual);
  const inicioNovo = parseLocalDate(novaDataInicio);
  if (!inicioAtual || !fimAtual || !inicioNovo) return null;

  const diffMs = fimAtual.getTime() - inicioAtual.getTime();
  if (diffMs < 0) return null;

  const diasEfetivos = Math.floor(diffMs / 86_400_000) + 1;
  const fimNovo = new Date(inicioNovo);
  fimNovo.setDate(fimNovo.getDate() + diasEfetivos - 1);
  return formatLocalDate(fimNovo);
}

interface ClienteEditarContratoModalProps {
  open: boolean;
  dataInicioAtual: string;
  dataFimAtual: string;
  loading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditarContratoForm) => Promise<void> | void;
}

const DEFAULT_VALUES: EditarContratoForm = {
  dataInicio: "",
  motivo: "",
};

export function ClienteEditarContratoModal({
  open,
  dataInicioAtual,
  dataFimAtual,
  loading,
  error,
  onOpenChange,
  onSubmit,
}: ClienteEditarContratoModalProps) {
  const form = useForm<EditarContratoForm>({
    resolver: zodResolver(editarContratoFormSchema),
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
      reset({
        dataInicio: dataInicioAtual,
        motivo: "",
      });
    }
  }, [dataInicioAtual, open, reset]);

  const novaDataInicio = watch("dataInicio");
  const novaDataFim = calculatePreviewDataFim(
    dataInicioAtual,
    dataFimAtual,
    novaDataInicio,
  );

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
            Corrija a data de início com auditoria obrigatória. O vencimento será
            recalculado preservando a duração atual do contrato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="text-muted-foreground">
              Início atual:{" "}
              <span className="font-semibold text-foreground">
                {formatDate(dataInicioAtual)}
              </span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Vencimento atual:{" "}
              <span className="font-semibold text-foreground">
                {formatDate(dataFimAtual)}
              </span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Novo vencimento:{" "}
              <span className="font-semibold text-foreground">
                {novaDataFim ? formatDate(novaDataFim) : "Preencha uma data válida"}
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editar-contrato-data-inicio">
              Nova data de início <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editar-contrato-data-inicio"
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
            <Label htmlFor="editar-contrato-motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="editar-contrato-motivo"
              className="min-h-28 border-border bg-secondary"
              maxLength={500}
              placeholder="Descreva por que o contrato precisa ser corrigido..."
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
                  Salvando...
                </>
              ) : (
                "Salvar edição"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
