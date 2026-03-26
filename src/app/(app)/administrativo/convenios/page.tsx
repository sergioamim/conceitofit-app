"use client";

import { useEffect, useState } from "react";
import {
  createConvenioApi,
  deleteConvenioApi,
  listConveniosApi,
  toggleConvenioApi,
  updateConvenioApi,
} from "@/lib/api/beneficios";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import { useTenantContext } from "@/hooks/use-session-context";
import type { Convenio, Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ConvenioModal } from "@/components/shared/convenio-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { cn } from "@/lib/utils";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export default function ConveniosPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { tenantId, tenantResolved } = useTenantContext();
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Convenio | null>(null);

  async function load() {
    if (!tenantId) return;
    const [cvs, pls] = await Promise.all([
      listConveniosApi(false),
      listPlanosApi({ tenantId, apenasAtivos: false }),
    ]);
    setConvenios(cvs);
    setPlanos(pls);
  }

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void Promise.all([
      listConveniosApi(false),
      listPlanosApi({ tenantId, apenasAtivos: false }),
    ]).then(([cvs, pls]) => {
      setConvenios(cvs);
      setPlanos(pls);
    });
  }, [tenantId, tenantResolved]);

  async function handleSave(data: Omit<Convenio, "id">, id?: string) {
    if (id) await updateConvenioApi(id, data);
    else await createConvenioApi(data);
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleToggle(id: string) {
    await toggleConvenioApi(id);
    await load();
  }

  function handleDelete(id: string) {
    confirm("Remover este convênio?", async () => {
      await deleteConvenioApi(id);
      await load();
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
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
        <Button onClick={() => setModalOpen(true)} disabled={!tenantResolved || !tenantId}>Novo convênio</Button>
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
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(c);
                          setModalOpen(true);
                        },
                      },
                      {
                        label: c.ativo ? "Desativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(c.id),
                      },
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => handleDelete(c.id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
