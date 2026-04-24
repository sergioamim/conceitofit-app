"use client";

import { zodResolver } from "@/lib/forms/zod-resolver";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  createCrmEscalationRuleApi,
  updateCrmEscalationRuleApi,
} from "@/lib/api/crm-cadencias";
import type {
  CrmCadencia,
  CrmEscalationAction,
  CrmEscalationRule,
  StatusProspect,
} from "@/lib/types";
import {
  CRM_ESCALATION_ACTION_LABEL,
  getCrmStageName,
} from "@/lib/tenant/crm/workspace";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const ESCALATION_CONDITIONS = [
  "TAREFA_VENCIDA",
  "SEM_RESPOSTA_APOS_CADENCIA",
  "SLA_EXCEDIDO",
] as const;

const ESCALATION_CONDITION_LABEL: Record<
  (typeof ESCALATION_CONDITIONS)[number],
  string
> = {
  TAREFA_VENCIDA: "Tarefa vencida",
  SEM_RESPOSTA_APOS_CADENCIA: "Sem resposta após cadência",
  SLA_EXCEDIDO: "SLA excedido",
};

const ESCALATION_ACTIONS: readonly CrmEscalationAction[] = [
  "MOVER_ETAPA",
  "CRIAR_TAREFA_URGENTE",
  "NOTIFICAR_GESTOR",
  "MARCAR_PERDIDO",
] as const;

const STAGE_STATUSES: readonly StatusProspect[] = [
  "NOVO",
  "EM_CONTATO",
  "AGENDOU_VISITA",
  "VISITOU",
  "CONVERTIDO",
  "PERDIDO",
] as const;

const escalationRuleSchema = z.object({
  cadenciaId: z.string().uuid({ message: "Selecione uma cadência" }),
  nome: z.string().min(1, "Nome obrigatório").max(120),
  condicao: z.enum(ESCALATION_CONDITIONS),
  acao: z.enum(ESCALATION_ACTIONS),
  horasLimite: z.coerce.number().min(1).max(720).optional(),
  novoStatus: z.enum(STAGE_STATUSES).optional(),
  ativo: z.boolean(),
});

type EscalationRuleFormData = z.infer<typeof escalationRuleSchema>;

const DEFAULT_VALUES: EscalationRuleFormData = {
  cadenciaId: "",
  nome: "",
  condicao: "TAREFA_VENCIDA",
  acao: "NOTIFICAR_GESTOR",
  horasLimite: 24,
  novoStatus: "PERDIDO",
  ativo: true,
};

function defaultHorasFor(
  condicao: (typeof ESCALATION_CONDITIONS)[number],
): number {
  if (condicao === "SEM_RESPOSTA_APOS_CADENCIA") return 72;
  if (condicao === "SLA_EXCEDIDO") return 48;
  return 24;
}

function paramsKeyFor(
  condicao: (typeof ESCALATION_CONDITIONS)[number],
): string {
  if (condicao === "SLA_EXCEDIDO") return "slaHoras";
  return "horasLimite";
}

export interface EscalationRuleEditorModalProps {
  open: boolean;
  tenantId: string;
  cadencias: CrmCadencia[];
  rule: CrmEscalationRule | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EscalationRuleEditorModal({
  open,
  tenantId,
  cadencias,
  rule,
  onOpenChange,
  onSaved,
}: EscalationRuleEditorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(rule);

  const form = useForm<EscalationRuleFormData>({
    resolver: zodResolver(escalationRuleSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const { control, register, handleSubmit, reset, setValue, formState } = form;

  const watchedCadenciaId = useWatch({ control, name: "cadenciaId" });
  const watchedNome = useWatch({ control, name: "nome" });
  const watchedCondicao = useWatch({ control, name: "condicao" });
  const watchedAcao = useWatch({ control, name: "acao" });
  const watchedAtivo = useWatch({ control, name: "ativo" });
  const watchedNovoStatus = useWatch({ control, name: "novoStatus" });

  useEffect(() => {
    if (!open) return;
    if (rule) {
      const hParam = rule.parametros
        ? rule.parametros.horasLimite ?? rule.parametros.slaHoras
        : undefined;
      const parsedHoras = hParam ? Number(hParam) : undefined;
      const novoStatus =
        (rule.parametros?.novoStatus as StatusProspect | undefined) ??
        "PERDIDO";
      reset({
        cadenciaId: rule.cadenciaId,
        nome: rule.nome,
        condicao: rule.condicao,
        acao: rule.acao,
        horasLimite: Number.isFinite(parsedHoras)
          ? parsedHoras
          : defaultHorasFor(rule.condicao),
        novoStatus,
        ativo: rule.ativo,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, rule, reset]);

  const createMutation = useMutation({
    mutationFn: (data: EscalationRuleFormData) => {
      const parametros: Record<string, string> = {};
      if (typeof data.horasLimite === "number") {
        parametros[paramsKeyFor(data.condicao)] = String(data.horasLimite);
      }
      if (data.acao === "MOVER_ETAPA" && data.novoStatus) {
        parametros.novoStatus = data.novoStatus;
      }
      return createCrmEscalationRuleApi({
        tenantId,
        data: {
          cadenciaId: data.cadenciaId,
          nome: data.nome,
          condicao: data.condicao,
          acao: data.acao,
          ativo: data.ativo,
          parametros: Object.keys(parametros).length > 0 ? parametros : undefined,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "escalation-rules", tenantId],
      });
      toast({ title: "Regra criada" });
      onSaved?.();
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EscalationRuleFormData) => {
      if (!rule) throw new Error("Regra inválida");
      const parametros: Record<string, string> = {};
      if (typeof data.horasLimite === "number") {
        parametros[paramsKeyFor(data.condicao)] = String(data.horasLimite);
      }
      if (data.acao === "MOVER_ETAPA" && data.novoStatus) {
        parametros.novoStatus = data.novoStatus;
      }
      return updateCrmEscalationRuleApi({
        tenantId,
        id: rule.id,
        data: {
          cadenciaId: data.cadenciaId,
          nome: data.nome,
          condicao: data.condicao,
          acao: data.acao,
          ativo: data.ativo,
          parametros: Object.keys(parametros).length > 0 ? parametros : undefined,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "escalation-rules", tenantId],
      });
      toast({ title: "Regra atualizada" });
      onSaved?.();
      onOpenChange(false);
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  const canSave =
    Boolean(watchedCadenciaId) &&
    Boolean(watchedNome?.trim()) &&
    Boolean(watchedCondicao) &&
    Boolean(watchedAcao);

  function onSubmit(data: EscalationRuleFormData) {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const cadenciasAtivas = cadencias.filter((c) => c.ativo || c.id === rule?.cadenciaId);
  const horasLabel =
    watchedCondicao === "SLA_EXCEDIDO" ? "SLA (horas)" : "Horas limite";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar regra de escalação" : "Nova regra de escalação"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Cadência */}
          <div className="space-y-2">
            <Label>
              Cadência <span className="text-gym-danger">*</span>
            </Label>
            <Select
              value={watchedCadenciaId}
              onValueChange={(v) =>
                setValue("cadenciaId", v, { shouldTouch: true })
              }
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione a cadência" />
              </SelectTrigger>
              <SelectContent>
                {cadenciasAtivas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
                {cadenciasAtivas.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nenhuma cadência ativa.
                  </div>
                )}
              </SelectContent>
            </Select>
            {formState.errors.cadenciaId && (
              <p className="text-xs text-gym-danger">
                {formState.errors.cadenciaId.message}
              </p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="escalation-nome">
              Nome <span className="text-gym-danger">*</span>
            </Label>
            <Input
              id="escalation-nome"
              {...register("nome")}
              placeholder="Ex: Escalar lead vencido"
              aria-invalid={Boolean(formState.errors.nome)}
              className="bg-secondary border-border"
            />
            {formState.errors.nome && (
              <p className="text-xs text-gym-danger">
                {formState.errors.nome.message}
              </p>
            )}
          </div>

          {/* Condição + Ação */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Condição <span className="text-gym-danger">*</span>
              </Label>
              <Select
                value={watchedCondicao}
                onValueChange={(v) => {
                  const next = v as (typeof ESCALATION_CONDITIONS)[number];
                  setValue("condicao", next, { shouldTouch: true });
                  setValue("horasLimite", defaultHorasFor(next), {
                    shouldTouch: true,
                  });
                }}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESCALATION_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {ESCALATION_CONDITION_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Ação <span className="text-gym-danger">*</span>
              </Label>
              <Select
                value={watchedAcao}
                onValueChange={(v) =>
                  setValue("acao", v as CrmEscalationAction, {
                    shouldTouch: true,
                  })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESCALATION_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {CRM_ESCALATION_ACTION_LABEL[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parâmetros condicionais */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="escalation-horas">{horasLabel}</Label>
              <Input
                id="escalation-horas"
                type="number"
                min={1}
                max={720}
                {...register("horasLimite", { valueAsNumber: true })}
                className="bg-secondary border-border"
              />
              {formState.errors.horasLimite && (
                <p className="text-xs text-gym-danger">
                  {formState.errors.horasLimite.message}
                </p>
              )}
            </div>
            {watchedAcao === "MOVER_ETAPA" && (
              <div className="space-y-2">
                <Label>Novo status</Label>
                <Select
                  value={watchedNovoStatus ?? "PERDIDO"}
                  onValueChange={(v) =>
                    setValue("novoStatus", v as StatusProspect, {
                      shouldTouch: true,
                    })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {getCrmStageName(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2">
            <Switch
              id="escalation-ativo"
              checked={Boolean(watchedAtivo)}
              onCheckedChange={(v) =>
                setValue("ativo", v, { shouldTouch: true })
              }
            />
            <Label htmlFor="escalation-ativo" className="cursor-pointer">
              Regra ativa
            </Label>
          </div>

          {mutationError && (
            <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
              {normalizeErrorMessage(mutationError)}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !canSave}
              className="bg-gym-accent text-black hover:bg-gym-accent/90"
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar regra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
