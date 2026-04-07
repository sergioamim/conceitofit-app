"use client";

import { formatBRL } from "@/lib/formatters";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import type { PagamentoComAluno } from "@/lib/tenant/financeiro/recebimentos";

interface PagamentosSummaryCardsProps {
  totalRecebido: number;
  totalPendente: number;
  totalCount: number;
}

export function PagamentosSummaryCards({
  totalRecebido,
  totalPendente,
  totalCount,
}: PagamentosSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-teal" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recebido no mês
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
          {formatBRL(totalRecebido)}
        </p>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-warning" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Em aberto
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
          {formatBRL(totalPendente)}
        </p>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-accent" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Total de cobranças
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
          {totalCount}
        </p>
      </div>
    </div>
  );
}
