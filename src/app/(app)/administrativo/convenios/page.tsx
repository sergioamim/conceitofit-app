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
import { ConvenioModal } from "@/components/shared/convenio-modal";

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
