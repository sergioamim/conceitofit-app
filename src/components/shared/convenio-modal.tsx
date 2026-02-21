"use client";

import { useEffect, useState } from "react";
import type { Convenio, Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ConvenioModal({
  open,
  onClose,
  onSave,
  planos,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Convenio, "id">, id?: string) => void;
  planos: Plano[];
  initial?: Convenio | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    descontoPercentual: "0",
    ativo: true,
    planoIds: [] as string[],
    observacoes: "",
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        descontoPercentual: String(initial.descontoPercentual ?? 0),
        ativo: initial.ativo,
        planoIds: initial.planoIds ?? [],
        observacoes: initial.observacoes ?? "",
      });
    } else {
      setForm({
        nome: "",
        descontoPercentual: "0",
        ativo: true,
        planoIds: [],
        observacoes: "",
      });
    }
  }, [initial, open]);

  function togglePlano(id: string) {
    setForm((f) => ({
      ...f,
      planoIds: f.planoIds.includes(id)
        ? f.planoIds.filter((p) => p !== id)
        : [...f.planoIds, id],
    }));
  }

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        ativo: form.ativo,
        descontoPercentual: parseFloat(form.descontoPercentual) || 0,
        planoIds: form.planoIds.length ? form.planoIds : undefined,
        observacoes: form.observacoes || undefined,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar convênio" : "Novo convênio"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desconto (%)</label>
              <Input type="number" min={0} step="0.01" value={form.descontoPercentual} onChange={(e) => setForm((f) => ({ ...f, descontoPercentual: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativo</label>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
                <span className="text-muted-foreground">Disponível para renovação</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Planos elegíveis</p>
            <p className="text-xs text-muted-foreground">Se nenhum for selecionado, o convênio vale para todos</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {planos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlano(p.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                    form.planoIds.includes(p.id)
                      ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
            <Input value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} className="bg-secondary border-border" />
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
