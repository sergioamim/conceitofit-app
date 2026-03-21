"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Sala } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type SalaFormValues = {
  nome: string;
  descricao: string;
  capacidadePadrao: string;
  ativo: boolean;
};

const DEFAULT_VALUES: SalaFormValues = {
  nome: "",
  descricao: "",
  capacidadePadrao: "",
  ativo: true,
};

function toFormValues(initial?: Sala | null): SalaFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    descricao: initial.descricao ?? "",
    capacidadePadrao: initial.capacidadePadrao ? String(initial.capacidadePadrao) : "",
    ativo: initial.ativo,
  };
}

export function SalaModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Sala, "id" | "tenantId">, id?: string) => void;
  initial?: Sala | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalaFormValues>({
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function handleSave(values: SalaFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        descricao: values.descricao.trim() || undefined,
        capacidadePadrao: values.capacidadePadrao
          ? Math.max(1, Number.parseInt(values.capacidadePadrao, 10) || 1)
          : undefined,
        ativo: values.ativo,
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
      <DialogContent className="border-border bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar sala" : "Nova sala"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome da sala." })}
                className="border-border bg-secondary"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input {...register("descricao")} className="border-border bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade padrão</label>
              <Input type="number" min={1} {...register("capacidadePadrao")} className="border-border bg-secondary" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("ativo")} />
              Sala ativa
            </label>
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
