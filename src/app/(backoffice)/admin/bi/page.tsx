"use client";

import { useEffect, useState } from "react";
import { FileChartColumnIncreasing } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { BiTrendBars } from "@/components/shared/bi-trend-bars";
import { ListErrorState } from "@/components/shared/list-states";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useAdminBiAcademias, useAdminBiExecutivo } from "@/lib/query/admin";
import type { AdminBiExecutivoData } from "@/lib/api/admin-bi";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
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

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

export default function AdminBiPage() {
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");

  const academiasQuery = useAdminBiAcademias();
  const biQuery = useAdminBiExecutivo(selectedAcademiaId || null);

  const academias = academiasQuery.data ?? [];
  const biData = biQuery.data ?? null;
  const loading = biQuery.isLoading;
  const error = academiasQuery.error || biQuery.error
    ? normalizeErrorMessage(academiasQuery.error ?? biQuery.error)
    : null;

  // Auto-select first academia when data loads
  useEffect(() => {
    if (academiasQuery.data && academiasQuery.data.length > 0 && !selectedAcademiaId) {
      setSelectedAcademiaId(academiasQuery.data[0].id);
    }
  }, [academiasQuery.data, selectedAcademiaId]);

  const selectedAcademia = academias.find((a) => a.id === selectedAcademiaId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Backoffice</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">BI Executivo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            KPIs executivos por academia{selectedAcademia ? ` — ${selectedAcademia.nome}` : ""}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academia</label>
            <Select value={selectedAcademiaId} onValueChange={setSelectedAcademiaId}>
              <SelectTrigger aria-label="Selecione a academia" className="w-full border-border bg-secondary">
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
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void biQuery.refetch()} /> : null}

      {loading || !biData ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BiMetricCard
              label="Conversao"
              value={formatPercent(biData.kpis.conversaoPct)}
              description={`${biData.kpis.conversoes} conversoes de ${biData.kpis.prospects} prospects`}
              delta={formatDelta(biData.deltas.conversaoPct, "percent")}
              tone="accent"
            />
            <BiMetricCard
              label="Ocupacao"
              value={formatPercent(biData.kpis.ocupacaoPct)}
              description={`${biData.kpis.lugaresOcupados} vagas ocupadas de ${biData.kpis.lugaresDisponiveis}`}
              delta={formatDelta(biData.deltas.ocupacaoPct, "percent")}
              tone="teal"
            />
            <BiMetricCard
              label="Inadimplencia"
              value={formatPercent(biData.kpis.inadimplenciaPct)}
              description={`${formatBRL(biData.kpis.valorInadimplente)} vencidos`}
              delta={formatDelta(biData.deltas.inadimplenciaPct, "percent")}
              tone="danger"
            />
            <BiMetricCard
              label="Retencao"
              value={formatPercent(biData.kpis.retencaoPct)}
              description="Base recorrente mantida no periodo"
              delta={formatDelta(biData.deltas.retencaoPct, "percent")}
              tone="teal"
            />
            <BiMetricCard
              label="Receita"
              value={formatBRL(biData.kpis.receita)}
              description={`${formatBRL(biData.kpis.valorEmAberto)} em aberto`}
              delta={formatDelta(biData.deltas.receita, "currency")}
              tone="accent"
            />
            <BiMetricCard
              label="Ativos"
              value={biData.kpis.ativos.toLocaleString("pt-BR")}
              description="Clientes ativos no recorte"
              delta={formatDelta(biData.deltas.ativos, "count")}
              tone="warning"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileChartColumnIncreasing className="size-4 text-gym-accent" />
              <div>
                <h2 className="font-display text-lg font-bold">Serie temporal</h2>
                <p className="text-xs text-muted-foreground">Receita, conversao, ocupacao e retencao por periodo.</p>
              </div>
            </div>
            <BiTrendBars points={biData.series} />
          </div>
        </>
      )}
    </div>
  );
}
