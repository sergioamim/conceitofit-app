"use client";

import { useMemo, useState } from "react";
import {
  createFormaPagamentoApi,
  deleteFormaPagamentoApi,
  listFormasPagamentoApi,
  toggleFormaPagamentoApi,
  updateFormaPagamentoApi,
} from "@/lib/api/formas-pagamento";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { FormaPagamentoModal } from "@/components/shared/forma-pagamento-modal";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { PageError } from "@/components/shared/page-error";

const TIPO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

export function FormasPagamentoContent({ initialData }: { initialData: FormaPagamento[] }) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { tenantId, tenantResolved } = useTenantContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);

  const crudOptions = useMemo(
    () => ({
      listFn: async () => {
        if (!tenantId) return [];
        return listFormasPagamentoApi({ tenantId, apenasAtivas: false });
      },
      toggleFn: async (id: string) => {
        if (!tenantId) return;
        await toggleFormaPagamentoApi({ tenantId, id });
      },
      deleteFn: async (id: string) => {
        if (!tenantId) return;
        await deleteFormaPagamentoApi({ tenantId, id });
      },
      initialData,
    }),
    [tenantId, initialData]
  );

  const { items: formas, error, reload } = useCrudOperations<FormaPagamento>(crudOptions);

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
    await reload();
  }

  async function handleToggle(id: string) {
    if (!tenantId) return;
    await toggleFormaPagamentoApi({ tenantId, id });
    await reload();
  }

  function handleDelete(id: string) {
    if (!tenantId) return;
    confirm("Remover esta forma de pagamento?", async () => {
      await deleteFormaPagamentoApi({ tenantId, id });
      await reload();
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
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
        <Button onClick={() => setModalOpen(true)} disabled={!tenantResolved || !tenantId}>Nova forma</Button>
      </div>

      <PageError error={error} onRetry={reload} />

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
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(f);
                          setModalOpen(true);
                        },
                      },
                      {
                        label: f.ativo ? "Desativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(f.id),
                      },
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => handleDelete(f.id),
                      },
                    ]}
                  />
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
