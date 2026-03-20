"use client";

import { useEffect, useState } from "react";
import { createSalaApi, deleteSalaApi, listSalasApi, toggleSalaApi, updateSalaApi } from "@/lib/api/administrativo";
import type { Sala } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { SalaModal } from "@/components/shared/sala-modal";
import { cn } from "@/lib/utils";

export default function SalasPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sala | null>(null);

  async function load() {
    const data = await listSalasApi(false);
    setSalas(data);
  }

  useEffect(() => {
    void listSalasApi(false).then(setSalas);
  }, []);

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
    await load();
  }

  async function handleToggle(id: string) {
    await toggleSalaApi(id);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta sala?")) return;
    await deleteSalaApi(id);
    await load();
  }

  return (
    <div className="space-y-6">
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

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade padrão</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
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
