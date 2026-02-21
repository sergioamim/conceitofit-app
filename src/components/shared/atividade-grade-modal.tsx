"use client";

import { useEffect, useState } from "react";
import type { Atividade, AtividadeGrade, DiaSemana } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

export interface AtividadeGradeForm {
  atividadeId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  capacidade: string;
  local: string;
  instrutor: string;
}

export function AtividadeGradeModal({
  open,
  onClose,
  onSave,
  atividades,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AtividadeGradeForm, id?: string) => void;
  atividades: Atividade[];
  initial?: AtividadeGrade | null;
}) {
  const [form, setForm] = useState<AtividadeGradeForm>({
    atividadeId: "",
    diaSemana: "SEG",
    horaInicio: "",
    horaFim: "",
    capacidade: "20",
    local: "",
    instrutor: "",
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        atividadeId: initial.atividadeId,
        diaSemana: initial.diaSemana,
        horaInicio: initial.horaInicio,
        horaFim: initial.horaFim,
        capacidade: String(initial.capacidade),
        local: initial.local ?? "",
        instrutor: initial.instrutor ?? "",
      });
      return;
    }

    setForm({
      atividadeId: atividades[0]?.id ?? "",
      diaSemana: "SEG",
      horaInicio: "",
      horaFim: "",
      capacidade: "20",
      local: "",
      instrutor: "",
    });
  }, [initial, open, atividades]);

  function set<K extends keyof AtividadeGradeForm>(key: K, value: AtividadeGradeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.atividadeId || !form.horaInicio || !form.horaFim || !form.capacidade) return;
    onSave(form, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Grade" : "Nova Grade de Atividade"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atividade *
              </label>
              <Select value={form.atividadeId} onValueChange={(v) => set("atividadeId", v)}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {atividades.filter((a) => a.ativo).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dia da semana *
              </label>
              <Select value={form.diaSemana} onValueChange={(v) => set("diaSemana", v as DiaSemana)}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(DIA_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Início *
              </label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(e) => set("horaInicio", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fim *
              </label>
              <Input
                type="time"
                value={form.horaFim}
                onChange={(e) => set("horaFim", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Capacidade *
              </label>
              <Input
                type="number"
                min={1}
                value={form.capacidade}
                onChange={(e) => set("capacidade", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Local
              </label>
              <Input
                placeholder="Ex: Sala Bike 1"
                value={form.local}
                onChange={(e) => set("local", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Instrutor
              </label>
              <Input
                placeholder="Ex: Larissa Costa"
                value={form.instrutor}
                onChange={(e) => set("instrutor", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
