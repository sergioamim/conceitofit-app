"use client";

import { useEffect, useState } from "react";
import type { Sala } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function SalaModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Sala, "id" | "tenantId">, id?: string) => void;
  initial?: Sala | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    capacidadePadrao: "",
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        capacidadePadrao: initial.capacidadePadrao ? String(initial.capacidadePadrao) : "",
        ativo: initial.ativo,
      });
      return;
    }
    setForm({
      nome: "",
      descricao: "",
      capacidadePadrao: "",
      ativo: true,
    });
  }, [initial, open]);

  function handleSave() {
    if (!form.nome.trim()) return;
    onSave(
      {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        capacidadePadrao: form.capacidadePadrao ? Math.max(1, parseInt(form.capacidadePadrao, 10) || 1) : undefined,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar sala" : "Nova sala"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade padrão</label>
            <Input
              type="number"
              min={1}
              value={form.capacidadePadrao}
              onChange={(e) => setForm((f) => ({ ...f, capacidadePadrao: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
            />
            Sala ativa
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
