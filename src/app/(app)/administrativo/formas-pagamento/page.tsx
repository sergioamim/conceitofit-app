"use client";

import { useEffect, useState } from "react";
import {
  createFormaPagamentoApi,
  deleteFormaPagamentoApi,
  listFormasPagamentoApi,
  toggleFormaPagamentoApi,
  updateFormaPagamentoApi,
} from "@/lib/api/formas-pagamento";
import { useTenantContext } from "@/hooks/use-session-context";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FormaPagamentoModal } from "@/components/shared/forma-pagamento-modal";

const TIPO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

export default function FormasPagamentoPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [ready, setReady] = useState(false);

  async function load() {
    if (!tenantId) return;
    const data = await listFormasPagamentoApi({ tenantId, apenasAtivas: false });
    setFormas(data);
  }

  useEffect(() => {
    setReady(true);
    if (!tenantResolved || !tenantId) return;
    void listFormasPagamentoApi({ tenantId, apenasAtivas: false }).then(setFormas);
  }, [tenantId, tenantResolved]);

  async function handleSave(
    data: Omit<FormaPagamento, "id" | "tenantId">,
    id?: string
  ) {
    if (!tenantId) return;

    const { ativo = true, ...payload } = data;

    if (id) {
      await updateFormaPagamentoApi({ tenantId, id, data: payload });
      if (editing && editing.ativo !== ativo) {
        await toggleFormaPagamentoApi({ tenantId, id });
      }
    } else {
      const created = await createFormaPagamentoApi({ tenantId, data: payload });
      if (!ativo) {
        await toggleFormaPagamentoApi({ tenantId, id: created.id });
      }
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleToggle(id: string) {
    if (!tenantId) return;
    await toggleFormaPagamentoApi({ tenantId, id });
    await load();
  }

  async function handleDelete(id: string) {
    if (!tenantId) return;
    if (!confirm("Remover esta forma de pagamento?")) return;
    await deleteFormaPagamentoApi({ tenantId, id });
    await load();
  }

  return (
    <div className="space-y-6">
      <FormaPagamentoModal
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
            Formas de Pagamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure meios e condições de pagamento
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!ready || !tenantResolved || !tenantId}>Nova forma</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Parcelas
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Emissão NFSe
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {formas.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{f.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[f.tipo] ?? f.tipo}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {f.taxaPercentual}%
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {f.parcelasMax}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      f.ativo
                        ? "bg-gym-teal/15 text-gym-teal"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      f.emitirAutomaticamente
                        ? "bg-gym-teal/15 text-gym-teal"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.emitirAutomaticamente ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(f);
                        setModalOpen(true);
                      }}
                      className="border-border"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(f.id)}
                      className="border-border"
                    >
                      {f.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(f.id)}
                      className="border-border text-gym-danger hover:text-gym-danger"
                    >
                      Remover
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {formas.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhuma forma cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
