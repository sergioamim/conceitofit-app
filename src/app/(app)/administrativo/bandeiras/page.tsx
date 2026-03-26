"use client";

import { useEffect, useState } from "react";
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
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export default function BandeirasPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [bandeiras, setBandeiras] = useState<BandeiraCartao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BandeiraCartao | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await listBandeirasCartaoApi();
      setBandeiras(data);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
      setBandeiras([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function handleSave(data: Omit<BandeiraCartao, "id">, id?: string) {
    try {
      setError("");
      if (id) {
        await updateBandeiraCartaoApi({ id, ...data });
      } else {
        await createBandeiraCartaoApi(data);
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  async function handleToggle(id: string) {
    try {
      setError("");
      await toggleBandeiraCartaoApi(id);
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  function handleDelete(id: string) {
    confirm("Remover esta bandeira?", async () => {
      try {
        setError("");
        await deleteBandeiraCartaoApi(id);
        await load();
      } catch (submitError) {
        setError(normalizeErrorMessage(submitError));
      }
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

      {error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

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
