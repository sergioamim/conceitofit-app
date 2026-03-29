"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createVoucherApi,
  listVoucherUsageCountsApi,
  listVouchersApi,
  toggleVoucherApi,
} from "@/lib/api/beneficios";
import type { Voucher } from "@/lib/types";
import { NovoVoucherModal, NovoVoucherPayload } from "@/components/shared/novo-voucher-modal";
import { EditarVoucherModal } from "@/components/shared/editar-voucher-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { VoucherCodigosModal } from "@/components/shared/voucher-codigos-modal";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { PageError } from "@/components/shared/page-error";

import { formatDate } from "@/lib/formatters";

const TIPO_LABEL: Record<string, string> = {
  DESCONTO: "Desconto",
  ACESSO: "Acesso livre",
  SESSAO: "Sessão avulsa",
};

function formatPeriodo(voucher: Voucher): string {
  const inicio = formatDate(voucher.periodoInicio);
  if (!voucher.prazoDeterminado) return `${inicio} · ∞`;
  const fim = voucher.periodoFim ? formatDate(voucher.periodoFim) : "—";
  return `${inicio} → ${fim}`;
}

interface VouchersContentProps {
  initialData: Voucher[];
  initialUsageCounts: Record<string, number>;
  tenantId: string;
}

export function VouchersContent({ initialData, initialUsageCounts, tenantId }: VouchersContentProps) {
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>(initialUsageCounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [codigosVoucher, setCodigosVoucher] = useState<Voucher | null>(null);

  const { items: vouchers, error, reload } = useCrudOperations<Voucher>({
    listFn: async () => {
      const [data, counts] = await Promise.all([
        listVouchersApi(),
        listVoucherUsageCountsApi(),
      ]);
      setUsageCounts(counts);
      return data;
    },
    toggleFn: toggleVoucherApi,
    initialData,
  });

  const handleNext = async (payload: NovoVoucherPayload) => {
    await createVoucherApi(payload as unknown as Record<string, unknown>);
    setModalOpen(false);
    await reload();
  };

  const handleToggle = async (id: string) => {
    await toggleVoucherApi(id);
    await reload();
  };

  return (
    <div className="space-y-6">
      <NovoVoucherModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onNext={handleNext}
        tenantId={tenantId}
      />

      {editVoucher && (
        <EditarVoucherModal
          tenantId={tenantId}
          voucher={editVoucher}
          onClose={() => setEditVoucher(null)}
          onSaved={() => {
            setEditVoucher(null);
            void reload();
          }}
        />
      )}

      {codigosVoucher && (
        <VoucherCodigosModal
          tenantId={tenantId}
          voucher={codigosVoucher}
          onClose={() => setCodigosVoucher(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vouchers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cupões e acessos temporários
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!tenantId}>Novo voucher</Button>
      </div>

      <PageError error={error} onRetry={reload} />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Nome</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Escopo</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Período</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Quantidade</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Código</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Aplicar em</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Utilizações</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vouchers.map((voucher) => {
              const uses = usageCounts[voucher.id] ?? 0;
              const canEdit = uses === 0;
              return (
                <tr key={voucher.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">{TIPO_LABEL[voucher.tipo] ?? voucher.tipo}</td>
                  <td className="px-4 py-3 font-medium">{voucher.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      voucher.escopo === "GRUPO"
                        ? "bg-gym-accent/15 text-gym-accent"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {voucher.escopo === "GRUPO" ? "Grupo" : "Unidade"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatPeriodo(voucher)}
                  </td>
                  <td className="px-4 py-3">
                    {voucher.ilimitado ? "Ilimitada" : (voucher.quantidade ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {voucher.codigoTipo === "UNICO" ? "Único" : "Aleatório"}
                  </td>
                  <td className="px-4 py-3">
                    {voucher.aplicarEm.length === 0
                      ? "—"
                      : voucher.aplicarEm
                          .map((v) => (v === "ANUIDADE" ? "Anuidade" : "Contrato"))
                          .join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        uses > 0
                          ? "bg-gym-warning/15 text-gym-warning"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {uses}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        voucher.ativo
                          ? "bg-gym-teal/15 text-gym-teal"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {voucher.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Ver códigos",
                          kind: "view",
                          onClick: () => setCodigosVoucher(voucher),
                        },
                        ...(canEdit
                          ? [
                              {
                                label: "Editar",
                                kind: "edit" as const,
                                onClick: () => setEditVoucher(voucher),
                              },
                            ]
                          : []),
                        {
                          label: voucher.ativo ? "Desativar" : "Ativar",
                          kind: "toggle",
                          onClick: () => handleToggle(voucher.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum voucher cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
