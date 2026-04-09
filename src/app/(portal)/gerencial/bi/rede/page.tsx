"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { buildBiExportCsv } from "@/lib/tenant/bi/analytics";
import { getBusinessMonthRange } from "@/lib/business-date";
import type { BiEscopo, BiSegmento } from "@/lib/types";
import { useBiFilters, useBiSnapshot } from "@/lib/query/use-bi";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { BiTrendBars } from "@/components/shared/bi-trend-bars";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { formatBRL, formatPercent } from "@/lib/formatters";

const ALL_TENANTS = "__ALL__";
const SEGMENTO_OPTIONS: Array<{ value: BiSegmento; label: string }> = [
  { value: FILTER_ALL, label: "Todos os segmentos" },
  { value: "VISITA_PRESENCIAL", label: "Visita presencial" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "SITE", label: "Site" },
  { value: "OUTROS", label: "Outros" },
];

function monthRangeFromNow() {
  return getBusinessMonthRange();
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function BiRedePage() {
  const access = useAuthAccess();
  const tenantContext = useTenantContext();
  const { start, end } = monthRangeFromNow();
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState(ALL_TENANTS);
  const [segmento, setSegmento] = useState<BiSegmento>(FILTER_ALL);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  // Server state via TanStack Query — filters
  const { data: filtersData } = useBiFilters();
  const academias = filtersData?.academias ?? [];
  const tenants = filtersData?.tenants ?? [];

  // Resolve defaults from filters data
  const effectiveAcademiaId = useMemo(() => {
    if (selectedAcademiaId) return selectedAcademiaId;
    const currentTenant = tenants.find((item) => item.id === tenantContext.tenantId);
    return currentTenant?.academiaId ?? currentTenant?.groupId ?? academias[0]?.id ?? "";
  }, [selectedAcademiaId, tenants, tenantContext.tenantId, academias]);

  const resolvedScope: BiEscopo = selectedTenantId === ALL_TENANTS ? "ACADEMIA" : "UNIDADE";
  const resolvedTenantId = selectedTenantId === ALL_TENANTS ? tenantContext.tenantId : selectedTenantId;

  // Server state via TanStack Query — snapshot
  const {
    data: snapshot = null,
    isLoading: loading,
    error: snapshotError,
    refetch,
  } = useBiSnapshot({
    scope: resolvedScope,
    tenantId: resolvedTenantId ?? undefined,
    academiaId: effectiveAcademiaId,
    startDate,
    endDate,
    segmento,
    canViewNetwork: true,
    enabled: access.canAccessElevatedModules && tenantContext.tenantResolved,
  });

  const error = snapshotError ? normalizeErrorMessage(snapshotError) : null;

  const filteredTenants = useMemo(
    () => tenants.filter((tenant) => (tenant.academiaId ?? tenant.groupId) === effectiveAcademiaId),
    [effectiveAcademiaId, tenants]
  );

  const bestReceita = snapshot?.benchmark[0];
  const bestConversao = snapshot?.benchmark.slice().sort((a, b) => b.conversaoPct - a.conversaoPct)[0];
  const worstInadimplencia = snapshot?.benchmark.slice().sort((a, b) => b.inadimplenciaPct - a.inadimplenciaPct)[0];

  if (!access.loading && !access.canAccessElevatedModules) {
    return (
      <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-5 text-sm text-gym-danger">
        A visão de rede exige permissão elevada. Use o BI Operacional para consultar a unidade ativa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Visão de Rede</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparativo por unidade, academia, período e segmento com foco em performance operacional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-border"
            onClick={() => snapshot && downloadCsv(`bi-rede-${snapshot.startDate}-${snapshot.endDate}.csv`, buildBiExportCsv(snapshot))}
            disabled={!snapshot}
          >
            <Download className="mr-2 size-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" className="border-border" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academia</label>
            <Select value={effectiveAcademiaId} onValueChange={setSelectedAcademiaId}>
              <SelectTrigger aria-label="Academia Rede" className="w-full border-border bg-secondary">
                <SelectValue placeholder="Selecione a academia" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {academias.map((academia) => (
                  <SelectItem key={academia.id} value={academia.id}>
                    {academia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger aria-label="Unidade Rede" className="w-full border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value={ALL_TENANTS}>Todas as unidades</SelectItem>
                {filteredTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="rede-start-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">De</label>
            <Input
              id="rede-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="rede-end-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Até</label>
            <Input
              id="rede-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Segmento</label>
            <Select value={segmento} onValueChange={(value) => setSegmento(value as BiSegmento)}>
              <SelectTrigger aria-label="Segmento Rede" className="w-full border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {SEGMENTO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void refetch()} />
      ) : null}

      {loading || !snapshot ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BiMetricCard
              label="Receita líder"
              value={bestReceita ? formatBRL(bestReceita.receita) : formatBRL(0)}
              description={bestReceita ? bestReceita.tenantNome : "Sem benchmark"}
              tone="accent"
            />
            <BiMetricCard
              label="Melhor conversão"
              value={bestConversao ? formatPercent(bestConversao.conversaoPct) : "0,0%"}
              description={bestConversao ? bestConversao.tenantNome : "Sem benchmark"}
              tone="teal"
            />
            <BiMetricCard
              label="Maior atenção"
              value={worstInadimplencia ? formatPercent(worstInadimplencia.inadimplenciaPct) : "0,0%"}
              description={worstInadimplencia ? `${worstInadimplencia.tenantNome} em inadimplência` : "Sem benchmark"}
              tone="danger"
            />
            <BiMetricCard
              label="Receita consolidada"
              value={formatBRL(snapshot.kpis.receita)}
              description={snapshot.scope === "ACADEMIA" ? "Rede consolidada" : "Unidade filtrada"}
              tone="accent"
            />
            <BiMetricCard
              label="Conversão consolidada"
              value={formatPercent(snapshot.kpis.conversaoPct)}
              description={`${snapshot.kpis.conversoes} conversões`}
              tone="teal"
            />
            <BiMetricCard
              label="Retenção consolidada"
              value={formatPercent(snapshot.kpis.retencaoPct)}
              description={`${snapshot.kpis.ativos.toLocaleString("pt-BR")} ativos no recorte`}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Radar className="size-4 text-gym-accent" />
                <div>
                  <h2 className="font-display text-lg font-bold">Série consolidada</h2>
                  <p className="text-xs text-muted-foreground">Leitura mensal da rede para receita, conversão e ocupação.</p>
                </div>
              </div>
              <BiTrendBars points={snapshot.series} />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold">Checklist de governança</h2>
              <div className="mt-4 space-y-3">
                {snapshot.quality.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.status === "OK"
                            ? "bg-gym-teal/15 text-gym-teal"
                            : "bg-gym-warning/15 text-gym-warning"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Ranking da rede</h2>
                <p className="text-xs text-muted-foreground">
                  Tabela comparativa por unidade com KPIs consolidados no mesmo recorte.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {snapshot.benchmark.length} unidade(s)
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-3 py-2 text-left font-semibold">Unidade</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Receita</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Ativos</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Prospects</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Conversão</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Ocupação</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Inadimplência</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {snapshot.benchmark.map((row) => (
                    <tr key={row.tenantId} className="transition-colors hover:bg-secondary/30">
                      <td className="px-3 py-2 font-medium text-foreground">{row.tenantNome}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(row.receita)}</td>
                      <td className="px-3 py-2 text-right">{row.ativos.toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right">{row.prospects.toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right">{formatPercent(row.conversaoPct)}</td>
                      <td className="px-3 py-2 text-right">{formatPercent(row.ocupacaoPct)}</td>
                      <td className="px-3 py-2 text-right">{formatPercent(row.inadimplenciaPct)}</td>
                      <td className="px-3 py-2 text-right">{formatPercent(row.retencaoPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
