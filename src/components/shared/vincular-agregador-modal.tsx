"use client";

/**
 * Modal "Vincular Agregador" — VUN-5.2.
 *
 * Reusável: dispara via wizard de novo cliente (após cadastro do prospect)
 * e também pelo perfil do aluno (futuro). Cria vínculo permanente entre
 * o aluno e um agregador B2B (Wellhub/TotalPass/Outro).
 *
 * Form: react-hook-form + zodResolver + schema co-localizado.
 */
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getBusinessTodayIso } from "@/lib/business-date";
import {
  postAgregadorVinculo,
  type AgregadorVinculoResponse,
} from "@/lib/api/agregadores-vinculos";

import {
  AGREGADOR_TIPO_LABEL,
  AGREGADOR_TIPO_VALUES,
  vincularAgregadorSchema,
  type VincularAgregadorForm,
} from "./vincular-agregador-modal.schema";

export interface VincularAgregadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoId: string;
  tenantId: string;
  /** Disparado após criação bem-sucedida do vínculo. */
  onSuccess?: (vinculo: AgregadorVinculoResponse) => void;
}

const DEFAULT_VALUES: VincularAgregadorForm = {
  agregador: "WELLHUB",
  usuarioExternoId: "",
  dataInicio: "",
};

export function VincularAgregadorModal({
  open,
  onOpenChange,
  alunoId,
  tenantId,
  onSuccess,
}: VincularAgregadorModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<VincularAgregadorForm>({
    resolver: zodResolver(vincularAgregadorSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Inicializa dataInicio com hoje (no client) toda vez que o modal abre.
  // Evita usar `new Date()` no defaultValues (hidratação SSR).
  useEffect(() => {
    if (open) {
      reset({ ...DEFAULT_VALUES, dataInicio: getBusinessTodayIso() });
    }
  }, [open, reset]);

  async function onSubmit(values: VincularAgregadorForm) {
    if (!tenantId || !alunoId) {
      toast({
        title: "Não foi possível vincular",
        description: "Tenant ou aluno ausente.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const vinculo = await postAgregadorVinculo({
        tenantId,
        alunoId,
        agregador: values.agregador,
        usuarioExternoId: values.usuarioExternoId.trim(),
        dataInicio: values.dataInicio,
      });
      toast({
        title: "Vínculo criado",
        description: `${AGREGADOR_TIPO_LABEL[values.agregador]} · ${values.usuarioExternoId.trim()}`,
      });
      onSuccess?.(vinculo);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar vínculo.";
      toast({
        title: "Erro ao vincular agregador",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular agregador</DialogTitle>
          <DialogDescription>
            Conecte este aluno a um plano B2B (Wellhub, TotalPass ou outro convênio).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          data-testid="vincular-agregador-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="vincular-agregador-tipo">Tipo de agregador</Label>
            <Controller
              control={control}
              name="agregador"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="vincular-agregador-tipo"
                    className="w-full"
                    aria-label="Tipo de agregador"
                    aria-invalid={errors.agregador ? true : undefined}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGREGADOR_TIPO_VALUES.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {AGREGADOR_TIPO_LABEL[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.agregador?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.agregador.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vincular-agregador-usuario-externo">ID externo do usuário</Label>
            <Input
              id="vincular-agregador-usuario-externo"
              autoComplete="off"
              placeholder="Ex.: WHB-1234567"
              aria-invalid={errors.usuarioExternoId ? true : undefined}
              {...register("usuarioExternoId")}
            />
            {errors.usuarioExternoId?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.usuarioExternoId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vincular-agregador-data-inicio">Data de início</Label>
            <Input
              id="vincular-agregador-data-inicio"
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

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Vinculando...
                </>
              ) : (
                "Vincular"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
