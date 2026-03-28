"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileChartColumnIncreasing, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthAccess, useTenantContext } from "@/hooks/use-session-context";
import { BI_KPI_CATALOG, buildBiExportCsv, resolveBiScopeAccess } from "@/lib/tenant/bi/analytics";
import { getBusinessMonthRange } from "@/lib/business-date";
import { getBiOperacionalSnapshotApi } from "@/lib/api/bi";
import { listAcademiasApi, listUnidadesApi } from "@/lib/api/contexto-unidades";
import type { Academia, BiEscopo, BiOperationalSnapshot, BiSegmento, Tenant } from "@/lib/types";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { BiTrendBars } from "@/components/shared/bi-trend-bars";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";

const SEGMENTO_OPTIONS: Array<{ value: BiSegmento; label: string }> = [
  { value: "TODOS", label: "Todos os segmentos" },
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

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDelta(value: number, mode: "percent" | "currency" | "count") {
  if (mode === "currency") {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${formatBRL(Math.abs(value))} vs período anterior`;
  }
  if (mode === "count") {
    return `${value >= 0 ? "+" : ""}${value.toLocaleString("pt-BR")} vs período anterior`;
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} p.p. vs período anterior`;
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

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
      </div>
    </div>
  );
}

export default function BiOperacionalPage() {
  const access = useAuthAccess();
  const tenantContext = useTenantContext();
  const { start, end } = monthRangeFromNow();
  const scopeAccess = resolveBiScopeAccess(access.canAccessElevatedModules);
  const [mounted, setMounted] = useState(false);

  const [academias, setAcademias] = useState<Academia[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [scope, setScope] = useState<BiEscopo>(scopeAccess.defaultScope);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [segmento, setSegmento] = useState<BiSegmento>("TODOS");
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [snapshot, setSnapshot] = useState<BiOperationalSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    const [academiasResponse, tenantsResponse] = await Promise.all([listAcademiasApi(), listUnidadesApi()]);
    setAcademias(academiasResponse);
    setTenants(tenantsResponse);
    setSelectedTenantId((current) => current || tenantContext.tenantId || tenantsResponse[0]?.id || "");
    setSelectedAcademiaId((current) => {
      if (current) return current;
      const tenant = tenantsResponse.find((item) => item.id === (tenantContext.tenantId || tenantsResponse[0]?.id));
      return tenant?.academiaId ?? tenant?.groupId ?? academiasResponse[0]?.id ?? "";
    });
  }, [tenantContext.tenantId]);

  const loadSnapshot = useCallback(async () => {
    if (!tenantContext.tenantResolved) return;
    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await getBiOperacionalSnapshotApi({
        scope,
        tenantId: selectedTenantId || tenantContext.tenantId,
        academiaId: selectedAcademiaId,
        startDate,
        endDate,
        segmento,
        canViewNetwork: access.canAccessElevatedModules,
      });
      setSnapshot(nextSnapshot);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [
    access.canAccessElevatedModules,
    endDate,
    scope,
    segmento,
    selectedAcademiaId,
    selectedTenantId,
    startDate,
    tenantContext.tenantId,
    tenantContext.tenantResolved,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (tenantContext.tenantResolved) {
      void loadSnapshot();
    }
  }, [loadSnapshot, tenantContext.tenantResolved]);

  const visibleTenantOptions = useMemo(() => {
    if (scope === "UNIDADE") {
      return tenants;
    }
    return tenants.filter((tenant) => (tenant.academiaId ?? tenant.groupId) === selectedAcademiaId);
  }, [scope, selectedAcademiaId, tenants]);

  const activeLabel = !mounted
    ? "Unidade ativa"
    : snapshot?.scope === "ACADEMIA"
      ? snapshot.academiaNome ?? "Rede"
      : snapshot?.tenantNome ?? tenantContext.tenantName;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">BI Operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            KPIs de conversão, ocupação, inadimplência e retenção para {activeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {access.canAccessElevatedModules ? (
            <Button asChild variant="outline" className="border-border">
              <Link href="/gerencial/bi/rede">Abrir visão de rede</Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-border"
            onClick={() => snapshot && downloadCsv(`bi-operacional-${snapshot.startDate}-${snapshot.endDate}.csv`, buildBiExportCsv(snapshot))}
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
          {access.canAccessElevatedModules ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escopo</label>
              <Select value={scope} onValueChange={(value) => setScope(value as BiEscopo)}>
                <SelectTrigger aria-label="Escopo BI" className="w-full border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {scopeAccess.scopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {access.canAccessElevatedModules ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academia</label>
              <Select value={selectedAcademiaId} onValueChange={setSelectedAcademiaId}>
                <SelectTrigger aria-label="Academia BI" className="w-full border-border bg-secondary">
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
          ) : null}

          {scope === "UNIDADE" ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger aria-label="Unidade BI" className="w-full border-border bg-secondary">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {visibleTenantOptions.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1">
            <label htmlFor="bi-start-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">De</label>
            <Input
              id="bi-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="bi-end-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Até</label>
            <Input
              id="bi-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Segmento</label>
            <Select value={segmento} onValueChange={(value) => setSegmento(value as BiSegmento)}>
              <SelectTrigger aria-label="Segmento BI" className="w-full border-border bg-secondary">
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
        <ListErrorState error={error} onRetry={() => void loadFilters()} />
      ) : null}

      {loading || !snapshot ? (
        <LoadingPanel />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BiMetricCard
              label="Conversão"
              value={formatPercent(snapshot.kpis.conversaoPct)}
              description={`${snapshot.kpis.conversoes} conversões de ${snapshot.kpis.prospects} prospects`}
              delta={formatDelta(snapshot.deltas.conversaoPct, "percent")}
              tone="accent"
            />
            <BiMetricCard
              label="Ocupação"
              value={formatPercent(snapshot.kpis.ocupacaoPct)}
              description={`${snapshot.kpis.lugaresOcupados} vagas ocupadas de ${snapshot.kpis.lugaresDisponiveis}`}
              delta={formatDelta(snapshot.deltas.ocupacaoPct, "percent")}
              tone="teal"
            />
            <BiMetricCard
              label="Inadimplência"
              value={formatPercent(snapshot.kpis.inadimplenciaPct)}
              description={`${formatBRL(snapshot.kpis.valorInadimplente)} vencidos`}
              delta={formatDelta(snapshot.deltas.inadimplenciaPct, "percent")}
              tone="danger"
            />
            <BiMetricCard
              label="Retenção"
              value={formatPercent(snapshot.kpis.retencaoPct)}
              description="Base recorrente mantida no período"
              delta={formatDelta(snapshot.deltas.retencaoPct, "percent")}
              tone="teal"
            />
            <BiMetricCard
              label="Receita"
              value={formatBRL(snapshot.kpis.receita)}
              description={`${formatBRL(snapshot.kpis.valorEmAberto)} em aberto`}
              delta={formatDelta(snapshot.deltas.receita, "currency")}
              tone="accent"
            />
            <BiMetricCard
              label="Ativos"
              value={snapshot.kpis.ativos.toLocaleString("pt-BR")}
              description="Clientes ativos no recorte"
              delta={formatDelta(snapshot.deltas.ativos, "count")}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileChartColumnIncreasing className="size-4 text-gym-accent" />
                <div>
                  <h2 className="font-display text-lg font-bold">Tendência dos últimos 6 meses</h2>
                  <p className="text-xs text-muted-foreground">Receita, conversão, ocupação e retenção por mês.</p>
                </div>
              </div>
              <BiTrendBars points={snapshot.series} />
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold">KPIs e dimensões</h2>
                <div className="mt-4 space-y-3">
                  {BI_KPI_CATALOG.map((kpi) => (
                    <div key={kpi.key} className="rounded-lg border border-border px-3 py-3">
                      <p className="text-sm font-semibold text-foreground">{kpi.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{kpi.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold">Checklist de qualidade</h2>
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
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Benchmark por unidade</h2>
                <p className="text-xs text-muted-foreground">Comparativo interno de receita, conversão, ocupação, inadimplência e retenção.</p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {snapshot.benchmark.length} unidade(s)
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left font-semibold">Unidade</th>
                    <th className="px-3 py-2 text-right font-semibold">Receita</th>
                    <th className="px-3 py-2 text-right font-semibold">Ativos</th>
                    <th className="px-3 py-2 text-right font-semibold">Conversão</th>
                    <th className="px-3 py-2 text-right font-semibold">Ocupação</th>
                    <th className="px-3 py-2 text-right font-semibold">Inadimplência</th>
                    <th className="px-3 py-2 text-right font-semibold">Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {snapshot.benchmark.map((row) => (
                    <tr key={row.tenantId} className="transition-colors hover:bg-secondary/30">
                      <td className="px-3 py-2 font-medium text-foreground">{row.tenantNome}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(row.receita)}</td>
                      <td className="px-3 py-2 text-right">{row.ativos.toLocaleString("pt-BR")}</td>
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
