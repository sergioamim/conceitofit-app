"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TenantPicker, type TenantOption } from "@/components/admin/agregadores/tenant-picker";
import { DashboardKpis } from "@/components/admin/agregadores/dashboard/dashboard-kpis";
import {
  ComparativoDonut,
  DistribuicaoSemanaChart,
  SerieTemporalChart,
} from "@/components/admin/agregadores/dashboard/dashboard-charts";
import { DashboardTopClientes } from "@/components/admin/agregadores/dashboard/dashboard-top-clientes";
import { useAdminAcademias, useAdminUnidades } from "@/backoffice/query";
import { useAgregadoresDashboard } from "@/lib/query/use-agregadores-admin";
import type { DashboardAgregadorFiltro } from "@/lib/api/agregadores-admin";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

/**
 * AG-12 — Dashboard BI dos agregadores (por tenant / mês).
 *
 * Controles:
 *   - TenantPicker (se não há `?tenantId` na URL)
 *   - Select mês/ano (últimos 12 meses) — reflete no estado de busca
 *   - Select agregador (Todos | Wellhub | TotalPass)
 *   - Botão Atualizar → refetch forçado
 *
 * Estado persiste em query params para deep-link. Enquanto o endpoint
 * backend AG-12 não estiver pronto, o fetcher cai em fixture determinística
 * (ver `buildDashboardFixture` em `agregadores-admin.ts`).
 */

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function AgregadoresDashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantId = searchParams?.get("tenantId") ?? null;
  const anoParam = Number(searchParams?.get("ano")) || null;
  const mesParam = Number(searchParams?.get("mes")) || null;
  const tipoParam = searchParams?.get("tipo") ?? null;

  // Defaults: mês atual do sistema — usa new Date() em render porque o
  // valor é estável por sessão e não é hidratado (é só usado no `effective*`).
  const now = new Date();
  const defaultAno = now.getFullYear();
  const defaultMes = now.getMonth() + 1;

  const ano = anoParam ?? defaultAno;
  const mes = mesParam ?? defaultMes;
  const tipo: DashboardAgregadorFiltro =
    tipoParam === "WELLHUB" || tipoParam === "TOTALPASS"
      ? (tipoParam as DashboardAgregadorFiltro)
      : "TODOS";

  const unidadesQuery = useAdminUnidades();
  const academiasQuery = useAdminAcademias();

  const academiaNomePorId = useMemo(() => {
    const map = new Map<string, string>();
    (academiasQuery.data ?? []).forEach((a) => map.set(a.id, a.nome));
    return map;
  }, [academiasQuery.data]);

  const tenants = useMemo<TenantOption[]>(() => {
    return (unidadesQuery.data ?? []).map((u) => ({
      id: u.id,
      nome: u.nome,
      academiaNome: u.academiaId
        ? academiaNomePorId.get(u.academiaId)
        : undefined,
      subdomain: u.subdomain,
    }));
  }, [unidadesQuery.data, academiaNomePorId]);

  const dashboardQuery = useAgregadoresDashboard({
    tenantId: tenantId ?? undefined,
    ano,
    mes,
    tipo,
  });

  function updateParams(patch: Partial<Record<string, string>>) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.replace(`/admin/integracoes/agregadores/dashboard?${params.toString()}`);
  }

  if (!tenantId) {
    return (
      <div data-testid="dashboard-tenant-picker">
        <p className="mb-4 text-sm text-muted-foreground">
          Selecione um tenant para abrir o dashboard.
        </p>
        <TenantPicker
          tenants={tenants}
          loading={unidadesQuery.isLoading}
          onSelect={(id) =>
            router.push(
              `/admin/integracoes/agregadores/dashboard?tenantId=${encodeURIComponent(id)}`,
            )
          }
        />
      </div>
    );
  }

  const last12Months = buildLast12MonthOptions(defaultAno, defaultMes);
  const currentMonthKey = `${ano}-${String(mes).padStart(2, "0")}`;
  const data = dashboardQuery.data;
  const error = dashboardQuery.error
    ? normalizeErrorMessage(dashboardQuery.error)
    : null;
  const loading = dashboardQuery.isLoading || dashboardQuery.isFetching;

  return (
    <div className="flex flex-col gap-6" data-testid="agregadores-dashboard-view">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href={`/admin/integracoes/agregadores?tenantId=${encodeURIComponent(tenantId)}`}>
            <ArrowLeft className="mr-1 size-4" />
            Voltar à configuração
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Tenant: <span className="font-mono">{tenantId}</span>
        </p>
      </div>

      {/* Controles */}
      <fieldset
        className="grid gap-3 rounded-lg border bg-card px-3 py-3 md:grid-cols-4"
        data-testid="dashboard-controls"
      >
        <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">
          Período e filtros
        </legend>
        <div className="space-y-1.5">
          <label
            htmlFor="select-mes-ano"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Mês / Ano
          </label>
          <Select
            value={currentMonthKey}
            onValueChange={(value) => {
              const [y, m] = value.split("-");
              updateParams({ ano: y, mes: String(parseInt(m, 10)) });
            }}
          >
            <SelectTrigger id="select-mes-ano" aria-label="Selecionar mês e ano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {last12Months.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="select-agregador"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Agregador
          </label>
          <Select
            value={tipo}
            onValueChange={(value) =>
              updateParams({ tipo: value === "TODOS" ? "" : value })
            }
          >
            <SelectTrigger id="select-agregador" aria-label="Filtrar agregador">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="WELLHUB">Wellhub</SelectItem>
              <SelectItem value="TOTALPASS">TotalPass</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-end justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => void dashboardQuery.refetch()}
            disabled={loading}
            data-testid="dashboard-refresh"
          >
            <RefreshCw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Atualizar
          </Button>
        </div>
      </fieldset>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger"
        >
          Falha ao carregar dashboard: {error}
        </div>
      ) : null}

      {loading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <DashboardKpis kpis={data.kpis} comparativo={data.comparativo} />

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <ChartPanel
              title="Série temporal — check-ins por dia"
              description="Check-ins (linha) e valor (barras) ao longo dos dias do mês."
            >
              <SerieTemporalChart data={data.serieDiaria} />
            </ChartPanel>
            <ChartPanel
              title="Comparativo por agregador"
              description="Wellhub vs TotalPass — toggle entre check-ins e valor."
            >
              <ComparativoDonut porAgregador={data.porAgregador} />
            </ChartPanel>
          </div>

          <ChartPanel
            title="Distribuição por dia da semana"
            description="Total acumulado de check-ins agregados por dia da semana."
          >
            <DistribuicaoSemanaChart data={data.distribuicaoSemana} />
          </ChartPanel>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Top 20 Clientes</h2>
                <p className="text-xs text-muted-foreground">
                  Clientes mais ativos no período — clique para abrir o perfil.
                </p>
              </div>
            </div>
            <DashboardTopClientes clientes={data.topClientes} />
          </section>
        </>
      ) : null}
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" data-testid="dashboard-skeleton">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-border bg-card/60"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card/60" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-card/60" />
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

function buildLast12MonthOptions(
  defaultAno: number,
  defaultMes: number,
): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 12; i++) {
    let m = defaultMes - i;
    let y = defaultAno;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const value = `${y}-${String(m).padStart(2, "0")}`;
    const label = `${MONTHS_PT[m - 1]} ${y}`;
    out.push({ value, label });
  }
  return out;
}
