"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Exercicio, GrupoMuscular } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ExercicioForm = Omit<Exercicio, "id" | "tenantId" | "criadoEm" | "atualizadoEm"> & {
  id?: Exercicio["id"];
};

const EMPTY_FORM: ExercicioForm = {
  nome: "",
  ativo: true,
};

function toFormState(initial?: Exercicio | null): ExercicioForm {
  if (!initial) return EMPTY_FORM;
  return {
    id: initial.id,
    nome: initial.nome,
    grupoMuscularId: initial.grupoMuscularId,
    grupoMuscular: initial.grupoMuscular,
    grupoMuscularNome: initial.grupoMuscularNome,
    equipamento: initial.equipamento,
    descricao: initial.descricao,
    videoUrl: initial.videoUrl,
    unidade: initial.unidade,
    ativo: initial.ativo,
  };
}

export function ExercicioModal({
  open,
  onClose,
  onSave,
  gruposMusculares,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExercicioForm) => Promise<void>;
  gruposMusculares: GrupoMuscular[];
  initial?: Exercicio | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExercicioForm>({
    mode: "onTouched",
    defaultValues: toFormState(initial),
  });

  const watchedNome = useWatch({ control, name: "nome" });
  const canSave = Boolean(watchedNome?.trim());

  useEffect(() => {
    reset(toFormState(initial));
  }, [initial, open, reset]);

  async function handleSave(values: ExercicioForm) {
    const nome = values.nome.trim();
    if (!nome) return;
    const grupo = gruposMusculares.find((item) => item.id === values.grupoMuscularId);
    await onSave({
      ...values,
      nome,
      grupoMuscularId: grupo?.id,
      grupoMuscular: grupo?.nome,
      grupoMuscularNome: grupo?.nome,
      equipamento: values.equipamento?.trim() || undefined,
      descricao: values.descricao?.trim() || undefined,
      videoUrl: values.videoUrl?.trim() || undefined,
      unidade: values.unidade?.trim() || undefined,
      ativo: values.ativo ?? true,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial?.id ? "Editar exercício" : "Novo exercício"}
          </DialogTitle>
          <DialogDescription>
            Cadastre exercícios referenciando o grupo muscular canônico do catálogo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exercicio-nome">
                Nome <span className="text-gym-danger">*</span>
              </Label>
              <Input
                id="exercicio-nome"
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome do exercício." })}
                aria-invalid={errors.nome ? "true" : "false"}
                className={cn(errors.nome && "border-gym-danger")}
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exercicio-grupo">Grupo muscular</Label>
                <Controller
                  control={control}
                  name="grupoMuscularId"
                  render={({ field }) => (
                    <select
                      id="exercicio-grupo"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || undefined)}
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                    >
                      <option value="">Sem grupo</option>
                      {gruposMusculares.map((grupo) => (
                        <option key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exercicio-equipamento">Equipamento</Label>
                <Input id="exercicio-equipamento" {...register("equipamento")} placeholder="Ex.: Halter, banco, barra" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exercicio-video">Vídeo / referência</Label>
                <Input id="exercicio-video" {...register("videoUrl")} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exercicio-unidade">Unidade da carga</Label>
                <Input id="exercicio-unidade" {...register("unidade")} placeholder="kg, repetições, segundos..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exercicio-descricao">Descrição</Label>
              <Textarea id="exercicio-descricao" {...register("descricao")} className="min-h-20" />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("ativo")} />
              Exercício ativo
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSave}>
              {initial?.id ? "Salvar exercício" : "Criar exercício"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
