"use client";

import { useEffect, useState } from "react";
import {
  listConvenios,
  createConvenio,
  updateConvenio,
  toggleConvenio,
  deleteConvenio,
  listPlanos,
} from "@/lib/mock/services";
import type { Convenio, Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function ConvenioModal({
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

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Convenio | null>(null);

  async function load() {
    const [cvs, pls] = await Promise.all([listConvenios(), listPlanos()]);
    setConvenios(cvs);
    setPlanos(pls);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(data: Omit<Convenio, "id">, id?: string) {
    if (id) await updateConvenio(id, data);
    else await createConvenio(data);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleToggle(id: string) {
    await toggleConvenio(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este convênio?") ) return;
    await deleteConvenio(id);
    load();
  }

  return (
    <div className="space-y-6">
      <ConvenioModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        planos={planos}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Convênios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Descontos por plano ou grupo</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo convênio</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Convênio</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desconto</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planos</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {convenios.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{c.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.descontoPercentual}%</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {c.planoIds && c.planoIds.length > 0 ? `${c.planoIds.length} planos` : "Todos"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    c.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground"
                  )}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(c); setModalOpen(true); }} className="h-7 text-xs">Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(c.id)} className="h-7 text-xs">{c.ativo ? "Desativar" : "Ativar"}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)} className="h-7 text-xs border-gym-danger/30 text-gym-danger hover:border-gym-danger/60">Remover</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
