"use client";

import { ExportMenu } from "@/components/shared/export-menu";
import type { BalancoPatrimonial } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

interface BalancoTableProps {
  balanco: BalancoPatrimonial;
}

export function BalancoTable({ balanco }: BalancoTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Balanco Patrimonial — {formatDate(balanco.dataBase)}</h2>
        <ExportMenu
          data={balanco.linhas}
          columns={[
            { label: "Conta", accessor: (r) => `${r.contaCodigo} ${r.contaNome}` },
            { label: "Tipo", accessor: "tipo" },
            { label: "Saldo", accessor: (r) => formatBRL(r.saldo) },
          ]}
          filename="balanco-patrimonial"
          title="Balanco Patrimonial"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Ativos</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{formatBRL(balanco.totalAtivos)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Passivos</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{formatBRL(balanco.totalPassivos)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patrimonio Liquido</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{formatBRL(balanco.totalPatrimonio)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3 py-2 text-left font-semibold">Codigo</th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">Conta</th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">Tipo</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {balanco.linhas.map((linha) => (
              <tr key={linha.contaId} className="hover:bg-secondary/30">
                <td className="px-3 py-2 font-mono text-xs">{linha.contaCodigo}</td>
                <td className="px-3 py-2 font-medium">{linha.contaNome}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{linha.tipo}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono">{formatBRL(linha.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
