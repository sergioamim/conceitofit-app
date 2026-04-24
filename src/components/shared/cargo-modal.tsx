"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Cargo } from "@/lib/types";
import { cargoFormSchema } from "@/lib/tenant/forms/administrativo-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type CargoFormValues = {
  nome: string;
  ativo: boolean;
};

const DEFAULT_VALUES: CargoFormValues = {
  nome: "",
  ativo: true,
};

function toFormValues(initial?: Cargo | null): CargoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    ativo: initial.ativo,
  };
}

export function CargoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cargo, "id" | "tenantId">, id?: string) => void;
  initial?: Cargo | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CargoFormValues>({
    resolver: zodResolver(cargoFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(initial),
  });

  const canSave = Boolean(watch("nome")?.trim());

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function handleSave(values: CargoFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave({ nome, ativo: values.ativo }, initial?.id);
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
            {initial ? "Editar cargo" : "Novo cargo"}
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
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("ativo")} />
              Cargo ativo
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
