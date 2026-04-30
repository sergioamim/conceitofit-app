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

  if (!metrics) {
    if (loading) {
      return <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">Carregando dashboard...</div>;
    }
    return <div className="text-sm text-muted-foreground">Sem dados para o dashboard.</div>;
  }

  return (
    <>
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.07] via-background to-background p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />
      <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground text-lg">Visão estratégica da sua academia em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
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
              className="bg-muted/40 border-border/60 rounded-xl h-11 text-sm focus:ring-primary/20 w-[180px] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tabs V2 */}
      <div className="inline-flex p-1.5 bg-muted/30 border border-border/40 rounded-2xl backdrop-blur-md">
        {([["CLIENTES", "Clientes", Users], ["VENDAS", "Vendas", CircleDollarSign], ["FINANCEIRO", "Financeiro", Banknote]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-[color,background-color] duration-100",
              tab === key
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <BiMetricCard label="Clientes ativos" value={String(metrics.statusAlunoCount.ATIVO)} description={`${metrics.statusAlunoCount.SUSPENSO} suspensos · ${metrics.statusAlunoCount.INATIVO} inativos`} icon={Users} tone="teal" />
                <BiMetricCard label="Novos prospects" value={String(metrics.prospectsNovos)} description="entradas no mês" icon={UserPlus} tone="accent" trend={deltaLabel(metrics.prospectsNovos, metrics.prospectsNovosAnterior).text} />
                <BiMetricCard label="Visitas aguardando" value={String(metrics.visitasAguardandoRetorno)} description="prioridade comercial" icon={CalendarClock} tone="warning" />
                <BiMetricCard label="Follow-up pendente" value={String(metrics.followupPendente)} description="prospects sem contato (48h+)" icon={AlertTriangle} tone="danger" />
              </div>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                  <div className="p-6 border-b border-border/40 bg-muted/10 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Prospects recentes</h2>
                    <div className="flex items-center gap-3">
                      <Link href="/prospects">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-lg">
                          Ver pipeline <ArrowRight size={14} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
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
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-border/40"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
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
                  </div>
                </div>

                <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                  <div className="p-6 border-b border-border/40 bg-muted/10 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Matrículas vencendo</h2>
                    <Link href="/contratos">
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-lg">
                        Ver todas <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="p-6">
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
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-border/40"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-gym-teal/10 flex items-center justify-center text-xs font-bold text-gym-teal">
                                {m.aluno?.nome?.charAt(0) || "—"}
                              </div>
                              <div>
                                <p className="text-sm font-bold tracking-tight">{m.aluno?.nome ?? "—"}</p>
                                <p className="text-[11px] text-muted-foreground">{m.plano?.nome} · vence {formatDate(m.dataFim)}</p>
                              </div>
                            </div>
                            <StatusBadge status={m.status} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "VENDAS" && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <BiMetricCard label="Contratos vendidos" value={String(metrics.matriculasDoMes)} description="matrículas criadas no mês" icon={BarChart3} tone="accent" trend={deltaLabel(metrics.matriculasDoMes, metrics.matriculasDoMesAnterior).text} />
                <BiMetricCard label="Valor total vendido" value={formatBRL(metrics.receitaDoMes)} description="somatório dos contratos" icon={CircleDollarSign} tone="teal" trend={deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior).text} />
                <BiMetricCard label="Média por contrato" value={formatBRL(metrics.matriculasDoMes ? metrics.receitaDoMes / metrics.matriculasDoMes : 0)} description="ticket médio de contrato" icon={TrendingUp} tone="teal" />
                <BiMetricCard label="Taxa de conversão" value={`${conversionRate}%`} description="matrículas / prospects novos" icon={UserCheck} tone="accent" />
              </div>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <div className="glass-card rounded-2xl border border-border/40 p-6 shadow-xl shadow-black/5">
                  <h2 className="mb-6 font-display text-lg font-bold">Mix de vendas no mês</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 group hover:bg-muted/30 transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Novas matrículas</p>
                      <p className="mt-2 font-display text-3xl font-extrabold text-gym-accent group-hover:scale-105 transition-transform origin-left">{formatBRL(metrics.vendasNovas)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 group hover:bg-muted/30 transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Recorrente</p>
                      <p className="mt-2 font-display text-3xl font-extrabold text-gym-teal group-hover:scale-105 transition-transform origin-left">{formatBRL(metrics.vendasRecorrentes)}</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl border border-border/40 p-6 shadow-xl shadow-black/5">
                  <h2 className="mb-6 font-display text-lg font-bold">Risco comercial</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Prospects em aberto</span>
                      <span className="font-extrabold text-lg">{metrics.prospectsEmAberto}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Sem contato recente</span>
                      <span className="font-extrabold text-lg text-gym-warning">{metrics.followupPendente}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Visitaram e aguardam</span>
                      <span className="font-extrabold text-lg text-gym-accent">{metrics.visitasAguardandoRetorno}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "FINANCEIRO" && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <BiMetricCard label="Recebimentos" value={formatBRL(metrics.receitaDoMes)} description="pagamentos recebidos" icon={Banknote} tone="teal" trend={deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior).text} />
                <BiMetricCard label="Ticket médio" value={formatBRL(metrics.ticketMedio)} description="por pagamento recebido" icon={CreditCard} tone="accent" trend={deltaLabel(metrics.ticketMedio, metrics.ticketMedioAnterior).text} />
                <BiMetricCard
                  label="Inadimplência"
                  value={formatBRL(metrics.inadimplencia)}
                  description="vencidos há até 30 dias (foco recuperação) · clique para painel lateral"
                  icon={TrendingDown}
                  tone="danger"
                  onPress={openFinanceInspector}
                  data-testid="cockpit-finance-panel-trigger"
                />
                <BiMetricCard label="A receber" value={formatBRL(metrics.aReceber)} description="pagamentos ainda em aberto" icon={HandCoins} tone="warning" />
              </div>

              <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                <div className="p-6 border-b border-border/40 bg-muted/10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">Vencidos para cobrança recente</h2>
                    <p className="text-xs text-muted-foreground mt-1">Vencimento nos últimos 30 dias (até a data selecionada) · acima disso, usar Pagamentos</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs font-bold"
                      onClick={openFinanceInspector}
                      data-testid="cockpit-finance-panel-open-button"
                    >
                      Painel lateral
                    </Button>
                    <Link href="/pagamentos">
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-lg">
                        Ver todos <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {metrics.pagamentosPendentes.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground opacity-50">Nenhum vencido nessa janela de 30 dias</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {metrics.pagamentosPendentes.map((p, i) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          transition={{ delay: i * 0.03 }}
                          key={p.id} 
                          className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-gym-danger/10 flex items-center justify-center text-gym-danger group-hover:scale-110 transition-transform">
                              <AlertTriangle size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{p.aluno?.nome ?? "—"}</p>
                              <p className="text-[11px] text-muted-foreground">Vence {formatDate(p.dataVencimento)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                            <StatusBadge status={p.status} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
