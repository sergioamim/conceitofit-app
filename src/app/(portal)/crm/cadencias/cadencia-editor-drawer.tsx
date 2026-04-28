"use client";

import { zodResolver } from "@/lib/forms/zod-resolver";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  createCrmCadenciaApi,
  updateCrmCadenciaApi,
} from "@/lib/api/crm";
import type {
  CrmCadencia,
  CrmCadenciaAcao,
  CrmCadenciaGatilho,
  StatusProspect,
} from "@/lib/types";
import {
  CRM_CADENCIA_TRIGGER_LABEL,
  getCrmStageName,
} from "@/lib/tenant/crm/workspace";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { CadenciaPassoFields } from "./cadencia-passo-fields";

const CADENCIA_TRIGGERS: readonly CrmCadenciaGatilho[] = [
  "NOVO_PROSPECT",
  "SEM_RESPOSTA",
  "VISITA_REALIZADA",
  "MUDANCA_DE_ETAPA",
  "CONVERSA_ABERTA",
  "MENSAGEM_RECEBIDA",
  "SEM_RESPOSTA_24H",
  "SEM_RESPOSTA_48H",
  "SEM_RESPOSTA_72H",
] as const;

const STAGE_STATUSES: readonly StatusProspect[] = [
  "NOVO",
  "EM_CONTATO",
  "AGENDOU_VISITA",
  "VISITOU",
  "CONVERTIDO",
  "PERDIDO",
] as const;

const CADENCIA_ACTIONS: readonly CrmCadenciaAcao[] = [
  "WHATSAPP",
  "EMAIL",
  "LIGACAO",
  "TAREFA_INTERNA",
] as const;

const MAX_PASSOS = 20;

const passoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(200),
  acao: z.enum(CADENCIA_ACTIONS),
  delayDias: z.coerce.number().min(0).max(365),
  template: z.string().optional().or(z.literal("")),
  automatica: z.boolean(),
});

const cadenciaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(120),
  objetivo: z.string().min(1, "Objetivo obrigatório").max(500),
  gatilho: z.enum(CADENCIA_TRIGGERS),
  stageStatus: z.enum(STAGE_STATUSES),
  ativo: z.boolean(),
  passos: z
    .array(passoSchema)
    .min(1, "Cadência deve ter pelo menos 1 passo")
    .max(MAX_PASSOS, `Máximo ${MAX_PASSOS} passos`),
});

export type CadenciaFormData = z.infer<typeof cadenciaSchema>;

const EMPTY_PASSO: CadenciaFormData["passos"][number] = {
  titulo: "",
  acao: "WHATSAPP",
  delayDias: 0,
  template: "",
  automatica: false,
};

const DEFAULT_VALUES: CadenciaFormData = {
  nome: "",
  objetivo: "",
  gatilho: "NOVO_PROSPECT",
  stageStatus: "NOVO",
  ativo: true,
  passos: [EMPTY_PASSO],
};

export interface CadenciaEditorDrawerProps {
  open: boolean;
  tenantId: string;
  cadencia: CrmCadencia | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function CadenciaEditorDrawer({
  open,
  tenantId,
  cadencia,
  onOpenChange,
  onSaved,
}: CadenciaEditorDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(cadencia);

  const form = useForm<CadenciaFormData>({
    resolver: zodResolver(cadenciaSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const { control, register, handleSubmit, reset, setValue, formState } = form;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "passos",
  });

  const watchedNome = useWatch({ control, name: "nome" });
  const watchedObjetivo = useWatch({ control, name: "objetivo" });
  const watchedPassos = useWatch({ control, name: "passos" });
  const watchedAtivo = useWatch({ control, name: "ativo" });
  const watchedGatilho = useWatch({ control, name: "gatilho" });
  const watchedStage = useWatch({ control, name: "stageStatus" });

  // Sincroniza defaults com a cadência em edição.
  useEffect(() => {
    if (!open) return;
    if (cadencia) {
      reset({
        nome: cadencia.nome,
        objetivo: cadencia.objetivo,
        gatilho: cadencia.gatilho,
        stageStatus: cadencia.stageStatus,
        ativo: cadencia.ativo,
        passos:
          cadencia.passos.length > 0
            ? cadencia.passos.map((p) => ({
                titulo: p.titulo,
                acao: p.acao,
                delayDias: p.delayDias,
                template: p.template ?? "",
                automatica: p.automatica,
              }))
            : [EMPTY_PASSO],
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, cadencia, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CadenciaFormData) =>
      createCrmCadenciaApi({
        tenantId,
        data: {
          ...data,
          passos: data.passos.map((p) => ({
            ...p,
            template: p.template?.trim() ? p.template : undefined,
          })),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "cadencias", tenantId],
      });
      toast({ title: "Cadência criada" });
      onSaved?.();
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CadenciaFormData) => {
      if (!cadencia) throw new Error("Cadência inválida");
      return updateCrmCadenciaApi({
        tenantId,
        id: cadencia.id,
        data: {
          ...data,
          passos: data.passos.map((p) => ({
            ...p,
            template: p.template?.trim() ? p.template : undefined,
          })),
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["crm", "cadencias", tenantId],
      });
      toast({ title: "Cadência atualizada" });
      onSaved?.();
      onOpenChange(false);
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  const canSave =
    Boolean(watchedNome?.trim()) &&
    Boolean(watchedObjetivo?.trim()) &&
    Array.isArray(watchedPassos) &&
    watchedPassos.length >= 1 &&
    watchedPassos.length <= MAX_PASSOS &&
    watchedPassos.every((p) => Boolean(p?.titulo?.trim()));

  function onSubmit(data: CadenciaFormData) {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  function handleAddPasso() {
    if (fields.length >= MAX_PASSOS) return;
    append({ ...EMPTY_PASSO });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-xl">
            {isEdit ? "Editar cadência" : "Nova cadência"}
          </SheetTitle>
          <SheetDescription>
            Configure triggers, passos automáticos e templates de mensagem para
            o pipeline comercial.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="cadencia-nome">
                Nome <span className="text-gym-danger">*</span>
              </Label>
              <Input
                id="cadencia-nome"
                {...register("nome")}
                placeholder="Ex: Follow-up pós-visita"
                aria-invalid={Boolean(formState.errors.nome)}
                className="bg-secondary border-border"
              />
              {formState.errors.nome && (
                <p className="text-xs text-gym-danger">
                  {formState.errors.nome.message}
                </p>
              )}
            </div>

            {/* Objetivo */}
            <div className="space-y-2">
              <Label htmlFor="cadencia-objetivo">
                Objetivo <span className="text-gym-danger">*</span>
              </Label>
              <Textarea
                id="cadencia-objetivo"
                {...register("objetivo")}
                placeholder="Ex: Recuperar prospects que realizaram visita e não deram retorno em 48h."
                aria-invalid={Boolean(formState.errors.objetivo)}
                className="min-h-[80px] bg-secondary border-border"
              />
              {formState.errors.objetivo && (
                <p className="text-xs text-gym-danger">
                  {formState.errors.objetivo.message}
                </p>
              )}
            </div>

            {/* Gatilho + Stage status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Gatilho <span className="text-gym-danger">*</span>
                </Label>
                <Select
                  value={watchedGatilho}
                  onValueChange={(v) =>
                    setValue("gatilho", v as CrmCadenciaGatilho, {
                      shouldTouch: true,
                    })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CADENCIA_TRIGGERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CRM_CADENCIA_TRIGGER_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Etapa do pipeline <span className="text-gym-danger">*</span>
                </Label>
                <Select
                  value={watchedStage}
                  onValueChange={(v) =>
                    setValue("stageStatus", v as StatusProspect, {
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
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <Switch
                id="cadencia-ativo"
                checked={Boolean(watchedAtivo)}
                onCheckedChange={(v) =>
                  setValue("ativo", v, { shouldTouch: true })
                }
              />
              <Label htmlFor="cadencia-ativo" className="cursor-pointer">
                Cadência ativa (disponível para disparos)
              </Label>
            </div>

            {/* Passos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>
                    Passos <span className="text-gym-danger">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {fields.length}/{MAX_PASSOS} configurados. Reordene com as
                    setas.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPasso}
                  disabled={fields.length >= MAX_PASSOS}
                  className="border-border"
                >
                  <Plus className="mr-1 size-3.5" />
                  Adicionar passo
                </Button>
              </div>

              {formState.errors.passos?.root && (
                <p className="text-xs text-gym-danger">
                  {formState.errors.passos.root.message}
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <CadenciaPassoFields
                    key={field.id}
                    index={index}
                    totalSteps={fields.length}
                    control={control}
                    register={register}
                    setValue={setValue}
                    errors={formState.errors.passos?.[index]}
                    onMoveUp={() => move(index, index - 1)}
                    onMoveDown={() => move(index, index + 1)}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="space-y-3 border-t border-border px-6 py-4">
            {mutationError && (
              <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                {normalizeErrorMessage(mutationError)}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
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
                {isEdit ? "Salvar" : "Criar cadência"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
