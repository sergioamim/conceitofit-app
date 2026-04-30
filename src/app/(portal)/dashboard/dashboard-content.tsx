"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useDashboardTab } from "@/lib/query/use-dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardData, StatusAluno } from "@/lib/types";
import { CockpitFinanceSheet } from "./cockpit-finance-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDate } from "@/lib/formatters";
import { ListErrorState } from "@/components/shared/list-states";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { cn } from "@/lib/utils";
import {
  CockpitHeroBar,
  CockpitInsightStrip,
  CockpitPanel,
  CockpitTrendPlaceholder,
} from "@/app/(portal)/dashboard/cockpit-ui";

type DashboardTab = "CLIENTES" | "VENDAS" | "FINANCEIRO";
const PROSPECTS_PAGE_SIZE = 10;

const KPI_RAIL_CLASS =
  "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:snap-none lg:overflow-visible lg:pb-0";

function railFromShare(part: number, whole: number) {
  if (whole <= 0 || part <= 0) return 24;
  return Math.round(Math.min(100, Math.max(12, (part / whole) * 100)));
}

function railMomentum(current: number, previous: number) {
  const m = Math.max(current, previous, 1);
  return Math.round(Math.min(100, Math.max(18, (current / m) * 100)));
}

function deltaLabel(current: number, prev: number) {
  const diff = current - prev;
  const up = diff >= 0;
  return {
    up,
    text: `${up ? "+" : ""}${diff.toLocaleString("pt-BR")}`,
  };
}

export function DashboardContent({
  initialData,
  initialDate,
}: {
  initialData: DashboardData | null;
  initialDate: string;
}) {
  const tenantContext = useTenantContext();
  const [showAllProspects, setShowAllProspects] = useState(false);
  const [prospectsPageNumber, setProspectsPageNumber] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [tab, setTab] = useState<DashboardTab>("CLIENTES");
  const [financePanelOpen, setFinancePanelOpen] = useState(false);
  const [financeSheetItems, setFinanceSheetItems] = useState<DashboardData["pagamentosPendentes"]>([]);
  const [financeSheetInad, setFinanceSheetInad] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState<Record<DashboardTab, boolean>>({
    CLIENTES: true,
    VENDAS: false,
    FINANCEIRO: false,
  });

  useEffect(() => {
    setVisitedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  }, [tab]);

  const tenantId = tenantContext.tenantId;

  const qClientes = useDashboardTab({
    tenantId,
    referenceDate: selectedDate,
    scope: "CLIENTES",
    enabled: Boolean(tenantId) && visitedTabs.CLIENTES,
    initialData: initialData ?? undefined,
  });
  const qVendas = useDashboardTab({
    tenantId,
    referenceDate: selectedDate,
    scope: "VENDAS",
    enabled: Boolean(tenantId) && visitedTabs.VENDAS,
  });
  const qFinanceiro = useDashboardTab({
    tenantId,
    referenceDate: selectedDate,
    scope: "FINANCEIRO",
    enabled: Boolean(tenantId) && visitedTabs.FINANCEIRO,
  });

  const tabQuery =
    tab === "CLIENTES" ? qClientes : tab === "VENDAS" ? qVendas : qFinanceiro;
  const dashboardData = tabQuery.data;
  const loading = Boolean(tenantId) && !dashboardData && tabQuery.isPending;
  const queryError = tabQuery.error;

  const error = queryError ? normalizeErrorMessage(queryError) : null;

  function refetch() {
    void tabQuery.refetch();
  }

  const openProspects = useMemo(() => {
    const prospects = dashboardData?.prospectsRecentes ?? [];
    return [...prospects]
      .filter((prospect) => prospect.status !== "CONVERTIDO" && prospect.status !== "PERDIDO")
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  }, [dashboardData]);

  const prospectsPage = useMemo(() => {
    const startIndex = Math.max(0, (prospectsPageNumber - 1) * PROSPECTS_PAGE_SIZE);
    return openProspects.slice(startIndex, startIndex + PROSPECTS_PAGE_SIZE);
  }, [openProspects, prospectsPageNumber]);

  const recentProspects = useMemo(() => openProspects.slice(0, 5), [openProspects]);

  const conversionRate = useMemo(() => {
    if (!dashboardData || dashboardData.prospectsNovos === 0) return "0.0";
    return ((dashboardData.matriculasDoMes / dashboardData.prospectsNovos) * 100).toFixed(1);
  }, [dashboardData]);

  const metrics = useMemo(() => {
    if (!dashboardData) return null;
    const defaultStatusCount: Record<StatusAluno, number> = { ATIVO: 0, INATIVO: 0, SUSPENSO: 0, CANCELADO: 0, BLOQUEADO: 0 };
    return {
      ...dashboardData,
      statusAlunoCount: { ...defaultStatusCount, ...(dashboardData.statusAlunoCount ?? {}) },
    };
  }, [dashboardData]);

  const openFinanceInspector = () => {
    if (!metrics || tab !== "FINANCEIRO") return;
    setFinanceSheetItems(metrics.pagamentosPendentes);
    setFinanceSheetInad(metrics.inadimplencia);
    setFinancePanelOpen(true);
  };

  const activeUnitName = tenantContext.activeTenant?.nome?.trim() || "Unidade ativa (contexto operacional)";

  const cockpitInsight = useMemo(() => {
    if (!metrics) return null;
    const pendencias = metrics.pagamentosPendentes.length;
    if (tab === "CLIENTES") {
      return {
        tone: "warning" as const,
        node: (
          <>
            Priorize <strong>{metrics.followupPendente} follow-ups</strong> pendentes ·{" "}
            <strong>{metrics.visitasAguardandoRetorno} visitas</strong> aguardando retorno ·{" "}
            <strong>{metrics.statusAlunoCount.SUSPENSO}</strong> suspensos na carteira desta unidade.
          </>
        ),
      };
    }
    if (tab === "VENDAS") {
      return {
        tone: "accent" as const,
        node: (
          <>
            Ciclo comercial: <strong>{metrics.matriculasDoMes} contratos</strong> no período com{" "}
            <strong>{metrics.prospectsNovos}</strong> prospects novos (aprox.{" "}
            <strong>{conversionRate}%</strong> de conversão declarada).
          </>
        ),
      };
    }
    return {
      tone: "danger" as const,
      node: (
        <>
          Janela cobrança (30 dias até a referência): <strong>{pendencias}</strong> lançamento(s) nesta lista · KPI
          inadimplência <strong>{formatBRL(metrics.inadimplencia)}</strong>. Use o painel lateral para foco em
          recuperação.
        </>
      ),
    };
  }, [metrics, tab, conversionRate]);

  if (!metrics) {
    if (loading) {
      return <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">Carregando dashboard...</div>;
    }
    return <div className="text-sm text-muted-foreground">Sem dados para o dashboard.</div>;
  }

  const baseCarteira =
    metrics.statusAlunoCount.ATIVO +
    metrics.statusAlunoCount.INATIVO +
    metrics.statusAlunoCount.SUSPENSO +
    metrics.statusAlunoCount.CANCELADO +
    metrics.statusAlunoCount.BLOQUEADO;

  return (
    <>
    <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-muted/40 via-background to-background p-3 shadow-inner sm:p-5 md:p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        aria-hidden
      />
      <div className="space-y-8">
      <CockpitHeroBar unitLabel={activeUnitName} dateLabel={formatDate(selectedDate)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Período operacional</p>
          <p className="mt-1 text-xs text-muted-foreground">Datas futuras ficam bloqueadas — sempre alinhadas ao FE do backend.</p>
        </div>
        <div className="relative group shrink-0">
          <Input
            type="date"
            value={selectedDate}
            max={initialDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              if (!nextDate) return;
              setSelectedDate(nextDate);
              setShowAllProspects(false);
              setProspectsPageNumber(1);
            }}
            className="h-11 w-[190px] rounded-xl border-primary/25 bg-background/95 text-sm font-semibold shadow-sm focus-visible:ring-primary/35"
          />
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-border/55 bg-muted/35 p-1.5 shadow-inner backdrop-blur-md">
        {([["CLIENTES", "Clientes", Users], ["VENDAS", "Vendas", CircleDollarSign], ["FINANCEIRO", "Financeiro", Banknote]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black transition-colors",
              tab === key
                ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-xl shadow-primary/30 ring-2 ring-lime-200/35"
                : "text-muted-foreground hover:bg-background/85 hover:text-foreground",
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {cockpitInsight ? (
        <CockpitInsightStrip tone={cockpitInsight.tone}>{cockpitInsight.node}</CockpitInsightStrip>
      ) : null}

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {tab === "CLIENTES" && (
            <>
              <div className={KPI_RAIL_CLASS}>
                <BiMetricCard
                  compact
                  label="Clientes ativos"
                  value={String(metrics.statusAlunoCount.ATIVO)}
                  description={`${metrics.statusAlunoCount.SUSPENSO} suspensos · ${metrics.statusAlunoCount.INATIVO} inativos`}
                  icon={Users}
                  tone="teal"
                  railPercent={railFromShare(metrics.statusAlunoCount.ATIVO, baseCarteira)}
                />
                <BiMetricCard
                  compact
                  label="Novos prospects"
                  value={String(metrics.prospectsNovos)}
                  description="Entradas no período atual"
                  icon={UserPlus}
                  tone="accent"
                  trend={deltaLabel(metrics.prospectsNovos, metrics.prospectsNovosAnterior).text}
                  railPercent={railMomentum(metrics.prospectsNovos, metrics.prospectsNovosAnterior)}
                />
                <BiMetricCard
                  compact
                  label="Visitas aguardando"
                  value={String(metrics.visitasAguardandoRetorno)}
                  description="Prospects que já visitaram e precisam de retorno"
                  icon={CalendarClock}
                  tone="warning"
                  railPercent={railFromShare(
                    metrics.visitasAguardandoRetorno,
                    Math.max(metrics.prospectsEmAberto + metrics.visitasAguardandoRetorno, 1),
                  )}
                />
                <BiMetricCard
                  compact
                  label="Follow-up pendente"
                  value={String(metrics.followupPendente)}
                  description="Sem contato alinhado (48h+) — mesmo escopo CLIENTES da API"
                  icon={AlertTriangle}
                  tone="danger"
                  railPercent={railFromShare(
                    metrics.followupPendente,
                    Math.max(metrics.followupPendente + metrics.prospectsEmAberto, 1),
                  )}
                />
              </div>

              <CockpitTrendPlaceholder
                title="Distribuição comercial prevista"
                caption="Protótipo visual — será substituído pela série combinada assim que backend expuser `series[]` para escopo CLIENTES."
              />

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <CockpitPanel
                  accent="purple"
                  title="Prospects recentes"
                  subtitle="Ordenação por última interação dentro do cockpit"
                  actions={
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
                      <Link href="/prospects">
                        Ver pipeline <ArrowRight size={14} className="ml-1 inline" />
                      </Link>
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    {(showAllProspects ? prospectsPage : recentProspects).length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground opacity-50">Nenhum prospect ativo</p>
                    ) : (
                      (showAllProspects ? prospectsPage : recentProspects).map((p, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 transition-colors hover:border-primary/35"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/12 text-xs font-black text-primary">
                              {p.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{p.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{p.telefone}</p>
                            </div>
                          </div>
                          <StatusBadge status={p.status} />
                        </motion.div>
                      ))
                    )}
                  </div>
                </CockpitPanel>

                <CockpitPanel
                  accent="teal"
                  title="Matrículas vencendo"
                  subtitle="Sincronizado com o payload da aba ativa (`scope=CLIENTES`)"
                  actions={
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
                      <Link href="/contratos">
                        Ver todas <ArrowRight size={14} className="ml-1 inline" />
                      </Link>
                    </Button>
                  }
                >
                  {metrics.matriculasVencendo.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground opacity-50">Nenhuma matrícula vencendo</p>
                  ) : (
                    <div className="space-y-4">
                      {metrics.matriculasVencendo.map((m, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={m.id}
                          className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 transition-colors hover:border-gym-teal/35"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-gym-teal/12 text-xs font-black text-gym-teal">
                              {m.aluno?.nome?.charAt(0) || "—"}
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{m.aluno?.nome ?? "—"}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {m.plano?.nome} · vence {formatDate(m.dataFim)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={m.status} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CockpitPanel>
              </div>
            </>
          )}

          {tab === "VENDAS" && (
            <>
              <div className={KPI_RAIL_CLASS}>
                <BiMetricCard
                  compact
                  label="Contratos vendidos"
                  value={String(metrics.matriculasDoMes)}
                  description="Novas matrículas computadas no período"
                  icon={BarChart3}
                  tone="accent"
                  trend={deltaLabel(metrics.matriculasDoMes, metrics.matriculasDoMesAnterior).text}
                  railPercent={railMomentum(metrics.matriculasDoMes, metrics.matriculasDoMesAnterior)}
                />
                <BiMetricCard
                  compact
                  label="Valor total vendido"
                  value={formatBRL(metrics.receitaDoMes)}
                  description="Somando contratos + aditivos refletidos aqui"
                  icon={CircleDollarSign}
                  tone="teal"
                  trend={deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior).text}
                  railPercent={railMomentum(metrics.receitaDoMes, metrics.receitaDoMesAnterior)}
                />
                <BiMetricCard
                  compact
                  label="Média por contrato"
                  value={formatBRL(metrics.matriculasDoMes ? metrics.receitaDoMes / metrics.matriculasDoMes : 0)}
                  description="Ticket médio do período atual"
                  icon={TrendingUp}
                  tone="teal"
                  railPercent={
                    metrics.matriculasDoMes === 0
                      ? 30
                      : railMomentum(metrics.receitaDoMes / metrics.matriculasDoMes, metrics.receitaDoMesAnterior / Math.max(metrics.matriculasDoMesAnterior, 1))
                  }
                />
                <BiMetricCard
                  compact
                  label="Taxa de conversão"
                  value={`${conversionRate}%`}
                  description="Prospects novos vs matrículas (rápido, mesmo payload API)"
                  icon={UserCheck}
                  tone="accent"
                  railPercent={Math.min(100, Math.round((Number.parseFloat(conversionRate) || 0) * 3 + 18))}
                />
              </div>

              <CockpitTrendPlaceholder
                title="Curva projetada vs realizado — vendas"
                caption="Enquanto o backend não fecha `series[]`, mostramos curva-guida para você validar espaçamento/visual."
              />

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <CockpitPanel accent="primary" title="Mix de vendas no mês" subtitle="Breakdown rápido do payload `scope=VENDAS`">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 transition-colors hover:bg-muted/30">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Novas matrículas</p>
                      <p className="mt-2 font-display text-3xl font-black text-gym-accent">{formatBRL(metrics.vendasNovas)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 transition-colors hover:bg-muted/30">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Recorrente</p>
                      <p className="mt-2 font-display text-3xl font-black text-gym-teal">{formatBRL(metrics.vendasRecorrentes)}</p>
                    </div>
                  </div>
                </CockpitPanel>

                <CockpitPanel accent="danger" title="Risco comercial" subtitle="Combina KPIs já expostos no dashboard operacional">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4">
                      <span className="text-sm font-medium text-muted-foreground">Prospects em aberto</span>
                      <span className="text-lg font-black">{metrics.prospectsEmAberto}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4">
                      <span className="text-sm font-medium text-muted-foreground">Sem contato recente</span>
                      <span className="text-lg font-black text-gym-warning">{metrics.followupPendente}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4">
                      <span className="text-sm font-medium text-muted-foreground">Visitaram e aguardam</span>
                      <span className="text-lg font-black text-gym-accent">{metrics.visitasAguardandoRetorno}</span>
                    </div>
                  </div>
                </CockpitPanel>
              </div>
            </>
          )}

          {tab === "FINANCEIRO" && (
            <>
              <div className={KPI_RAIL_CLASS}>
                <BiMetricCard
                  compact
                  label="Recebimentos"
                  value={formatBRL(metrics.receitaDoMes)}
                  description="Pagamentos confirmados no período atual"
                  icon={Banknote}
                  tone="teal"
                  trend={deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior).text}
                  railPercent={railMomentum(metrics.receitaDoMes, metrics.receitaDoMesAnterior)}
                />
                <BiMetricCard
                  compact
                  label="Ticket médio"
                  value={formatBRL(metrics.ticketMedio)}
                  description="Média ponderada dos recebimentos contabilizados"
                  icon={CreditCard}
                  tone="accent"
                  trend={deltaLabel(metrics.ticketMedio, metrics.ticketMedioAnterior).text}
                  railPercent={railMomentum(metrics.ticketMedio, metrics.ticketMedioAnterior)}
                />
                <BiMetricCard
                  compact
                  label="Inadimplência"
                  value={formatBRL(metrics.inadimplencia)}
                  description="Até 30 dias antes da referência — painel lateral lista o detalhe"
                  icon={TrendingDown}
                  tone="danger"
                  onPress={openFinanceInspector}
                  data-testid="cockpit-finance-panel-trigger"
                  railPercent={Math.min(100, 28 + Math.min(metrics.pagamentosPendentes.length, 14) * 5)}
                />
                <BiMetricCard
                  compact
                  label="A receber"
                  value={formatBRL(metrics.aReceber)}
                  description="Total ainda em aberto segundo o snapshot enviado pela API"
                  icon={HandCoins}
                  tone="warning"
                  railPercent={railFromShare(metrics.aReceber, metrics.aReceber + metrics.receitaDoMes)}
                />
              </div>

              <CockpitTrendPlaceholder
                title="Fluxo de caixa projetado"
                caption="Placeholder visual — substituído por séries reais (recebimentos × inadimplência) na próxima entrega de contrato."
              />

              <CockpitPanel
                accent="danger"
                title="Vencidos para cobrança recente"
                subtitle="Vencimento entre D-30 e a data de referência selecionada (mesma regra do KPI de inadimplência)"
                actions={
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-xl text-xs font-bold"
                      onClick={openFinanceInspector}
                      data-testid="cockpit-finance-panel-open-button"
                    >
                      Painel lateral
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
                      <Link href="/pagamentos">
                        Ver todos <ArrowRight size={14} className="ml-1 inline" />
                      </Link>
                    </Button>
                  </>
                }
              >
                {metrics.pagamentosPendentes.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum vencido nessa janela de 30 dias.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {metrics.pagamentosPendentes.map((p, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        key={p.id}
                        className="flex items-center justify-between rounded-2xl border border-border/35 bg-muted/15 p-4 transition-colors hover:border-gym-danger/35"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-gym-danger/12 text-gym-danger">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">{p.aluno?.nome ?? "—"}</p>
                            <p className="text-[11px] text-muted-foreground">Vence {formatDate(p.dataVencimento)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gym-accent">{formatBRL(p.valorFinal)}</p>
                          <StatusBadge status={p.status} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CockpitPanel>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
    <CockpitFinanceSheet
      open={financePanelOpen}
      onOpenChange={setFinancePanelOpen}
      referenceLabel={formatDate(selectedDate)}
      items={financeSheetItems}
      inadimplenciaTotal={financeSheetInad}
    />
    </>
  );
}
