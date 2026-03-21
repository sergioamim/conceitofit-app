"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type BandeiraCartaoFormValues = {
  nome: string;
  taxaPercentual: string;
  diasRepasse: string;
  ativo: boolean;
};

const DEFAULT_VALUES: BandeiraCartaoFormValues = {
  nome: "",
  taxaPercentual: "0",
  diasRepasse: "30",
  ativo: true,
};

function toFormValues(initial?: BandeiraCartao | null): BandeiraCartaoFormValues {
  if (!initial) return DEFAULT_VALUES;
  return {
    nome: initial.nome,
    taxaPercentual: String(initial.taxaPercentual ?? 0),
    diasRepasse: String(initial.diasRepasse ?? 30),
    ativo: initial.ativo,
  };
}

export function BandeiraCartaoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<BandeiraCartao, "id">, id?: string) => void;
  initial?: BandeiraCartao | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BandeiraCartaoFormValues>({
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  function handleSave(values: BandeiraCartaoFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        taxaPercentual: Number.parseFloat(values.taxaPercentual) || 0,
        diasRepasse: Number.parseInt(values.diasRepasse, 10) || 0,
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
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar bandeira" : "Nova bandeira"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                {...register("nome", { validate: (value) => value.trim().length > 0 || "Informe o nome da bandeira." })}
                className="border-border bg-secondary"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Taxa (%)
                </label>
                <Input type="number" min={0} step="0.01" {...register("taxaPercentual")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dias para repasse
                </label>
                <Input type="number" min={0} step="1" {...register("diasRepasse")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("ativo")} />
                  <span className="text-muted-foreground">Disponível</span>
                </div>
              </div>
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
