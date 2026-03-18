"use client";

import { useEffect, useState } from "react";
import type { BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function BandeiraCartaoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<BandeiraCartao, "id">, id?: string) => void;
  initial?: BandeiraCartao | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    taxaPercentual: "0",
    diasRepasse: "30",
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        taxaPercentual: String(initial.taxaPercentual ?? 0),
        diasRepasse: String(initial.diasRepasse ?? 30),
        ativo: initial.ativo,
      });
    } else {
      setForm({
        nome: "",
        taxaPercentual: "0",
        diasRepasse: "30",
        ativo: true,
      });
    }
  }, [initial, open]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        taxaPercentual: parseFloat(form.taxaPercentual) || 0,
        diasRepasse: parseInt(form.diasRepasse, 10) || 0,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar bandeira" : "Nova bandeira"}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa (%)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.taxaPercentual}
                onChange={(e) => setForm((f) => ({ ...f, taxaPercentual: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dias para repasse
              </label>
              <Input
                type="number"
                min={0}
                step="1"
                value={form.diasRepasse}
                onChange={(e) => setForm((f) => ({ ...f, diasRepasse: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
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
