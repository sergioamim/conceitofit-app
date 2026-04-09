"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useBiInadimplencia } from "@/lib/query/use-bi";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { formatBRL, formatPercent } from "@/lib/formatters";

const AGING_CONFIG = [
  { key: "de0a30dias" as const, label: "0-30 dias", tone: "warning" as const, bgClass: "bg-gym-warning" },
  { key: "de31a60dias" as const, label: "31-60 dias", tone: "warning" as const, bgClass: "bg-orange-500" },
  { key: "de61a90dias" as const, label: "61-90 dias", tone: "danger" as const, bgClass: "bg-gym-danger" },
  { key: "maisDe90dias" as const, label: "90+ dias", tone: "danger" as const, bgClass: "bg-red-900" },
];

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}

export default function InadimplenciaContent() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId ?? "";

  const { data, isLoading, error: queryError, refetch } = useBiInadimplencia(tenantId);
  const error = queryError ? normalizeErrorMessage(queryError) : null;

  const totalAging = data
    ? data.aging.de0a30dias + data.aging.de31a60dias + data.aging.de61a90dias + data.aging.maisDe90dias
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">BI Analytics</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Inadimplencia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao consolidada de contas pendentes, vencidas e aging de inadimplencia.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/gerencial/bi">
            <ArrowLeft className="mr-2 size-4" />
            Voltar ao BI
          </Link>
        </Button>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void refetch()} />
      ) : null}

      {isLoading || !data ? (
        <LoadingPanel />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <BiMetricCard
              label="Contas pendentes"
              value={data.contasPendentes.toLocaleString("pt-BR")}
              tone="warning"
            />
            <BiMetricCard
              label="Contas vencidas"
              value={data.contasVencidas.toLocaleString("pt-BR")}
              tone="danger"
            />
            <BiMetricCard
              label="Valor pendente"
              value={formatBRL(data.valorPendente)}
              tone="warning"
            />
            <BiMetricCard
              label="Valor vencido"
              value={formatBRL(data.valorVencido)}
              tone="danger"
            />
            <BiMetricCard
              label="Taxa inadimplencia"
              value={formatPercent(data.taxaInadimplencia)}
              tone="danger"
              icon={AlertTriangle}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="size-4 text-gym-danger" />
              <div>
                <h2 className="font-display text-lg font-bold">Aging de inadimplencia</h2>
                <p className="text-xs text-muted-foreground">
                  Distribuicao por faixa de vencimento — {totalAging} conta(s) vencidas.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {AGING_CONFIG.map((bucket) => {
                const count = data.aging[bucket.key];
                const pct = totalAging > 0 ? (count / totalAging) * 100 : 0;
                return (
                  <div
                    key={bucket.key}
                    className="rounded-xl border border-border bg-card/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {bucket.label}
                      </span>
                      <span className={`text-2xl font-display font-bold ${bucket.tone === "danger" ? "text-gym-danger" : "text-gym-warning"}`}>
                        {count}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${bucket.bgClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {pct.toFixed(1)}% do total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
