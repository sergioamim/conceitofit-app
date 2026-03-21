"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Convenio, Plano } from "@/lib/types";
import { convenioFormSchema } from "@/lib/forms/administrativo-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConvenioFormValues = {
  nome: string;
  descontoPercentual: string;
  ativo: boolean;
  planoIds: string[];
  observacoes: string;
};

const DEFAULT_VALUES: ConvenioFormValues = {
  nome: "",
  descontoPercentual: "0",
  ativo: true,
  planoIds: [],
  observacoes: "",
};

function toFormValues(initial?: Convenio | null): ConvenioFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    descontoPercentual: String(initial.descontoPercentual ?? 0),
    ativo: initial.ativo,
    planoIds: initial.planoIds ?? [],
    observacoes: initial.observacoes ?? "",
  };
}

export function ConvenioModal({
  open,
  onClose,
  onSave,
  planos,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Convenio, "id">, id?: string) => void;
  planos: Plano[];
  initial?: Convenio | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ConvenioFormValues>({
    resolver: zodResolver(convenioFormSchema),
    defaultValues: toFormValues(initial),
  });
  const planoIds = useWatch({ control, name: "planoIds" }) ?? [];

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function togglePlano(id: string) {
    const nextPlanoIds = planoIds.includes(id) ? planoIds.filter((item) => item !== id) : [...planoIds, id];
    setValue("planoIds", nextPlanoIds, { shouldDirty: true });
  }

  function handleSave(values: ConvenioFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        ativo: values.ativo,
        descontoPercentual: Number.parseFloat(values.descontoPercentual) || 0,
        planoIds: values.planoIds.length ? values.planoIds : undefined,
        observacoes: values.observacoes.trim() || undefined,
      },
      initial?.id
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar convênio" : "Novo convênio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                {...register("nome")}
                className="border-border bg-secondary"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desconto (%)</label>
                <Input type="number" min={0} step="0.01" {...register("descontoPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("ativo")} />
                  <span className="text-muted-foreground">Disponível para renovação</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Planos elegíveis</p>
              <p className="text-xs text-muted-foreground">Se nenhum for selecionado, o convênio vale para todos</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {planos.map((plano) => (
                  <button
                    key={plano.id}
                    type="button"
                    onClick={() => togglePlano(plano.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                      planoIds.includes(plano.id)
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {plano.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input {...register("observacoes")} className="border-border bg-secondary" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
