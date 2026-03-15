"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Exercicio, GrupoMuscular } from "@/lib/types";

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
  const [form, setForm] = useState<ExercicioForm>(() => toFormState(initial));

  async function handleSave() {
    if (!form.nome.trim()) return;
    const grupo = gruposMusculares.find((item) => item.id === form.grupoMuscularId);
    await onSave({
      ...form,
      nome: form.nome.trim(),
      grupoMuscularId: grupo?.id,
      grupoMuscular: grupo?.nome,
      grupoMuscularNome: grupo?.nome,
      equipamento: form.equipamento?.trim() || undefined,
      descricao: form.descricao?.trim() || undefined,
      videoUrl: form.videoUrl?.trim() || undefined,
      unidade: form.unidade?.trim() || undefined,
      ativo: form.ativo ?? true,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {form.id ? "Editar exercício" : "Novo exercício"}
          </DialogTitle>
          <DialogDescription>
            Cadastre exercícios referenciando o grupo muscular canônico do catálogo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="exercicio-nome">Nome *</Label>
            <Input
              id="exercicio-nome"
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exercicio-grupo">Grupo muscular</Label>
              <select
                id="exercicio-grupo"
                value={form.grupoMuscularId ?? ""}
                onChange={(event) => {
                  const grupo = gruposMusculares.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    grupoMuscularId: grupo?.id,
                    grupoMuscular: grupo?.nome,
                    grupoMuscularNome: grupo?.nome,
                  }));
                }}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="">Sem grupo</option>
                {gruposMusculares.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exercicio-equipamento">Equipamento</Label>
              <Input
                id="exercicio-equipamento"
                value={form.equipamento || ""}
                onChange={(event) => setForm((current) => ({ ...current, equipamento: event.target.value }))}
                placeholder="Ex.: Halter, banco, barra"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exercicio-video">Vídeo / referência</Label>
              <Input
                id="exercicio-video"
                value={form.videoUrl || ""}
                onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exercicio-unidade">Unidade da carga</Label>
              <Input
                id="exercicio-unidade"
                value={form.unidade || ""}
                onChange={(event) => setForm((current) => ({ ...current, unidade: event.target.value }))}
                placeholder="kg, repetições, segundos..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exercicio-descricao">Descrição</Label>
            <Textarea
              id="exercicio-descricao"
              value={form.descricao || ""}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              className="min-h-20"
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
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>{form.id ? "Salvar exercício" : "Criar exercício"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
