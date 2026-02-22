"use client";

import { useEffect, useState } from "react";
import type { Cargo, Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FuncionarioModal({
  open,
  onClose,
  onSave,
  cargos,
  onOpenCargoModal,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Funcionario, "id">, id?: string) => void;
  cargos: Cargo[];
  onOpenCargoModal: () => void;
  initial?: Funcionario | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    cargoId: "",
    ativo: true,
    podeMinistrarAulas: false,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        cargoId: initial.cargoId ?? "",
        ativo: initial.ativo,
        podeMinistrarAulas: initial.podeMinistrarAulas,
      });
    } else {
      setForm({
        nome: "",
        cargoId: cargos.find((c) => c.ativo)?.id ?? "",
        ativo: true,
        podeMinistrarAulas: false,
      });
    }
  }, [initial, open, cargos]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        cargoId: form.cargoId || undefined,
        ativo: form.ativo,
        podeMinistrarAulas: form.podeMinistrarAulas,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar funcionário" : "Novo funcionário"}
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
              Cargo
            </label>
            <div className="flex items-center gap-2">
              <Select value={form.cargoId || "NONE"} onValueChange={(v) => setForm((f) => ({ ...f, cargoId: v === "NONE" ? "" : v }))}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="NONE">Sem cargo</SelectItem>
                  {cargos.filter((c) => c.ativo).map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="border-border" onClick={onOpenCargoModal}>
                + Cargo
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Atuação em aulas
            </label>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.podeMinistrarAulas}
                onChange={(e) => setForm((f) => ({ ...f, podeMinistrarAulas: e.target.checked }))}
              />
              <span className="text-muted-foreground">Pode ministrar atividades/aulas</span>
            </div>
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
