"use client";

import { useEffect, useState } from "react";
import type { Atividade, CategoriaAtividade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverPopover } from "@/components/shared/hover-popover";
import { ACTIVITY_ICON_OPTIONS } from "@/lib/icons/activity-icons";
import { ActivityIconChip } from "@/components/shared/activity-icon-chip";

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
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
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
    permiteCheckin: true,
    checkinObrigatorio: false,
  });
  const [iconSearch, setIconSearch] = useState("");

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        categoria: initial.categoria,
        icone: initial.icone ?? "",
        cor: initial.cor ?? "#3de8a0",
        permiteCheckin: initial.permiteCheckin,
        checkinObrigatorio: initial.checkinObrigatorio,
      });
      setIconSearch(initial.icone ?? "");
    } else {
      setForm({
        nome: "",
        descricao: "",
        categoria: "MUSCULACAO",
        icone: "",
        cor: "#3de8a0",
        permiteCheckin: true,
        checkinObrigatorio: false,
      });
      setIconSearch("");
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
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
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
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Configuração de Check-in
            </p>
            <div className="mt-2 grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteCheckin}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      permiteCheckin: e.target.checked,
                      checkinObrigatorio: e.target.checked ? f.checkinObrigatorio : false,
                    }))
                  }
                />
                <span className="text-muted-foreground">Permitir check-in para clientes</span>
                <HoverPopover content="Quando ativo, os clientes podem registrar presença nessa atividade.">
                  <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                    ?
                  </span>
                </HoverPopover>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.checkinObrigatorio}
                  disabled={!form.permiteCheckin}
                  onChange={(e) => set("checkinObrigatorio", e.target.checked)}
                />
                <span className="text-muted-foreground">Check-in obrigatório para participar</span>
                <HoverPopover content="Quando obrigatório, a atividade só conta presença com check-in efetuado.">
                  <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                    ?
                  </span>
                </HoverPopover>
              </label>
            </div>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-secondary p-2">
                  <ActivityIconChip icone={form.icone} cor={form.cor} className="size-9" />
                  <Input
                    placeholder="Buscar ícone (ex: shield) ou emoji"
                    value={iconSearch || form.icone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setIconSearch(value);
                      set("icone", value);
                    }}
                    className="h-8 border-border bg-background"
                  />
                </div>
                <div className="max-h-28 overflow-auto rounded-md border border-border bg-secondary/20 p-1">
                  {ACTIVITY_ICON_OPTIONS.filter((item) => {
                    if (!iconSearch.trim()) return true;
                    const q = iconSearch.trim().toLowerCase();
                    return item.value.includes(q) || item.label.toLowerCase().includes(q);
                  }).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          set("icone", item.value);
                          setIconSearch(item.value);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        <span className="ml-auto text-[10px] opacity-70">{item.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
