"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Exercicio } from "@/lib/types";

export type ExercicioForm = Omit<Exercicio, "id" | "tenantId" | "ativo" | "criadoEm" | "atualizadoEm"> & {
  ativo?: boolean;
};

export function ExercicioModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExercicioForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ExercicioForm>({
    nome: "",
    ativo: true,
  });

  async function handleSave() {
    if (!form.nome.trim()) return;
    await onSave({
      ...form,
      nome: form.nome.trim(),
      grupoMuscular: form.grupoMuscular?.trim() || undefined,
      equipamento: form.equipamento?.trim() || undefined,
      descricao: form.descricao?.trim() || undefined,
      ativo: form.ativo ?? true,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Novo exercício</DialogTitle>
          <DialogDescription>
            Cadastre exercícios para compor os treinos dos alunos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
            <Input
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grupo muscular</label>
              <Input
                value={form.grupoMuscular || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, grupoMuscular: event.target.value }))
                }
                className="bg-secondary border-border"
                placeholder="Ex.: Peitoral, Posterior, Core..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Equipamento</label>
              <Input
                value={form.equipamento || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, equipamento: event.target.value }))
                }
                className="bg-secondary border-border"
                placeholder="Ex.: Halter, Kettlebell..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
            <textarea
              value={form.descricao || ""}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              className="min-h-20 rounded-md border border-border bg-secondary p-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.ativo ?? true}
              onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
            />
            Exercício ativo
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button onClick={handleSave}>Salvar exercício</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
