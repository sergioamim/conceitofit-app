"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { zodResolver } from "@/lib/forms/zod-resolver";
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
import {
  putAgregadorVinculo,
  type AgregadorVinculoResponse,
} from "@/lib/api/agregadores-vinculos";

import {
  AGREGADOR_VINCULO_STATUS_LABEL,
  AGREGADOR_VINCULO_STATUS_VALUES,
  editarAgregadorVinculoSchema,
  type EditarAgregadorVinculoForm,
} from "./editar-agregador-vinculo-modal.schema";
import { AGREGADOR_TIPO_LABEL } from "./vincular-agregador-modal.schema";

export interface EditarAgregadorVinculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  vinculo: AgregadorVinculoResponse | null;
  onSuccess?: (vinculo: AgregadorVinculoResponse) => void;
}

const DEFAULT_VALUES: EditarAgregadorVinculoForm = {
  usuarioExternoId: "",
  customCode: "",
  status: "ATIVO",
  dataInicio: "",
  dataFim: "",
};

export function EditarAgregadorVinculoModal({
  open,
  onOpenChange,
  tenantId,
  vinculo,
  onSuccess,
}: EditarAgregadorVinculoModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditarAgregadorVinculoForm>({
    resolver: zodResolver(editarAgregadorVinculoSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const status = watch("status");
  const dataFim = watch("dataFim");

  useEffect(() => {
    if (!open || !vinculo) {
      return;
    }
    reset({
      usuarioExternoId: vinculo.usuarioExternoId,
      customCode: vinculo.customCode ?? "",
      status: vinculo.status,
      dataInicio: vinculo.dataInicio,
      dataFim: vinculo.dataFim ?? "",
    });
  }, [open, reset, vinculo]);

  useEffect(() => {
    if (status === "ATIVO" && dataFim) {
      setValue("dataFim", "");
    }
  }, [dataFim, setValue, status]);

  async function onSubmit(values: EditarAgregadorVinculoForm) {
    if (!vinculo?.id || !tenantId) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await putAgregadorVinculo({
        tenantId,
        vinculoId: vinculo.id,
        usuarioExternoId: values.usuarioExternoId.trim(),
        customCode: values.customCode?.trim() || undefined,
        status: values.status,
        dataInicio: values.dataInicio,
        dataFim: values.status === "ATIVO" ? undefined : values.dataFim?.trim() || undefined,
      });
      toast({
        title: values.status === "ATIVO" ? "Vínculo atualizado" : "Vínculo atualizado e acesso revisto",
        description: `${AGREGADOR_TIPO_LABEL[vinculo.agregador]} · ${values.usuarioExternoId.trim()}`,
      });
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao atualizar vínculo.";
      toast({
        title: "Erro ao atualizar vínculo",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const canSave =
    Boolean(vinculo?.id) &&
    Boolean(watch("usuarioExternoId")?.trim()) &&
    Boolean(watch("dataInicio")) &&
    (status === "ATIVO" || Boolean(dataFim?.trim()));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar vínculo do agregador</DialogTitle>
          <DialogDescription>
            {vinculo ? `Atualize o vínculo ${AGREGADOR_TIPO_LABEL[vinculo.agregador]}.` : "Vínculo não carregado."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Tipo de agregador</Label>
            <Input value={vinculo ? AGREGADOR_TIPO_LABEL[vinculo.agregador] : ""} disabled readOnly />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editar-agregador-usuario-externo">
              ID externo do usuário <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editar-agregador-usuario-externo"
              autoComplete="off"
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
            <Label htmlFor="editar-agregador-custom-code">Código customizado</Label>
            <Input
              id="editar-agregador-custom-code"
              autoComplete="off"
              placeholder="Opcional"
              aria-invalid={errors.customCode ? true : undefined}
              {...register("customCode")}
            />
            {errors.customCode?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.customCode.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editar-agregador-status">
              Status do vínculo <span className="text-destructive">*</span>
            </Label>
            <Select value={status} onValueChange={(value) => setValue("status", value as EditarAgregadorVinculoForm["status"])}>
              <SelectTrigger id="editar-agregador-status" aria-label="Status do vínculo" aria-invalid={errors.status ? true : undefined}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {AGREGADOR_VINCULO_STATUS_VALUES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {AGREGADOR_VINCULO_STATUS_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.status.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="editar-agregador-data-inicio">
                Data de início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editar-agregador-data-inicio"
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
              <Label htmlFor="editar-agregador-data-fim">
                Data de fim {status !== "ATIVO" ? <span className="text-destructive">*</span> : null}
              </Label>
              <Input
                id="editar-agregador-data-fim"
                type="date"
                disabled={status === "ATIVO"}
                aria-invalid={errors.dataFim ? true : undefined}
                {...register("dataFim")}
              />
              {errors.dataFim?.message ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.dataFim.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !canSave}>
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar vínculo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
