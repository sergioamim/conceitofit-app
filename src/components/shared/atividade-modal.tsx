"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Atividade, CategoriaAtividade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverPopover } from "@/components/shared/hover-popover";
import { ACTIVITY_ICON_OPTIONS } from "@/lib/icons/activity-icons";
import { ActivityIconChip } from "@/components/shared/activity-icon-chip";
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";

const CATEGORIA_LABEL: Record<CategoriaAtividade, string> = {
  MUSCULACAO: "Musculação",
  CARDIO: "Cardio",
  COLETIVA: "Coletiva",
  LUTA: "Luta",
  AQUATICA: "Aquática",
  OUTRA: "Outra",
};

const atividadeFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome da atividade."),
  descricao: optionalTrimmedString(),
  categoria: requiredTrimmedString("Selecione uma categoria."),
  icone: z.string(),
  cor: z.string(),
  permiteCheckin: z.boolean(),
  checkinObrigatorio: z.boolean(),
});

type AtividadeFormValues = z.infer<typeof atividadeFormSchema>;

export interface AtividadeForm {
  nome: string;
  descricao: string;
  categoria: CategoriaAtividade;
  icone: string;
  cor: string;
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
}

const DEFAULT_VALUES: AtividadeFormValues = {
  nome: "",
  descricao: "",
  categoria: "MUSCULACAO",
  icone: "",
  cor: "#3de8a0",
  permiteCheckin: true,
  checkinObrigatorio: false,
};

function toFormValues(initial?: Atividade): AtividadeFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    descricao: initial.descricao ?? "",
    categoria: initial.categoria,
    icone: initial.icone ?? "",
    cor: initial.cor ?? "#3de8a0",
    permiteCheckin: initial.permiteCheckin,
    checkinObrigatorio: initial.checkinObrigatorio,
  };
}

export function AtividadeModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AtividadeForm, id?: string) => void;
  initial?: Atividade;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AtividadeFormValues>({
    resolver: zodResolver(atividadeFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(initial),
  });

  const canSave = Boolean(watch("nome")?.trim()) && Boolean(watch("categoria")?.trim());

  const [iconSearch, setIconSearch] = useState("");

  const icone = watch("icone");
  const cor = watch("cor");
  const permiteCheckin = watch("permiteCheckin");

  useEffect(() => {
    reset(toFormValues(initial));
    setIconSearch(initial?.icone ?? "");
  }, [initial, open, reset]);

  function handleSave(values: AtividadeFormValues) {
    onSave(
      {
        nome: values.nome,
        descricao: values.descricao ?? "",
        categoria: values.categoria as CategoriaAtividade,
        icone: values.icone,
        cor: values.cor,
        permiteCheckin: values.permiteCheckin,
        checkinObrigatorio: values.checkinObrigatorio,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {initial ? "Editar Atividade" : "Nova Atividade"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                placeholder="Ex: Musculação"
                {...register("nome")}
                className="bg-secondary border-border"
              />
              {errors.nome ? (
                <p className="text-xs text-gym-danger">{errors.nome.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <Input
                placeholder="Descrição breve"
                {...register("descricao")}
                className="bg-secondary border-border"
              />
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Configuração de Check-in
              </p>
              <div className="mt-2 grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register("permiteCheckin", {
                      onChange: (e) => {
                        if (!e.target.checked) {
                          setValue("checkinObrigatorio", false);
                        }
                      },
                    })}
                  />
                  <span className="text-muted-foreground">Permitir check-in para clientes</span>
                  <HoverPopover content="Quando ativo, os clientes podem registrar presença nessa atividade.">
                    <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                      ?
                    </span>
                  </HoverPopover>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={!permiteCheckin}
                    {...register("checkinObrigatorio")}
                  />
                  <span className="text-muted-foreground">Check-in obrigatório para participar</span>
                  <HoverPopover content="Quando obrigatório, a atividade só conta presença com check-in efetuado.">
                    <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                      ?
                    </span>
                  </HoverPopover>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Categoria *
                </label>
                <Controller
                  control={control}
                  name="categoria"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoria ? (
                  <p className="text-xs text-gym-danger">{errors.categoria.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ícone
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-border bg-secondary p-2">
                    <ActivityIconChip icone={icone} cor={cor} className="size-9" />
                    <Input
                      placeholder="Buscar ícone (ex: shield) ou emoji"
                      value={iconSearch || icone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setIconSearch(value);
                        setValue("icone", value);
                      }}
                      className="h-8 border-border bg-background"
                    />
                  </div>
                  <div className="max-h-28 overflow-auto rounded-md border border-border bg-secondary/20 p-1">
                    {ACTIVITY_ICON_OPTIONS.filter((item) => {
                      if (!iconSearch.trim()) return true;
                      const q = iconSearch.trim().toLowerCase();
                      return item.value.includes(q) || item.label.toLowerCase().includes(q);
                    }).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setValue("icone", item.value);
                            setIconSearch(item.value);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                          <span className="ml-auto text-[10px] opacity-70">{item.value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cor
                </label>
                <Input
                  type="color"
                  {...register("cor")}
                  className="h-10 bg-secondary border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
