"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type {
  Control,
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { useWatch } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import type { CrmCadenciaAcao } from "@/lib/types";
import { CRM_CADENCIA_ACTION_LABEL } from "@/lib/tenant/crm/workspace";
import type { CadenciaFormData } from "./cadencia-editor-drawer";

const CADENCIA_ACTIONS: readonly CrmCadenciaAcao[] = [
  "WHATSAPP",
  "EMAIL",
  "LIGACAO",
  "TAREFA_INTERNA",
] as const;

type PassoError =
  | Merge<FieldError, FieldErrorsImpl<CadenciaFormData["passos"][number]>>
  | undefined;

export interface CadenciaPassoFieldsProps {
  index: number;
  totalSteps: number;
  control: Control<CadenciaFormData>;
  register: UseFormRegister<CadenciaFormData>;
  setValue: UseFormSetValue<CadenciaFormData>;
  errors?: PassoError;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function CadenciaPassoFields({
  index,
  totalSteps,
  control,
  register,
  setValue,
  errors,
  onMoveUp,
  onMoveDown,
  onRemove,
  canRemove,
}: CadenciaPassoFieldsProps) {
  const watchedAcao =
    useWatch({ control, name: `passos.${index}.acao` as const }) ?? "WHATSAPP";
  const watchedAutomatica = Boolean(
    useWatch({ control, name: `passos.${index}.automatica` as const }),
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-gym-accent/20 text-xs font-bold text-gym-accent">
            {index + 1}
          </span>
          <span className="text-sm font-medium">Passo {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Mover passo para cima"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onMoveDown}
            disabled={index === totalSteps - 1}
            aria-label="Mover passo para baixo"
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-gym-danger hover:text-gym-danger"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Remover passo"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`passo-${index}-titulo`}>
          Título <span className="text-gym-danger">*</span>
        </Label>
        <Input
          id={`passo-${index}-titulo`}
          {...register(`passos.${index}.titulo` as const)}
          placeholder="Ex: Primeiro contato via WhatsApp"
          aria-invalid={Boolean(errors?.titulo)}
          className="bg-secondary border-border"
        />
        {errors?.titulo && (
          <p className="text-xs text-gym-danger">{errors.titulo.message}</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Ação</Label>
          <Select
            value={watchedAcao}
            onValueChange={(v) =>
              setValue(`passos.${index}.acao`, v as CrmCadenciaAcao, {
                shouldTouch: true,
              })
            }
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCIA_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {CRM_CADENCIA_ACTION_LABEL[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`passo-${index}-delay`}>Delay (dias)</Label>
          <Input
            id={`passo-${index}-delay`}
            type="number"
            min={0}
            max={365}
            placeholder="0"
            aria-invalid={Boolean(errors?.delayDias)}
            {...register(`passos.${index}.delayDias` as const, {
              valueAsNumber: true,
            })}
            className="bg-secondary border-border"
          />
          {errors?.delayDias && (
            <p className="text-xs text-gym-danger">
              {errors.delayDias.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`passo-${index}-template`}>
          Template de mensagem/email (opcional)
        </Label>
        <Input
          id={`passo-${index}-template`}
          {...register(`passos.${index}.template` as const)}
          placeholder="Ex: PROSPECT_FOLLOWUP"
          className="bg-secondary border-border"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id={`passo-${index}-automatica`}
          checked={watchedAutomatica}
          onCheckedChange={(v) =>
            setValue(`passos.${index}.automatica`, v, { shouldTouch: true })
          }
        />
        <Label
          htmlFor={`passo-${index}-automatica`}
          className="cursor-pointer text-sm"
        >
          Executar automaticamente
        </Label>
      </div>
    </div>
  );
}
