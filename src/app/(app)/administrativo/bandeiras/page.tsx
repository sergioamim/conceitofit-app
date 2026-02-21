"use client";

import { useEffect, useState } from "react";
import {
  listBandeirasCartao,
  createBandeiraCartao,
  updateBandeiraCartao,
  toggleBandeiraCartao,
  deleteBandeiraCartao,
} from "@/lib/mock/services";
import type { BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BandeiraCartaoModal } from "@/components/shared/bandeira-cartao-modal";

export default function BandeirasPage() {
  const [bandeiras, setBandeiras] = useState<BandeiraCartao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BandeiraCartao | null>(null);

  async function load() {
    const data = await listBandeirasCartao();
    setBandeiras(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(data: Omit<BandeiraCartao, "id">, id?: string) {
    if (id) await updateBandeiraCartao(id, data);
    else await createBandeiraCartao(data);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleToggle(id: string) {
    await toggleBandeiraCartao(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta bandeira?")) return;
    await deleteBandeiraCartao(id);
    load();
  }

  return (
    <div className="space-y-6">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(b);
                        setModalOpen(true);
                      }}
                      className="border-border"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(b.id)}
                      className="border-border"
                    >
                      {b.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      className="border-border text-gym-danger hover:text-gym-danger"
                    >
                      Remover
                    </Button>
                  </div>
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
