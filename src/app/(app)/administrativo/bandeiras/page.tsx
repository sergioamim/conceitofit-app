"use client";

import { useState } from "react";
import {
  createBandeiraCartaoApi,
  deleteBandeiraCartaoApi,
  listBandeirasCartaoApi,
  toggleBandeiraCartaoApi,
  updateBandeiraCartaoApi,
} from "@/lib/api/cartoes";
import type { BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BandeiraCartaoModal } from "@/components/shared/bandeira-cartao-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { PageError } from "@/components/shared/page-error";

export default function BandeirasPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BandeiraCartao | null>(null);

  const { items: bandeiras, error, reload } = useCrudOperations<BandeiraCartao>({
    listFn: listBandeirasCartaoApi,
    toggleFn: toggleBandeiraCartaoApi,
    deleteFn: deleteBandeiraCartaoApi,
  });

  async function handleSave(data: Omit<BandeiraCartao, "id">, id?: string) {
    if (id) {
      await updateBandeiraCartaoApi({ id, ...data });
    } else {
      await createBandeiraCartaoApi(data);
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleToggle(id: string) {
    await toggleBandeiraCartaoApi(id);
    await reload();
  }

  function handleDelete(id: string) {
    confirm("Remover esta bandeira?", async () => {
      await deleteBandeiraCartaoApi(id);
      await reload();
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <BandeiraCartaoModal
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
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Bandeiras de Cartão
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Taxas e prazos por bandeira
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Nova bandeira</Button>
      </div>

      <PageError error={error} onRetry={reload} />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bandeira
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Repasse
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bandeiras.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{b.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {b.taxaPercentual}%
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {b.diasRepasse} dias
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      b.ativo
                        ? "bg-gym-teal/15 text-gym-teal"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(b);
                          setModalOpen(true);
                        },
                      },
                      {
                        label: b.ativo ? "Desativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(b.id),
                      },
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => handleDelete(b.id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {bandeiras.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma bandeira cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
