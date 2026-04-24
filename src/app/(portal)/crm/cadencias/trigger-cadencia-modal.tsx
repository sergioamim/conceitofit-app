"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { useCallback, useState } from "react";
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
  const [prospectId, setProspectId] = useState<string>("");

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
    mutationFn: () => {
      if (!cadencia) throw new Error("Cadência inválida");
      if (!prospectId) throw new Error("Selecione um prospect");
      return triggerCrmCadenceApi({
        tenantId,
        cadenciaId: cadencia.id,
        prospectId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "cadencia-executions", tenantId],
      });
      toast({ title: "Cadência disparada com sucesso" });
      onTriggered?.();
      setProspectId("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao disparar cadência",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const submitting = triggerMutation.isPending;
  const canTrigger = Boolean(prospectId) && !submitting;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (submitting) return;
      if (!next) setProspectId("");
      onOpenChange(next);
    },
    [submitting, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Disparar cadência manualmente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {cadencia && (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <p className="font-medium">{cadencia.nome}</p>
              <p className="text-xs text-muted-foreground">
                {cadencia.objetivo}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trigger-prospect">
              Prospect <span className="text-gym-danger">*</span>
            </Label>
            <Select
              value={prospectId}
              onValueChange={setProspectId}
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
          </div>
        </div>
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
            type="button"
            className="bg-gym-accent text-black hover:bg-gym-accent/90"
            onClick={() => triggerMutation.mutate()}
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
      </DialogContent>
    </Dialog>
  );
}
