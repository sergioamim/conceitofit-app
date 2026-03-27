"use client";

import { useState } from "react";
import { createSalaApi, deleteSalaApi, listSalasApi, toggleSalaApi, updateSalaApi } from "@/lib/api/administrativo";
import type { Sala } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { SalaModal } from "@/components/shared/sala-modal";
import { cn } from "@/lib/utils";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { PageError } from "@/components/shared/page-error";

export default function SalasPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sala | null>(null);

  const { items: salas, error, reload } = useCrudOperations<Sala>({
    listFn: () => listSalasApi(false),
    toggleFn: toggleSalaApi,
    deleteFn: deleteSalaApi,
  });

  async function handleSave(data: Omit<Sala, "id" | "tenantId">, id?: string) {
    const { ativo = true, ...payload } = data;

    if (id) {
      await updateSalaApi(id, payload);
      if (editing && editing.ativo !== ativo) {
        await toggleSalaApi(id);
      }
    } else {
      const created = await createSalaApi(payload);
      if (!ativo) {
        await toggleSalaApi(created.id);
      }
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleToggle(id: string) {
    await toggleSalaApi(id);
    await reload();
  }

  function handleDelete(id: string) {
    confirm("Remover esta sala?", async () => {
      await deleteSalaApi(id);
      await reload();
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <SalaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Salas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastro de locais para uso nas atividades da grade</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Nova sala</Button>
      </div>

      <PageError error={error} onRetry={reload} />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full" role="grid" aria-label="Tabela de salas cadastradas">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade padrão</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {salas.map((sala) => (
              <tr key={sala.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{sala.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sala.descricao ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sala.capacidadePadrao ?? "—"}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    aria-label={`Status: ${sala.ativo ? "Ativa" : "Inativa"}`}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      sala.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {sala.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(sala);
                          setModalOpen(true);
                        },
                      },
                      {
                        label: sala.ativo ? "Desativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(sala.id),
                      },
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => handleDelete(sala.id),
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
