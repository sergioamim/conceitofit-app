"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Building2, CreditCard, TrendingDown, Wallet } from "lucide-react";
import { EmptyState, ListErrorState, ListLoadingSkeleton } from "@/components/shared/list-states";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableFilters, type FilterConfig, type ActiveFilters } from "@/components/shared/table-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminFinanceiroDashboard } from "@/backoffice/query";
import { formatBRL, formatDate, formatPercent } from "@/lib/formatters";
import type {
  DashboardFinanceiroAgingItem,
  DashboardFinanceiroInadimplente,
  DashboardFinanceiroPeriodo,
  DashboardFinanceiroPlanoComparativo,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const INADIMPLENTE_PAGE_SIZE = 5;

const PERIODO_OPTIONS: Array<{ value: DashboardFinanceiroPeriodo; label: string }> = [
  { value: "3M", label: "Últimos 3 meses" },
  { value: "6M", label: "Últimos 6 meses" },
  { value: "12M", label: "Últimos 12 meses" },
];

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="border-border/80 bg-card/90">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full border border-border/80 bg-secondary p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold leading-none text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function AgingBadge({ item }: { item: DashboardFinanceiroAgingItem }) {
  const className =
    item.faixa === "60_PLUS"
      ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
      : item.faixa === "31_60"
        ? "border-gym-warning/30 bg-gym-warning/10 text-gym-warning"
        : "border-border bg-secondary text-muted-foreground";

  return (
    <Badge variant="outline" className={className}>
      {item.label}
    </Badge>
  );
}

export default function AdminFinanceiroDashboardPage() {
  const [periodo, setPeriodo] = useState<DashboardFinanceiroPeriodo>("12M");

  const dashboardQuery = useAdminFinanceiroDashboard(periodo);

  const loading = dashboardQuery.isLoading;
  const error = dashboardQuery.error ? normalizeErrorMessage(dashboardQuery.error) : null;
  const dashboard = dashboardQuery.data ?? null;

  const maxMrr = useMemo(
    () => Math.max(1, ...(dashboard?.evolucaoMrr ?? []).map((item) => item.mrr)),
    [dashboard?.evolucaoMrr]
  );

  const mrrSeries = dashboard?.evolucaoMrr ?? [];

  const comparativoOrdenado = useMemo(() => {
    return [...(dashboard?.comparativoPlanos ?? [])].sort((left, right) => right.mrr - left.mrr);
  }, [dashboard?.comparativoPlanos]);

  // ── Transações recentes: filtro + paginação ──────────────────────────
  const [txFilters, setTxFilters] = useState<ActiveFilters>({});
  const [txPage, setTxPage] = useState(0);

  const txFilterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        type: "date-range" as const,
        key: "periodo_tx",
        label: "Período",
        placeholderStart: "Data início",
        placeholderEnd: "Data fim",
      },
      {
        type: "text" as const,
        key: "q_tx",
        label: "Buscar",
        placeholder: "Academia ou plano...",
        debounceMs: 250,
      },
    ],
    [],
  );

  const handleTxFiltersChange = useCallback((filters: ActiveFilters) => {
    setTxFilters(filters);
    setTxPage(0);
  }, []);

  const filteredTransacoes = useMemo(() => {
    let items = dashboard?.inadimplentes ?? [];
    const query = (txFilters.q_tx ?? "").toLowerCase().trim();
    if (query) {
      items = items.filter(
        (item) =>
          item.academiaNome.toLowerCase().includes(query) ||
          (item.planoNome ?? "").toLowerCase().includes(query),
      );
    }
    const startDate = txFilters.periodo_tx_start ?? "";
    const endDate = txFilters.periodo_tx_end ?? "";
    if (startDate || endDate) {
      items = items.filter((item) => {
        const venc = item.ultimaCobrancaVencida ?? "";
        if (!venc) return true;
        if (startDate && venc < startDate) return false;
        if (endDate && venc > endDate) return false;
        return true;
      });
    }
    return items;
  }, [dashboard?.inadimplentes, txFilters]);

  const txPageItems = useMemo(() => {
    const start = txPage * INADIMPLENTE_PAGE_SIZE;
    return filteredTransacoes.slice(start, start + INADIMPLENTE_PAGE_SIZE);
  }, [filteredTransacoes, txPage]);

  const txHasNext = (txPage + 1) * INADIMPLENTE_PAGE_SIZE < filteredTransacoes.length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Financeiro B2B</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Dashboard financeiro da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Consolida MRR, churn, inadimplência, aging de cobranças e composição da receita recorrente por plano.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período analisado</label>
          <Select value={periodo} onValueChange={(value) => setPeriodo(value as DashboardFinanceiroPeriodo)}>
            <SelectTrigger className="w-56 border-border bg-secondary" aria-label="Selecionar período do dashboard financeiro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              {PERIODO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/financeiro/planos">
            <Button type="button" variant="outline" className="border-border">
              Ver planos
            </Button>
          </Link>
          <Link href="/admin/financeiro/contratos">
            <Button type="button" variant="outline" className="border-border">
              Ver contratos
            </Button>
          </Link>
          <Link href="/admin/financeiro/cobrancas">
            <Button type="button" variant="ghost">
              Ver cobranças
            </Button>
          </Link>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void dashboardQuery.refetch()} /> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-xl border border-border bg-card/60" />
            ))}
          </div>
          <ListLoadingSkeleton rows={4} columns={4} />
          <ListLoadingSkeleton rows={4} columns={5} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="MRR atual"
              value={formatBRL(dashboard?.mrrAtual ?? 0)}
              description="Receita recorrente mensal consolidada."
              icon={Wallet}
            />
            <MetricCard
              title="MRR projetado"
              value={formatBRL(dashboard?.mrrProjetado ?? 0)}
              description="Projeção da carteira ativa para o próximo ciclo."
              icon={ArrowUpRight}
            />
            <MetricCard
              title="Academias ativas"
              value={String(dashboard?.totalAcademiasAtivas ?? 0)}
              description="Clientes B2B com contratos ativos ou trial."
              icon={Building2}
            />
            <MetricCard
              title="Inadimplentes"
              value={String(dashboard?.totalInadimplentes ?? 0)}
              description="Academias com valores em aberto no recorte."
              icon={AlertTriangle}
            />
            <MetricCard
              title="Churn mensal"
              value={formatPercent(dashboard?.churnRateMensal ?? 0)}
              description={`Previsão de receita: ${formatBRL(dashboard?.previsaoReceita ?? 0)}`}
              icon={TrendingDown}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card className="border-border/80 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle>Evolução de MRR</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Barras simples para acompanhar o comportamento da receita recorrente no período selecionado.
                </p>
              </CardHeader>
              <CardContent>
                {mrrSeries.length === 0 ? (
                  <EmptyState message="Sem série histórica de MRR para o período informado." />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {mrrSeries.map((item) => (
                      <div key={item.referencia} className="rounded-xl border border-border/80 bg-secondary/20 p-3">
                        <div className="flex h-40 items-end rounded-lg bg-gradient-to-t from-gym-accent/10 to-transparent p-3">
                          <div
                            className="w-full rounded-md bg-gym-accent/80 transition-all"
                            style={{ height: `${Math.max(10, (item.mrr / maxMrr) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{formatBRL(item.mrr)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle>Aging de cobranças</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Distribuição da carteira em atraso por faixa de vencimento.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(dashboard?.aging ?? []).length === 0 ? (
                  <EmptyState message="Nenhuma cobrança em aging para o recorte atual." />
                ) : (
                  (dashboard?.aging ?? []).map((item, idx) => (
                    <div key={`${item.faixa}-${idx}`} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <AgingBadge item={item} />
                        <span className="text-sm text-muted-foreground">{item.quantidade} cobrança(s)</span>
                      </div>
                      <p className="mt-3 font-display text-2xl font-bold text-foreground">{formatBRL(item.valor)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card className="border-border/80 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle>Transações recentes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Priorize contato e eventual suspensão a partir das maiores exposições financeiras.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <TableFilters
                  filters={txFilterConfigs}
                  onFiltersChange={handleTxFiltersChange}
                />
                <PaginatedTable<DashboardFinanceiroInadimplente>
                  columns={[
                    { label: "Data" },
                    { label: "Academia" },
                    { label: "Tipo" },
                    { label: "Valor" },
                    { label: "Status" },
                  ]}
                  items={txPageItems}
                  emptyText="Nenhuma transação encontrada no período selecionado."
                  getRowKey={(item) =>
                    `${item.academiaId ?? item.academiaNome}-${item.cobrancaId ?? item.contratoId ?? "row"}`
                  }
                  page={txPage}
                  pageSize={INADIMPLENTE_PAGE_SIZE}
                  total={filteredTransacoes.length}
                  hasNext={txHasNext}
                  onPrevious={() => setTxPage((p) => Math.max(0, p - 1))}
                  onNext={() => setTxPage((p) => p + 1)}
                  itemLabel="transações"
                  showPagination={filteredTransacoes.length > INADIMPLENTE_PAGE_SIZE}
                  tableAriaLabel="Tabela de transações recentes"
                  renderCells={(item) => (
                    <>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.ultimaCobrancaVencida ? formatDate(item.ultimaCobrancaVencida) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{item.academiaNome}</span>
                          <span className="text-xs text-muted-foreground">{item.planoNome ?? "Plano não informado"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
                          Inadimplência
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {formatBRL(item.valorEmAberto)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.diasEmAtraso > 0 ? "VENCIDO" : "PENDENTE"} />
                      </td>
                    </>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-gym-accent" />
                  <CardTitle>MRR por plano</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compare participação de receita entre os planos comercializados na plataforma.
                </p>
              </CardHeader>
              <CardContent>
                {comparativoOrdenado.length === 0 ? (
                  <EmptyState message="Nenhum comparativo de plano retornado pelo endpoint." />
                ) : (
                  <div className="space-y-3">
                    {comparativoOrdenado.map((item: DashboardFinanceiroPlanoComparativo) => (
                      <div key={item.planoId ?? item.planoNome} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.planoNome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.academiasAtivas} academia(s) ativas
                            </p>
                          </div>
                          <Badge variant="outline" className="border-gym-accent/30 bg-gym-accent/10 text-gym-accent">
                            {formatPercent(item.participacaoPct)}
                          </Badge>
                        </div>
                        <p className="mt-3 font-display text-2xl font-bold text-foreground">{formatBRL(item.mrr)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
