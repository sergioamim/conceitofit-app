"use client";

import { useEffect, useState } from "react";
import type { Plano, Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<TipoPlano, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};

export interface PlanoForm {
  nome: string;
  descricao: string;
  tipo: TipoPlano;
  duracaoDias: string;
  valor: string;
  valorMatricula: string;
  atividades: string[];
  beneficios: string[];
  destaque: boolean;
  ordem: string;
}

export function PlanoModal({
  open,
  onClose,
  onSave,
  atividades,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PlanoForm, id?: string) => void;
  atividades: Atividade[];
  initial?: Plano;
}) {
  const [form, setForm] = useState<PlanoForm>({
    nome: "",
    descricao: "",
    tipo: "MENSAL",
    duracaoDias: "30",
    valor: "",
    valorMatricula: "0",
    atividades: [],
    beneficios: [],
    destaque: false,
    ordem: "",
  });
  const [beneficioInput, setBeneficioInput] = useState("");

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        tipo: initial.tipo,
        duracaoDias: String(initial.duracaoDias),
        valor: String(initial.valor),
        valorMatricula: String(initial.valorMatricula ?? 0),
        atividades: initial.atividades ?? [],
        beneficios: initial.beneficios ?? [],
        destaque: initial.destaque,
        ordem: initial.ordem ? String(initial.ordem) : "",
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        tipo: "MENSAL",
        duracaoDias: "30",
        valor: "",
        valorMatricula: "0",
        atividades: [],
        beneficios: [],
        destaque: false,
        ordem: "",
      });
    }
    setBeneficioInput("");
  }, [initial, open]);

  function set<K extends keyof PlanoForm>(key: K, value: PlanoForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAtividade(id: string) {
    setForm((f) => ({
      ...f,
      atividades: f.atividades.includes(id)
        ? f.atividades.filter((a) => a !== id)
        : [...f.atividades, id],
    }));
  }

  function addBeneficio() {
    if (!beneficioInput.trim()) return;
    setForm((f) => ({
      ...f,
      beneficios: [...f.beneficios, beneficioInput.trim()],
    }));
    setBeneficioInput("");
  }

  function removeBeneficio(idx: number) {
    setForm((f) => ({
      ...f,
      beneficios: f.beneficios.filter((_, i) => i !== idx),
    }));
  }

  function handleSave() {
    if (!form.nome || !form.valor || !form.duracaoDias) return;
    onSave(form, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Plano" : "Novo Plano"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-5 py-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                placeholder="Ex: Mensal Completo"
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
                placeholder="Descrição do plano"
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo *
                </label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => set("tipo", v as TipoPlano)}
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(TIPO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Duração (dias) *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracaoDias}
                  onChange={(e) => set("duracaoDias", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => set("valor", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Matrícula (R$)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valorMatricula}
                  onChange={(e) => set("valorMatricula", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Benefícios
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar benefício"
                  value={beneficioInput}
                  onChange={(e) => setBeneficioInput(e.target.value)}
                  className="bg-secondary border-border"
                />
                <Button onClick={addBeneficio} className="shrink-0">
                  Adicionar
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.beneficios.map((b, idx) => (
                  <span
                    key={`${b}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {b}
                    <button
                      onClick={() => removeBeneficio(idx)}
                      className="text-muted-foreground/60 hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Destaque
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={(e) => set("destaque", e.target.checked)}
                  />
                  <span className="text-muted-foreground">Plano em destaque</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ordem
                </label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => set("ordem", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Atividades incluídas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {atividades.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAtividade(a.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                    form.atividades.includes(a.id)
                      ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {a.nome}
                </button>
              ))}
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
