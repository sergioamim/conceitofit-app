"use client";

import { formatBRL } from "@/lib/formatters";
import { ContasPagarWorkspace } from "../hooks/use-contas-pagar-workspace";

interface ContasPagarStatsProps {
  workspace: ContasPagarWorkspace;
}

export function ContasPagarStats({ workspace }: ContasPagarStatsProps) {
  const { resumo, resumoRecorrencia } = workspace;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Previsto no período
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {formatBRL(resumo.previstas)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pago</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
            {formatBRL(resumo.pagas)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Em aberto
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {formatBRL(resumo.emAberto)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vencidas
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">
            {formatBRL(resumo.vencidas)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Regras recorrentes
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Status das regras cadastradas para geração automática.
            </p>
          </div>
          <p className="font-display text-2xl font-extrabold text-gym-accent">
            {resumoRecorrencia.total}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2 py-1 font-semibold text-gym-teal">
            Ativas: {resumoRecorrencia.ativa}
          </span>
          <span className="inline-flex items-center rounded-full bg-gym-warning/15 px-2 py-1 font-semibold text-gym-warning">
            Pausadas: {resumoRecorrencia.pausada}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground">
            Canceladas: {resumoRecorrencia.cancelada}
          </span>
        </div>
      </div>
    </>
  );
}
