"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Cargo, Funcionario } from "@/lib/types";
import { funcionarioFormSchema } from "@/lib/forms/administrativo-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FuncionarioFormValues = {
  nome: string;
  cargoId: string;
  ativo: boolean;
  podeMinistrarAulas: boolean;
};

function buildDefaultValues(cargos: Cargo[], initial?: Funcionario | null): FuncionarioFormValues {
  if (initial) {
    return {
      nome: initial.nome,
      cargoId: initial.cargoId ?? "",
      ativo: initial.ativo,
      podeMinistrarAulas: initial.podeMinistrarAulas,
    };
  }
  return {
    nome: "",
    cargoId: cargos.find((cargo) => cargo.ativo)?.id ?? "",
    ativo: true,
    podeMinistrarAulas: false,
  };
}

export function FuncionarioModal({
  open,
  onClose,
  onSave,
  cargos,
  onOpenCargoModal,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Funcionario, "id">, id?: string) => void;
  cargos: Cargo[];
  onOpenCargoModal: () => void;
  initial?: Funcionario | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FuncionarioFormValues>({
    resolver: zodResolver(funcionarioFormSchema),
    defaultValues: buildDefaultValues(cargos, initial),
  });

  useEffect(() => {
    reset(buildDefaultValues(cargos, initial));
  }, [cargos, initial, open, reset]);

  function handleSave(values: FuncionarioFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    onSave(
      {
        nome,
        cargoId: values.cargoId || undefined,
        ativo: values.ativo,
        podeMinistrarAulas: values.podeMinistrarAulas,
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
            {initial ? "Editar funcionário" : "Novo funcionário"}
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</label>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="cargoId"
                  render={({ field }) => (
                    <Select value={field.value || "NONE"} onValueChange={(value) => field.onChange(value === "NONE" ? "" : value)}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="NONE">Sem cargo</SelectItem>
                        {cargos.filter((cargo) => cargo.ativo).map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button type="button" variant="outline" size="sm" className="border-border" onClick={onOpenCargoModal}>
                  + Cargo
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atuação em aulas</label>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("podeMinistrarAulas")} />
                <span className="text-muted-foreground">Pode ministrar atividades/aulas</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("ativo")} />
                <span className="text-muted-foreground">Disponível</span>
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
