"use client";

import { useEffect, useState } from "react";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HoverPopover } from "@/components/shared/hover-popover";

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
    valor: "",
    agendavel: true,
    permiteAcessoCatraca: false,
    permiteVoucher: false,
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        sessoes: initial.sessoes ? String(initial.sessoes) : "",
        valor: initial.valor ? String(initial.valor) : "",
        agendavel: initial.agendavel,
        permiteAcessoCatraca: initial.permiteAcessoCatraca,
        permiteVoucher: initial.permiteVoucher,
        ativo: initial.ativo,
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        sessoes: "",
        valor: "",
        agendavel: true,
        permiteAcessoCatraca: false,
        permiteVoucher: false,
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
        valor: form.valor ? Math.max(0, parseFloat(form.valor)) : 0,
        agendavel: form.agendavel,
        permiteAcessoCatraca: form.permiteAcessoCatraca,
        permiteVoucher: form.permiteVoucher,
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor (R$)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.valor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite agendamento?
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.agendavel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agendavel: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Agendável</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite acesso catraca?
                <HoverPopover
                  content="Quando ativo, o acesso na catraca será consumido pela quantidade de sessões do serviço."
                  side="top"
                >
                  <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                    ?
                  </span>
                </HoverPopover>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteAcessoCatraca}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permiteAcessoCatraca: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Controlar acesso por sessões</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite aplicar voucher?
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteVoucher}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permiteVoucher: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Aplicável em campanhas e vouchers</span>
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
