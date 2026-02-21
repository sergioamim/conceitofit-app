"use client";

import { useEffect, useState } from "react";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ServicoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Servico, "id" | "tenantId">, id?: string) => void;
  initial?: Servico | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    sessoes: "",
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        sessoes: initial.sessoes ? String(initial.sessoes) : "",
        ativo: initial.ativo,
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        sessoes: "",
        ativo: true,
      });
    }
  }, [initial, open]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        descricao: form.descricao || undefined,
        sessoes: form.sessoes ? Math.max(1, parseInt(form.sessoes, 10)) : undefined,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome *
            </label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sessões
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                value={form.sessoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sessoes: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ativo
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ativo: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Disponível</span>
              </div>
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
