"use client";

import { useEffect, useState } from "react";
import type { Atividade, CategoriaAtividade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIA_LABEL: Record<CategoriaAtividade, string> = {
  MUSCULACAO: "Musculação",
  CARDIO: "Cardio",
  COLETIVA: "Coletiva",
  LUTA: "Luta",
  AQUATICA: "Aquática",
  OUTRA: "Outra",
};

export interface AtividadeForm {
  nome: string;
  descricao: string;
  categoria: CategoriaAtividade;
  icone: string;
  cor: string;
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
  const [form, setForm] = useState<AtividadeForm>({
    nome: "",
    descricao: "",
    categoria: "MUSCULACAO",
    icone: "",
    cor: "#3de8a0",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        categoria: initial.categoria,
        icone: initial.icone ?? "",
        cor: initial.cor ?? "#3de8a0",
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        categoria: "MUSCULACAO",
        icone: "",
        cor: "#3de8a0",
      });
    }
  }, [initial, open]);

  function set<K extends keyof AtividadeForm>(key: K, value: AtividadeForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.nome) return;
    onSave(form, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Atividade" : "Nova Atividade"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome *
            </label>
            <Input
              placeholder="Ex: Musculação"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              placeholder="Descrição breve"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria *
              </label>
              <Select value={form.categoria} onValueChange={(v) => set("categoria", v as CategoriaAtividade)}>
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
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ícone
              </label>
              <Input
                placeholder="Ex: 💪"
                value={form.icone}
                onChange={(e) => set("icone", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cor
              </label>
              <Input
                type="color"
                value={form.cor}
                onChange={(e) => set("cor", e.target.value)}
                className="h-10 bg-secondary border-border"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
