"use client";

import { useState } from "react";
import {
  createServicoApi,
  deleteServicoApi,
  listServicosApi,
  toggleServicoApi,
  updateServicoApi,
} from "@/lib/api/comercial-catalogo";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ServicoModal } from "@/components/shared/servico-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { PageError } from "@/components/shared/page-error";

export function ServicosContent({ initialData }: { initialData: Servico[] }) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);

  const { items: servicos, error, reload } = useCrudOperations<Servico>({
    listFn: () => listServicosApi(false),
    toggleFn: toggleServicoApi,
    deleteFn: deleteServicoApi,
    initialData,
  });

  async function handleSave(
    data: Omit<Servico, "id" | "tenantId">,
    id?: string
  ) {
    const { ativo = true, ...payload } = data;

    if (id) {
      await updateServicoApi(id, payload);
      if (editing && editing.ativo !== ativo) {
        await toggleServicoApi(id);
      }
    } else {
      const created = await createServicoApi(payload);
      if (!ativo) {
        await toggleServicoApi(created.id);
      }
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleToggle(id: string) {
    await toggleServicoApi(id);
    await reload();
  }

  function handleDelete(id: string) {
    confirm("Remover este serviço?", async () => {
      await deleteServicoApi(id);
      await reload();
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      {modalOpen ? (
        <ServicoModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          initial={editing}
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Serviços
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Itens cobrados à parte, com número de sessões
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo serviço</Button>
      </div>

      <PageError error={error} onRetry={reload} />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
              <tr className="border-b border-border bg-secondary">
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Serviço
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessões / Duração
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Venda
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agendamento
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Acesso catraca / Voucher
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servicos.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-xs text-muted-foreground">{s.descricao}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatBRL(s.valor)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.sessoes ?? "—"}
                    {s.duracaoMinutos ? ` · ${s.duracaoMinutos} min` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        s.tipoCobranca === "RECORRENTE"
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.tipoCobranca === "RECORRENTE" ? "Recorrente" : "Único"}
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {s.permiteDesconto ? "Desconto permitido" : "Sem desconto"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        s.agendavel
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.agendavel ? "Agendável" : "Sem agenda"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">
                      Catraca: <span className={s.permiteAcessoCatraca ? "text-gym-accent" : ""}>{s.permiteAcessoCatraca ? "Sim" : "Não"}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Voucher: <span className={s.permiteVoucher ? "text-gym-accent" : ""}>{s.permiteVoucher ? "Sim" : "Não"}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        s.ativo
                          ? "bg-gym-teal/15 text-gym-teal"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar",
                          kind: "edit",
                          onClick: () => {
                            setEditing(s);
                            setModalOpen(true);
                          },
                        },
                        {
                          label: s.ativo ? "Desativar" : "Ativar",
                          kind: "toggle",
                          onClick: () => handleToggle(s.id),
                        },
                        {
                          label: "Remover",
                          kind: "delete",
                          onClick: () => handleDelete(s.id),
                        },
                      ]}
                    />
                  </td>
              </tr>
            ))}
            {servicos.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum serviço cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
