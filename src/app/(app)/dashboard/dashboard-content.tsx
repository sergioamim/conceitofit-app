"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getDashboardApi } from "@/lib/api/dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardData, Prospect, StatusAluno } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDate } from "@/lib/formatters";
import { ListErrorState } from "@/components/shared/list-states";

type DashboardTab = "CLIENTES" | "VENDAS" | "FINANCEIRO";
const PROSPECTS_PAGE_SIZE = 10;

function deltaLabel(current: number, prev: number) {
  const diff = current - prev;
  const up = diff >= 0;
  return {
    up,
    text: `${up ? "+" : ""}${diff.toLocaleString("pt-BR")}`,
  };
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  delta,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  tone: "accent" | "teal" | "warning" | "danger";
  delta?: { up: boolean; text: string; label: string };
}) {
  const toneClass = {
    accent: "text-gym-accent border-gym-accent/20",
    teal: "text-gym-teal border-gym-teal/20",
    warning: "text-gym-warning border-gym-warning/20",
    danger: "text-gym-danger border-gym-danger/20",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Icon className={`size-4 ${toneClass.split(" ")[0]}`} />
      </div>
      <p className={`mt-2 font-display text-3xl font-bold leading-none ${toneClass.split(" ")[0]}`}>{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>}
      {delta && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          {delta.up ? <ArrowUpRight className="size-3.5 text-gym-teal" /> : <ArrowDownRight className="size-3.5 text-gym-danger" />}
          <span className="font-semibold">{delta.text}</span>
          <span>{delta.label}</span>
        </p>
      )}
    </div>
  );
}

export function DashboardContent({
  initialData,
  initialDate,
}: {
  initialData: DashboardData | null;
  initialDate: string;
}) {
  const tenantContext = useTenantContext();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData);
  const [showAllProspects, setShowAllProspects] = useState(false);
  const [prospectsPage, setProspectsPage] = useState<Prospect[]>([]);
  const [prospectsPageNumber, setProspectsPageNumber] = useState(1);
  const [prospectsPageHasNext, setProspectsPageHasNext] = useState(false);
  const [prospectsPageLoading, setProspectsPageLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [tab, setTab] = useState<DashboardTab>("CLIENTES");
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const dashboardDataCacheRef = useRef<Record<string, DashboardData>>({});
  const activeRequestKeyRef = useRef<string | null>(null);

  // Seed cache with server-fetched data
  useEffect(() => {
    if (initialData && tenantContext.tenantId) {
      dashboardDataCacheRef.current[`${tenantContext.tenantId}-${initialDate}`] = initialData;
    }
  }, [initialData, initialDate, tenantContext.tenantId]);

  const openProspects = useMemo(() => {
    if (!dashboardData?.prospectsRecentes) return [] as Prospect[];
    return [...dashboardData.prospectsRecentes]
      .filter((prospect) => prospect.status !== "CONVERTIDO" && prospect.status !== "PERDIDO")
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  }, [dashboardData?.prospectsRecentes]);

  const resetProspectsPagination = useCallback(() => {
    setShowAllProspects(false);
    setProspectsPage([]);
    setProspectsPageNumber(1);
    setProspectsPageHasNext(false);
  }, []);

  const dashboardCacheKey = useCallback(
    (referenceDate: string) => {
      if (!tenantContext.tenantId) return referenceDate;
      return `${tenantContext.tenantId}-${referenceDate}`;
    },
    [tenantContext.tenantId]
  );

  const loadProspectsPageData = useCallback((page: number) => {
    setProspectsPageLoading(true);
    const startIndex = Math.max(0, (page - 1) * PROSPECTS_PAGE_SIZE);
    const pageItems = openProspects.slice(startIndex, startIndex + PROSPECTS_PAGE_SIZE);
    setProspectsPage(pageItems);
    setProspectsPageNumber(page);
    setProspectsPageHasNext(startIndex + PROSPECTS_PAGE_SIZE < openProspects.length);
    setProspectsPageLoading(false);
  }, [openProspects]);

  const load = useCallback(async (referenceDate: string) => {
    if (!referenceDate || !tenantContext.tenantId) return;

    const cacheKey = dashboardCacheKey(referenceDate);
    activeRequestKeyRef.current = cacheKey;
    const cachedData = dashboardDataCacheRef.current[cacheKey];
    resetProspectsPagination();

    if (cachedData) {
      setDashboardData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextDashboardData = await getDashboardApi({
        tenantId: tenantContext.tenantId,
        referenceDate,
        scope: "FULL",
      });
      dashboardDataCacheRef.current[cacheKey] = nextDashboardData;
      if (activeRequestKeyRef.current !== cacheKey) return;
      setDashboardData(nextDashboardData);
    } catch (loadError) {
      if (activeRequestKeyRef.current !== cacheKey) return;
      setError(normalizeErrorMessage(loadError));
    } finally {
      if (activeRequestKeyRef.current === cacheKey) setLoading(false);
    }
  }, [tenantContext.tenantId, dashboardCacheKey, resetProspectsPagination]);

  useEffect(() => {
    resetProspectsPagination();
  }, [resetProspectsPagination, selectedDate]);

  // Only fetch client-side when date changes from initial
  useEffect(() => {
    if (!selectedDate || selectedDate === initialDate) return;
    if (tenantContext.tenantResolved) {
      void load(selectedDate);
    }
  }, [load, selectedDate, tenantContext.tenantResolved, initialDate]);

  // Re-fetch if tenant changes after hydration
  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) {
      const cacheKey = dashboardCacheKey(selectedDate);
      if (!dashboardDataCacheRef.current[cacheKey]) {
        void load(selectedDate);
      }
    }
  }, [tenantContext.tenantResolved, tenantContext.tenantId, dashboardCacheKey, selectedDate, load]);

  useEffect(() => {
    if (showAllProspects) {
      loadProspectsPageData(prospectsPageNumber);
    }
  }, [loadProspectsPageData, prospectsPageNumber, showAllProspects]);

  const recentProspects = useMemo(() => openProspects.slice(0, 5), [openProspects]);

  const conversionRate = useMemo(() => {
    if (!dashboardData || dashboardData.prospectsNovos === 0) return "0.0";
    return ((dashboardData.matriculasDoMes / dashboardData.prospectsNovos) * 100).toFixed(1);
  }, [dashboardData]);

  const previousConversionRate = useMemo(() => {
    if (!dashboardData || dashboardData.prospectsNovosAnterior === 0) return "0.0";
    return ((dashboardData.matriculasDoMesAnterior / dashboardData.prospectsNovosAnterior) * 100).toFixed(1);
  }, [dashboardData]);

  const conversionDelta = useMemo(() => {
    return deltaLabel(Number(conversionRate), Number(previousConversionRate));
  }, [conversionRate, previousConversionRate]);

  const metrics = useMemo(() => {
    if (!dashboardData) return null;
    const defaultStatusCount: Record<StatusAluno, number> = { ATIVO: 0, INATIVO: 0, SUSPENSO: 0, CANCELADO: 0 };
    return {
      ...dashboardData,
      statusAlunoCount: { ...defaultStatusCount, ...(dashboardData.statusAlunoCount ?? {}) },
    };
  }, [dashboardData]);

  if (!metrics) {
    if (loading) {
      return <div className="py-12 text-center text-sm text-muted-foreground">Carregando dashboard...</div>;
    }
    return <div className="text-sm text-muted-foreground">Sem dados para o dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Painel operacional com foco em decisão rápida</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[170px]">
            <Input
              type="date"
              value={selectedDate}
              max={initialDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                if (!nextDate) return;
                setSelectedDate(nextDate);
              }}
              className="bg-secondary border-border text-sm"
            />
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {([["CLIENTES", "Clientes"], ["VENDAS", "Vendas"], ["FINANCEIRO", "Financeiro"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? "bg-gym-accent/10 text-gym-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void load(selectedDate)} /> : null}

      {tab === "CLIENTES" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard title="Clientes ativos" value={String(metrics.statusAlunoCount.ATIVO)} subtitle={`${metrics.statusAlunoCount.SUSPENSO} suspensos · ${metrics.statusAlunoCount.INATIVO} inativos`} icon={Users} tone="teal" />
            <MetricCard title="Novos prospects" value={String(metrics.prospectsNovos)} subtitle="entradas no mês" icon={UserPlus} tone="accent" delta={{ ...deltaLabel(metrics.prospectsNovos, metrics.prospectsNovosAnterior), label: "vs mês anterior" }} />
            <MetricCard title="Visitas aguardando contato" value={String(metrics.visitasAguardandoRetorno)} subtitle="prioridade comercial" icon={CalendarClock} tone="warning" />
            <MetricCard title="Follow-up pendente (48h+)" value={String(metrics.followupPendente)} subtitle="prospects sem contato recente" icon={AlertTriangle} tone="danger" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-bold">Prospects recentes</h2>
                {showAllProspects ? (
                  <button type="button" onClick={() => setShowAllProspects(false)} className="text-xs text-gym-accent hover:underline">Ver recentes</button>
                ) : (
                  <button type="button" onClick={() => { setShowAllProspects(true); if (prospectsPage.length === 0) void loadProspectsPageData(1); }} className="text-xs text-gym-accent hover:underline">Ver todos</button>
                )}
              </div>
              {showAllProspects ? (
                prospectsPageLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Carregando prospects...</p>
                ) : prospectsPage.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum prospect ativo</p>
                ) : (
                  <div className="space-y-3">
                    {prospectsPage.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">{p.nome}</p><p className="text-xs text-muted-foreground">{p.telefone}</p></div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button type="button" disabled={prospectsPageLoading || prospectsPageNumber <= 1} onClick={() => void loadProspectsPageData(prospectsPageNumber - 1)} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
                      <span className="text-xs text-muted-foreground">Página {prospectsPageNumber}</span>
                      <button type="button" disabled={prospectsPageLoading || !prospectsPageHasNext} onClick={() => void loadProspectsPageData(prospectsPageNumber + 1)} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">Próxima</button>
                    </div>
                  </div>
                )
              ) : recentProspects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum prospect ativo</p>
              ) : (
                <div className="space-y-3">
                  {recentProspects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div><p className="text-sm font-medium">{p.nome}</p><p className="text-xs text-muted-foreground">{p.telefone}</p></div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-bold">Matrículas vencendo em 7 dias</h2>
                <Link href="/matriculas" className="text-xs text-gym-accent hover:underline">Ver todas</Link>
              </div>
              {metrics.matriculasVencendo.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma matrícula vencendo</p>
              ) : (
                <div className="divide-y divide-border">
                  {metrics.matriculasVencendo.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div><p className="text-sm font-medium">{m.aluno?.nome ?? "—"}</p><p className="text-xs text-muted-foreground">{m.plano?.nome} · vence {formatDate(m.dataFim)}</p></div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "VENDAS" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard title="Contratos vendidos" value={String(metrics.matriculasDoMes)} subtitle="matrículas criadas no mês" icon={BarChart3} tone="accent" delta={{ ...deltaLabel(metrics.matriculasDoMes, metrics.matriculasDoMesAnterior), label: "vs mês anterior" }} />
            <MetricCard title="Valor total vendido" value={formatBRL(metrics.receitaDoMes)} subtitle="somatório dos contratos" icon={CircleDollarSign} tone="teal" delta={{ ...deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior), label: "vs mês anterior" }} />
            <MetricCard title="Média por contrato" value={formatBRL(metrics.matriculasDoMes ? metrics.receitaDoMes / metrics.matriculasDoMes : 0)} subtitle="ticket médio de contrato" icon={TrendingUp} tone="teal" />
            <MetricCard title="Taxa de conversão" value={`${conversionRate}%`} subtitle="matrículas / prospects novos" icon={UserCheck} tone="accent" delta={{ ...conversionDelta, label: "vs mês anterior" }} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-base font-bold">Mix de vendas no mês</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Novas matrículas</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gym-accent">{formatBRL(metrics.vendasNovas)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recorrente (mensalidades)</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gym-teal">{formatBRL(metrics.vendasRecorrentes)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-base font-bold">Risco comercial</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"><span className="text-sm text-muted-foreground">Prospects em aberto</span><span className="font-bold">{metrics.prospectsEmAberto}</span></div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"><span className="text-sm text-muted-foreground">Sem contato recente</span><span className="font-bold text-gym-warning">{metrics.followupPendente}</span></div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"><span className="text-sm text-muted-foreground">Visitaram e aguardam retorno</span><span className="font-bold text-gym-accent">{metrics.visitasAguardandoRetorno}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "FINANCEIRO" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard title="Recebimentos do mês" value={formatBRL(metrics.receitaDoMes)} subtitle="pagamentos efetivamente recebidos" icon={Banknote} tone="teal" delta={{ ...deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior), label: "vs mês anterior" }} />
            <MetricCard title="Ticket médio" value={formatBRL(metrics.ticketMedio)} subtitle="por pagamento recebido" icon={CreditCard} tone="accent" delta={{ ...deltaLabel(metrics.ticketMedio, metrics.ticketMedioAnterior), label: "vs mês anterior" }} />
            <MetricCard title="Inadimplência (vencidos)" value={formatBRL(metrics.inadimplencia)} subtitle="valor vencido não recebido" icon={TrendingDown} tone="danger" />
            <MetricCard title="A receber (pendente)" value={formatBRL(metrics.aReceber)} subtitle="pagamentos ainda em aberto" icon={HandCoins} tone="warning" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Pagamentos pendentes e vencidos</h2>
              <Link href="/pagamentos" className="text-xs text-gym-accent hover:underline">Ver todos</Link>
            </div>
            {metrics.pagamentosPendentes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pagamento pendente</p>
            ) : (
              <div className="space-y-3">
                {metrics.pagamentosPendentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3">
                    <div><p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p><p className="text-xs text-muted-foreground">Vence {formatDate(p.dataVencimento)}</p></div>
                    <div className="text-right"><p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p><StatusBadge status={p.status} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
