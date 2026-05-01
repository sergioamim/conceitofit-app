"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CircleDollarSign, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useDashboardTab } from "@/lib/query/use-dashboard";
import type { DashboardData, StatusAluno } from "@/lib/types";
import { CockpitFinanceSheet } from "./cockpit-finance-sheet";
import { Input } from "@/components/ui/input";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDate } from "@/lib/formatters";
import { ListErrorState } from "@/components/shared/list-states";
import { cn } from "@/lib/utils";
import { CockpitSkeleton } from "./cockpit-ui";
import { CockpitClientesTab } from "./cockpit-clientes-tab";
import { CockpitVendasTab } from "./cockpit-vendas-tab";
import { CockpitFinanceiroTab } from "./cockpit-financeiro-tab";
import type { NormalizedMetrics } from "./cockpit-helpers";

type DashboardTab = "CLIENTES" | "VENDAS" | "FINANCEIRO";

const TABS = [
  ["CLIENTES", "Clientes", Users],
  ["VENDAS", "Vendas", CircleDollarSign],
  ["FINANCEIRO", "Financeiro", Banknote],
] as const;

export function DashboardContent({
  initialData,
  initialDate,
}: {
  initialData: DashboardData | null;
  initialDate: string;
}) {
  const tenantContext = useTenantContext();
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
  const error = tabQuery.error ? normalizeErrorMessage(tabQuery.error) : null;

  const recentProspects = useMemo(() => {
    return (dashboardData?.prospectsRecentes ?? [])
      .filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO")
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao))
      .slice(0, 5);
  }, [dashboardData]);

  const conversionRate = useMemo(() => {
    if (!dashboardData || dashboardData.prospectsNovos === 0) return "0.0";
    return ((dashboardData.matriculasDoMes / dashboardData.prospectsNovos) * 100).toFixed(1);
  }, [dashboardData]);

  const metrics = useMemo((): NormalizedMetrics | null => {
    if (!dashboardData) return null;
    const defaultStatusCount: Record<StatusAluno, number> = {
      ATIVO: 0, INATIVO: 0, SUSPENSO: 0, CANCELADO: 0, BLOQUEADO: 0,
    };
    return {
      ...dashboardData,
      statusAlunoCount: { ...defaultStatusCount, ...(dashboardData.statusAlunoCount ?? {}) },
    };
  }, [dashboardData]);

  const openFinanceInspector = () => {
    if (!metrics) return;
    setFinanceSheetItems(metrics.pagamentosPendentes);
    setFinanceSheetInad(metrics.inadimplencia);
    setFinancePanelOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">Dashboard</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-border/55 bg-muted/35 p-1.5 shadow-sm">
            {TABS.map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors",
                  tab === key
                    ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-md ring-2 ring-primary/25"
                    : "text-muted-foreground hover:bg-background/85 hover:text-foreground",
                )}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <Input
            type="date"
            value={selectedDate}
            max={initialDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="h-11 w-full min-w-[10rem] max-w-[12.5rem] shrink-0 rounded-xl border-border bg-background text-sm font-semibold shadow-sm sm:w-auto"
            aria-label="Data de referência do dashboard"
          />
        </div>

        {error ? <ListErrorState error={error} onRetry={() => void tabQuery.refetch()} /> : null}

        {loading ? (
          <CockpitSkeleton />
        ) : !metrics ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados para o período selecionado.</p>
        ) : (
          <>
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
                  <CockpitClientesTab
                    metrics={metrics}
                    recentProspects={recentProspects}
                    tenantId={tenantId}
                    tenantReady={tenantContext.status === "ready"}
                    referenceDateISO={selectedDate}
                  />
                )}
                {tab === "VENDAS" && (
                  <CockpitVendasTab
                    metrics={metrics}
                    recentProspects={recentProspects}
                    conversionRate={conversionRate}
                  />
                )}
                {tab === "FINANCEIRO" && (
                  <CockpitFinanceiroTab
                    metrics={metrics}
                    openFinanceInspector={openFinanceInspector}
                    tenantId={tenantId}
                    tenantReady={tenantContext.status === "ready"}
                    referenceDateISO={selectedDate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
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
