"use client";

import { ExportMenu } from "@/components/shared/export-menu";
import type { FluxoCaixa } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

interface FluxoTableProps {
  fluxo: FluxoCaixa;
}

export function FluxoTable({ fluxo }: FluxoTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">
          Fluxo de Caixa — {formatDate(fluxo.dataInicio)} a {formatDate(fluxo.dataFim)}
        </h2>
        <ExportMenu
          data={fluxo.items}
          columns={[
            { label: "Periodo", accessor: "periodo" },
            { label: "Entradas", accessor: (r) => formatBRL(r.entradas) },
            { label: "Saidas", accessor: (r) => formatBRL(r.saidas) },
            { label: "Saldo Liquido", accessor: (r) => formatBRL(r.saldoLiquido) },
          ]}
          filename="fluxo-de-caixa"
          title="Fluxo de Caixa"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo Inicial</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-muted-foreground">{formatBRL(fluxo.saldoInicial)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo Final</p>
          <p className={`mt-2 font-display text-2xl font-extrabold ${fluxo.saldoFinal >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
            {formatBRL(fluxo.saldoFinal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Variacao</p>
          <p className={`mt-2 font-display text-2xl font-extrabold ${(fluxo.saldoFinal - fluxo.saldoInicial) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
            {formatBRL(fluxo.saldoFinal - fluxo.saldoInicial)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3 py-2 text-left font-semibold">Periodo</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Entradas</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Saidas</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Saldo Liquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fluxo.items.map((item) => (
              <tr key={item.periodo} className="hover:bg-secondary/30">
                <td className="px-3 py-2 font-medium">{item.periodo}</td>
                <td className="px-3 py-2 text-right font-mono text-gym-teal">{formatBRL(item.entradas)}</td>
                <td className="px-3 py-2 text-right font-mono text-gym-danger">{formatBRL(item.saidas)}</td>
                <td className={`px-3 py-2 text-right font-mono font-semibold ${item.saldoLiquido >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
                  {formatBRL(item.saldoLiquido)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
