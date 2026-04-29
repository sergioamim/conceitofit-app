"use client";

import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { listProspectsApi } from "@/lib/api/crm";
import { triggerCrmCadenceApi } from "@/lib/api/crm-cadencias";
import type { CrmCadencia } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const triggerCadenciaSchema = z.object({
  prospectId: z.string().min(1, "Selecione um prospect"),
});

type TriggerCadenciaFormData = z.infer<typeof triggerCadenciaSchema>;

export interface TriggerCadenciaModalProps {
  open: boolean;
  tenantId: string;
  cadencia: CrmCadencia | null;
  onOpenChange: (open: boolean) => void;
  onTriggered?: () => void;
}

export function TriggerCadenciaModal({
  open,
  tenantId,
  cadencia,
  onOpenChange,
  onTriggered,
}: TriggerCadenciaModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");
  const form = useForm<TriggerCadenciaFormData>({
    resolver: zodResolver(triggerCadenciaSchema),
    mode: "onChange",
    defaultValues: {
      prospectId: "",
    },
  });
  const { control, formState, handleSubmit, register, reset, setError, setValue } = form;
  const prospectId = useWatch({ control, name: "prospectId" });

  useEffect(() => {
    if (!open) return;
    reset({ prospectId: "" });
  }, [open, reset]);

  // React Query carrega prospects on-demand.
  const {
    data: prospects = [],
    isLoading: loadingProspects,
    error: prospectsError,
  } = useQuery({
    queryKey: ["crm", "prospects", tenantId],
    queryFn: () => listProspectsApi({ tenantId }),
    enabled: open && Boolean(tenantId),
    staleTime: 30_000,
  });

  const triggerMutation = useMutation({
    mutationFn: (data: TriggerCadenciaFormData) => {
      if (!cadencia) throw new Error("Cadência inválida");
      return triggerCrmCadenceApi({
        tenantId,
        cadenciaId: cadencia.id,
        prospectId: data.prospectId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "cadencia-executions", tenantId],
      });
      toast({ title: "Cadência disparada com sucesso" });
      onTriggered?.();
      reset({ prospectId: "" });
      onOpenChange(false);
    },
  });

  const submitting = triggerMutation.isPending;
  const canTrigger = formState.isValid && !submitting;

  async function onSubmit(data: TriggerCadenciaFormData) {
    form.clearErrors();
    setSubmitError("");
    try {
      await triggerMutation.mutateAsync(data);
    } catch (error) {
      const { appliedFields, unmatchedFieldErrors, hasFieldErrors } = applyApiFieldErrors(
        error,
        setError,
      );
      if (!hasFieldErrors || Object.keys(unmatchedFieldErrors).length > 0) {
        setSubmitError(
          buildFormApiErrorMessage(error, {
            appliedFields,
            fallbackMessage: "Não foi possível disparar a cadência. Tente novamente.",
          }),
        );
      }
    }
  }

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (submitting) return;
      if (!next) {
        setSubmitError("");
        reset({ prospectId: "" });
      }
      onOpenChange(next);
    },
    [submitting, onOpenChange, reset],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Disparar cadência manualmente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {cadencia && (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <p className="font-medium">{cadencia.nome}</p>
              <p className="text-xs text-muted-foreground">
                {cadencia.objetivo}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <input type="hidden" {...register("prospectId")} />
            <Label htmlFor="trigger-prospect">
              Prospect <span className="text-gym-danger">*</span>
            </Label>
            <Select
              value={prospectId}
              onValueChange={(value) =>
                setValue("prospectId", value, {
                  shouldTouch: true,
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={loadingProspects || submitting}
            >
              <SelectTrigger
                id="trigger-prospect"
                className="bg-secondary border-border"
              >
                <SelectValue
                  placeholder={
                    loadingProspects
                      ? "Carregando prospects…"
                      : "Selecione o prospect"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                    {p.telefone ? ` · ${p.telefone}` : ""}
                  </SelectItem>
                ))}
                {!loadingProspects && prospects.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nenhum prospect encontrado.
                  </div>
                )}
              </SelectContent>
            </Select>
            {prospectsError && (
              <p className="text-xs text-gym-danger">
                {normalizeErrorMessage(prospectsError)}
              </p>
            )}
            {formState.errors.prospectId && (
              <p className="text-xs text-gym-danger">
                {formState.errors.prospectId.message}
              </p>
            )}
          </div>
          {submitError ? (
            <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
              {submitError}
            </div>
          ) : null}
          <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-border"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-gym-accent text-black hover:bg-gym-accent/90"
            disabled={!canTrigger}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Play className="mr-2 size-4" />
            )}
            Disparar
          </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
