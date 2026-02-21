"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  listVouchers,
  createVoucher,
  toggleVoucher,
  listVoucherUsageCounts,
} from "@/lib/mock/services";
import type { Voucher } from "@/lib/types";
import { NovoVoucherModal, NovoVoucherPayload } from "@/components/shared/novo-voucher-modal";
import { EditarVoucherModal } from "@/components/shared/editar-voucher-modal";
import { VoucherCodigosModal } from "@/components/shared/voucher-codigos-modal";

const TIPO_LABEL: Record<string, string> = {
  DESCONTO: "Desconto",
  ACESSO: "Acesso livre",
  SESSAO: "Sessão avulsa",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatPeriodo(voucher: Voucher): string {
  const inicio = formatDate(voucher.periodoInicio);
  if (!voucher.prazoDeterminado) return `${inicio} · ∞`;
  const fim = voucher.periodoFim ? formatDate(voucher.periodoFim) : "—";
  return `${inicio} → ${fim}`;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [codigosVoucher, setCodigosVoucher] = useState<Voucher | null>(null);

  const load = useCallback(async () => {
    const [data, counts] = await Promise.all([
      listVouchers(),
      listVoucherUsageCounts(),
    ]);
    setVouchers(data);
    setUsageCounts(counts);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async (payload: NovoVoucherPayload) => {
    await createVoucher(payload);
    setModalOpen(false);
    load();
  };

  const handleToggle = async (id: string) => {
    await toggleVoucher(id);
    load();
  };

  return (
    <div className="space-y-6">
      <NovoVoucherModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onNext={handleNext}
      />

      {editVoucher && (
        <EditarVoucherModal
          voucher={editVoucher}
          onClose={() => setEditVoucher(null)}
          onSaved={() => {
            setEditVoucher(null);
            load();
          }}
        />
      )}

      {codigosVoucher && (
        <VoucherCodigosModal
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
        <Button onClick={() => setModalOpen(true)}>Novo voucher</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Período</th>
              <th className="px-4 py-3 text-left font-semibold">Quantidade</th>
              <th className="px-4 py-3 text-left font-semibold">Código</th>
              <th className="px-4 py-3 text-left font-semibold">Aplicar em</th>
              <th className="px-4 py-3 text-left font-semibold">Utilizações</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Ações</th>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-xs"
                        onClick={() => setCodigosVoucher(voucher)}
                      >
                        Ver códigos
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-xs"
                          onClick={() => setEditVoucher(voucher)}
                        >
                          Editar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-xs"
                        onClick={() => handleToggle(voucher.id)}
                      >
                        {voucher.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
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
