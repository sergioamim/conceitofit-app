"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { BellRing, CheckCircle2, CircleAlert, Rocket, TriangleAlert, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, ListErrorState, ListLoadingSkeleton } from "@/components/shared/list-states";
import { PaginatedTable, type PaginatedTableColumn } from "@/components/shared/paginated-table";
import { TableFilters, type ActiveFilters, type FilterConfig } from "@/components/shared/table-filters";
import { useAdminAlertasOperacionais } from "@/backoffice/query";
import { useAcademiaSuggestion } from "@/backoffice/lib/use-academia-suggestion";
import { formatDateTime, formatPercent } from "@/lib/formatters";
import type {
  AlertaOperacional,
  AlertaOperacionalSeveridade,
  AlertaOperacionalTipo,
  FeatureUsageIndicator,
  FeatureUsageKey,
  FeatureUsageStatus,
} from "@/lib/types";

type UsageFilter = "TODAS" | FeatureUsageStatus;

const USAGE_OPTIONS: Array<{ value: UsageFilter; label: string }> = [
  { value: "TODAS", label: "Todas as features" },
  { value: "EM_USO", label: "Em uso" },
  { value: "ATIVA_SEM_USO", label: "Ativas sem uso" },
  { value: "INATIVA", label: "Inativas" },
];

const FEATURE_COLUMNS: Array<{ key: FeatureUsageKey; label: string }> = [
  { key: "treinos", label: "Treinos" },
  { key: "crm", label: "CRM" },
  { key: "catraca", label: "Catraca" },
  { key: "vendasOnline", label: "Vendas online" },
  { key: "bi", label: "BI" },
];

const PAGE_SIZE = 20;

const ALERTAS_TABLE_COLUMNS: PaginatedTableColumn[] = [
  { label: "Tipo" },
  { label: "Severidade", className: "w-[120px]" },
  { label: "Academia" },
  { label: "Mensagem" },
  { label: "Data/Hora", className: "w-[160px]" },
  { label: "Ações", className: "w-[160px]" },
];

const TIPO_LABELS: Record<AlertaOperacionalTipo, string> = {
  SEM_LOGIN_ADMIN: "Sem login",
  SEM_MATRICULAS_ATIVAS: "Sem matrículas",
  PICO_CANCELAMENTOS: "Cancelamentos",
  CONTRATO_VENCENDO: "Contrato vencendo",
  INADIMPLENCIA_ALTA: "Inadimplência",
  OUTRO: "Outro",
};

function resolveSeverityConfig(severidade: AlertaOperacionalSeveridade) {
  switch (severidade) {
    case "CRITICAL":
      return {
        label: "Crítico",
        className: "border-gym-danger/25 bg-gym-danger/10 text-gym-danger",
      };
    case "WARNING":
      return {
        label: "Atenção",
        className: "border-gym-warning/25 bg-gym-warning/10 text-gym-warning",
      };
    case "INFO":
    default:
      return {
        label: "Info",
        className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
      };
  }
}

function resolveFeatureUsageConfig(status: FeatureUsageStatus) {
  switch (status) {
    case "EM_USO":
      return {
        label: "Em uso",
        className: "border-gym-teal/20 bg-gym-teal/10 text-gym-teal",
      };
    case "ATIVA_SEM_USO":
      return {
        label: "Ativa sem uso",
        className: "border-gym-warning/20 bg-gym-warning/10 text-gym-warning",
      };
    case "INATIVA":
    default:
      return {
        label: "Inativa",
        className: "border-border bg-secondary text-muted-foreground",
      };
  }
}

function SummaryCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: "critical" | "warning" | "positive";
}) {
  const toneClassName =
    tone === "critical"
      ? "border-gym-danger/25 bg-gym-danger/10"
      : tone === "warning"
        ? "border-gym-warning/25 bg-gym-warning/10"
        : "border-gym-teal/25 bg-gym-teal/10";

  const Icon = tone === "critical" ? TriangleAlert : tone === "warning" ? CircleAlert : Rocket;

  return (
    <Card className={toneClassName}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full border border-border/60 bg-card/70 p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold leading-none text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severidade }: { severidade: AlertaOperacionalSeveridade }) {
  const config = resolveSeverityConfig(severidade);
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

function FeatureUsageBadge({ indicator }: { indicator: FeatureUsageIndicator }) {
  const config = resolveFeatureUsageConfig(indicator.status);
  return (
    <div className="space-y-1">
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
      <p className="text-[11px] text-muted-foreground">
        {indicator.ultimoUsoEm ? `Último uso ${formatDateTime(indicator.ultimoUsoEm)}` : "Sem uso recente"}
      </p>
    </div>
  );
}

export default function AdminOperationalAlertsPage() {
  const { toast } = useToast();
  const alertasQuery = useAdminAlertasOperacionais();
  const alertas = alertasQuery.data?.alertas.items ?? [];
  const featureUsage = alertasQuery.data?.featureUsage.items ?? [];
  const loading = alertasQuery.isLoading;
  const error = alertasQuery.error ? alertasQuery.error.message : null;

  const academiaSuggestion = useAcademiaSuggestion();

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [page, setPage] = useState(0);
  const [resolvedAlertIds, setResolvedAlertIds] = useState<string[]>([]);

  const [usageFilter, setUsageFilter] = useState<UsageFilter>("TODAS");
  const [usageSearch, setUsageSearch] = useState("");

  const handleFiltersChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters);
    setPage(0);
  }, []);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        type: "select",
        key: "severidade",
        label: "Severidade",
        placeholder: "Todas as severidades",
        options: [
          { value: "CRITICAL", label: "Críticas" },
          { value: "WARNING", label: "Atenção" },
          { value: "INFO", label: "Informativas" },
        ],
      },
      {
        type: "suggestion",
        key: "academia",
        label: "Academia",
        placeholder: "Buscar academia...",
        options: academiaSuggestion.options,
        onFocusOpen: academiaSuggestion.onFocusOpen,
        preloadOnFocus: true,
      },
      {
        type: "date-range",
        key: "periodo",
        label: "Período",
        placeholderStart: "Data início",
        placeholderEnd: "Data fim",
      },
    ],
    [academiaSuggestion.options, academiaSuggestion.onFocusOpen],
  );

  const visibleAlertas = useMemo(
    () => alertas.filter((alerta) => !alerta.id || !resolvedAlertIds.includes(alerta.id)),
    [alertas, resolvedAlertIds],
  );

  const filteredAlertas = useMemo(() => {
    const severidade = activeFilters.severidade ?? "";
    const academiaId = activeFilters.academia ?? "";
    const periodoStart = activeFilters.periodo_start ?? "";
    const periodoEnd = activeFilters.periodo_end ?? "";

    return visibleAlertas.filter((alerta) => {
      if (severidade && alerta.severidade !== severidade) {
        return false;
      }

      if (academiaId && alerta.academiaId !== academiaId) {
        // fallback: match by name if academiaId isn't present on alert
        const matchedOption = academiaSuggestion.options.find((o) => o.id === academiaId);
        if (matchedOption && !alerta.academiaNome.toLowerCase().includes(matchedOption.label.toLowerCase())) {
          return false;
        }
        if (!matchedOption) return false;
      }

      if (periodoStart) {
        const alertDate = alerta.data.slice(0, 10);
        if (alertDate < periodoStart) return false;
      }

      if (periodoEnd) {
        const alertDate = alerta.data.slice(0, 10);
        if (alertDate > periodoEnd) return false;
      }

      return true;
    });
  }, [visibleAlertas, activeFilters, academiaSuggestion.options]);

  const filteredFeatureUsage = useMemo(() => {
    const searchTerm = usageSearch.trim().toLocaleLowerCase("pt-BR");

    return featureUsage.filter((item) => {
      if (searchTerm && !item.academiaNome.toLocaleLowerCase("pt-BR").includes(searchTerm)) {
        return false;
      }

      if (usageFilter === "TODAS") {
        return true;
      }

      return FEATURE_COLUMNS.some(({ key }) => item[key].status === usageFilter);
    });
  }, [featureUsage, usageSearch, usageFilter]);

  const summary = useMemo(() => {
    const criticos = visibleAlertas.filter((item) => item.severidade === "CRITICAL").length;
    const warnings = visibleAlertas.filter((item) => item.severidade === "WARNING").length;
    const academiasComFeaturesEmUso = featureUsage.filter((item) =>
      FEATURE_COLUMNS.some(({ key }) => item[key].status === "EM_USO")
    ).length;

    const totalFeatures = featureUsage.length * FEATURE_COLUMNS.length;
    const totalFeaturesAtivasSemUso = featureUsage.reduce((acc, item) => {
      return acc + FEATURE_COLUMNS.filter(({ key }) => item[key].status === "ATIVA_SEM_USO").length;
    }, 0);

    return {
      criticos,
      warnings,
      academiasComFeaturesEmUso,
      ociosidadePercentual: totalFeatures > 0 ? (totalFeaturesAtivasSemUso / totalFeatures) * 100 : 0,
    };
  }, [visibleAlertas, featureUsage]);

  const handleResolveAlert = useCallback((alerta: AlertaOperacional) => {
    if (!alerta.id) return;
    setResolvedAlertIds((current) => {
      if (current.includes(alerta.id!)) return current;
      return [...current, alerta.id!];
    });
    toast({
      title: "Alerta resolvido",
      description: `${alerta.academiaNome} saiu da fila de acompanhamento.`,
    });
  }, [toast]);

  const hasNext = (page + 1) * PAGE_SIZE < filteredAlertas.length;
  const pageItems = useMemo(
    () => filteredAlertas.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredAlertas, page],
  );

  const renderAlertaCells = useCallback(
    (alerta: AlertaOperacional) => (
      <>
        <TableCell className="px-4 py-3">
          <Badge variant="outline" className="border-border bg-secondary text-foreground">
            {TIPO_LABELS[alerta.tipo] ?? alerta.tipo}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3">
          <SeverityBadge severidade={alerta.severidade} />
        </TableCell>
        <TableCell className="px-4 py-3 text-sm text-foreground">
          {alerta.academiaNome}
          {alerta.unidadeNome ? (
            <span className="ml-1 text-xs text-muted-foreground">({alerta.unidadeNome})</span>
          ) : null}
        </TableCell>
        <TableCell className="max-w-[300px] px-4 py-3">
          <p className="truncate text-sm font-medium text-foreground">{alerta.titulo}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{alerta.descricao}</p>
        </TableCell>
        <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
          {formatDateTime(alerta.data)}
        </TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => handleResolveAlert(alerta)}
            >
              <CheckCircle2 className="size-3.5" />
              Resolver
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
              <VolumeX className="size-3.5" />
              Silenciar
            </Button>
          </div>
        </TableCell>
      </>
    ),
    [handleResolveAlert],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Operação global</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Alertas e uso de features</h1>
        <p className="text-sm text-muted-foreground">
          Monitore sinais automáticos de risco operacional e compare ativação real das features por academia.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Alertas críticos"
          value={String(summary.criticos)}
          helper="Academias que precisam de ação imediata"
          tone="critical"
        />
        <SummaryCard
          title="Alertas de atenção"
          value={String(summary.warnings)}
          helper="Itens que merecem acompanhamento do time"
          tone="warning"
        />
        <SummaryCard
          title="Academias com uso real"
          value={String(summary.academiasComFeaturesEmUso)}
          helper="Ao menos uma feature ativa e sendo usada"
          tone="positive"
        />
        <SummaryCard
          title="Features ociosas"
          value={formatPercent(summary.ociosidadePercentual)}
          helper="Features ativas sem uso recente"
          tone="warning"
        />
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void alertasQuery.refetch()} /> : null}

      <Card className="border-border/80 bg-card/90">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-gym-accent" />
              <CardTitle>Alertas automáticos</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="border-border" onClick={() => void alertasQuery.refetch()}>
                Atualizar
              </Button>
              <Link href="/admin">
                <Button type="button" variant="ghost">Voltar ao dashboard</Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Sem login admin, queda operacional, contrato vencendo e inadimplência acima do threshold.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableFilters
            filters={filterConfigs}
            onFiltersChange={handleFiltersChange}
          />

          <PaginatedTable<AlertaOperacional>
            tableAriaLabel="Alertas operacionais automáticos"
            columns={ALERTAS_TABLE_COLUMNS}
            items={pageItems}
            emptyText={
              visibleAlertas.length === 0
                ? "Nenhum alerta operacional foi retornado no momento."
                : "Nenhum alerta corresponde aos filtros aplicados."
            }
            getRowKey={(alerta) => alerta.id ?? `${alerta.academiaNome}-${alerta.tipo}-${alerta.data}`}
            renderCells={renderAlertaCells}
            page={page}
            pageSize={PAGE_SIZE}
            total={filteredAlertas.length}
            hasNext={hasNext}
            onPrevious={() => setPage(Math.max(0, page - 1))}
            onNext={() => setPage(page + 1)}
            disablePrevious={page === 0}
            disableNext={!hasNext}
            isLoading={loading}
            itemLabel="alertas"
          />
        </CardContent>
      </Card>

      {loading ? (
        <ListLoadingSkeleton rows={4} columns={6} />
      ) : (
        <Card className="border-border/80 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Painel de uso de features por academia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Identifique features ativas sem uso real para upsell, onboarding ou intervenção operacional.
            </p>
          </CardHeader>
          <CardContent>
            {filteredFeatureUsage.length === 0 ? (
              <EmptyState
                variant={featureUsage.length === 0 ? "list" : "search"}
                message={
                  featureUsage.length === 0
                    ? "Nenhum dado de uso de features foi retornado."
                    : "Nenhuma academia corresponde aos filtros aplicados."
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead className="min-w-56">Academia</TableHead>
                      {FEATURE_COLUMNS.map((feature) => (
                        <TableHead key={feature.key} className="min-w-40">
                          {feature.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeatureUsage.map((item) => (
                      <TableRow key={item.academiaId ?? item.academiaNome}>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{item.academiaNome}</p>
                            <p className="text-xs text-muted-foreground">
                              {FEATURE_COLUMNS.filter(({ key }) => item[key].status === "EM_USO").length} feature(s) em uso
                            </p>
                          </div>
                        </TableCell>
                        {FEATURE_COLUMNS.map((feature) => (
                          <TableCell key={feature.key} className="align-top">
                            <FeatureUsageBadge indicator={item[feature.key]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
