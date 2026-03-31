"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListErrorState } from "@/components/shared/list-states";
import { ExportMenu } from "@/components/shared/export-menu";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getBusinessMonthRange } from "@/lib/business-date";
import { getBalancoPatrimonialApi, getFluxoCaixaApi } from "@/lib/api/financial";
import type { BalancoPatrimonial, FluxoCaixa } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

type ReportType = "balanco" | "fluxo-caixa";

export default function RelatoriosPage() {
  const tenantContext = useTenantContext();
  const range = getBusinessMonthRange();
  const [reportType, setReportType] = useState<ReportType>("balanco");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  // Track whether user has clicked "Gerar" so we can enable the query
  const [fetchKey, setFetchKey] = useState<number>(0);
  const [shouldFetch, setShouldFetch] = useState(false);

  const balancoQuery = useQuery<BalancoPatrimonial | null>({
    queryKey: ["admin", "contabilidade-relatorios", "balanco", endDate, fetchKey],
    queryFn: () => getBalancoPatrimonialApi({ tenantId: tenantContext.tenantId, dataBase: endDate }),
    enabled: shouldFetch && reportType === "balanco" && Boolean(tenantContext.tenantId),
    staleTime: 5 * 60_000,
  });

  const fluxoQuery = useQuery<FluxoCaixa | null>({
    queryKey: ["admin", "contabilidade-relatorios", "fluxo-caixa", startDate, endDate, fetchKey],
    queryFn: () => getFluxoCaixaApi({ tenantId: tenantContext.tenantId, startDate, endDate }),
    enabled: shouldFetch && reportType === "fluxo-caixa" && Boolean(tenantContext.tenantId),
    staleTime: 5 * 60_000,
  });

  const loading = balancoQuery.isFetching || fluxoQuery.isFetching;
  const error = balancoQuery.error?.message ?? fluxoQuery.error?.message ?? null;
  const balanco = reportType === "balanco" ? (balancoQuery.data ?? null) : null;
  const fluxo = reportType === "fluxo-caixa" ? (fluxoQuery.data ?? null) : null;

  function handleGenerate() {
    setShouldFetch(true);
    setFetchKey((k) => k + 1);
  }

  function handleRetry() {
    if (reportType === "balanco") void balancoQuery.refetch();
    else void fluxoQuery.refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Relatorios Contabeis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Balanco patrimonial e fluxo de caixa.</p>
      </div>

      {error ? <ListErrorState error={error} onRetry={handleRetry} /> : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relatorio</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="balanco">Balanco Patrimonial</SelectItem>
                <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">De</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ate</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-border bg-secondary" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              <FileText className="mr-2 size-4" />
              {loading ? "Gerando..." : "Gerar relatorio"}
            </Button>
          </div>
        </div>
      </div>

      {balanco ? (
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
      ) : null}

      {fluxo ? (
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
      ) : null}

      {!balanco && !fluxo && !loading ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Selecione o tipo de relatorio e clique em "Gerar relatorio" para visualizar.
        </div>
      ) : null}
    </div>
  );
}
