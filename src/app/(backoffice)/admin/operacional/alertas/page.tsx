"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellRing, CircleAlert, Rocket, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ListErrorState, ListLoadingSkeleton } from "@/components/shared/list-states";
import { useAdminAlertasOperacionais } from "@/backoffice/query";
import { formatDateTime, formatPercent } from "@/lib/formatters";
import type {
  AlertaOperacionalSeveridade,
  FeatureUsageIndicator,
  FeatureUsageKey,
  FeatureUsageStatus,
} from "@/lib/types";
type SeverityFilter = "TODAS" | AlertaOperacionalSeveridade;
type UsageFilter = "TODAS" | FeatureUsageStatus;

const SEVERITY_OPTIONS: Array<{ value: SeverityFilter; label: string }> = [
  { value: "TODAS", label: "Todas as severidades" },
  { value: "CRITICAL", label: "Críticas" },
  { value: "WARNING", label: "Atenção" },
  { value: "INFO", label: "Informativas" },
];

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
  const alertasQuery = useAdminAlertasOperacionais();
  const alertas = alertasQuery.data?.alertas.items ?? [];
  const featureUsage = alertasQuery.data?.featureUsage.items ?? [];
  const loading = alertasQuery.isLoading;
  const error = alertasQuery.error ? alertasQuery.error.message : null;

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("TODAS");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("TODAS");
  const [search, setSearch] = useState("");

  const filteredAlertas = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("pt-BR");

    return alertas.filter((alerta) => {
      if (severityFilter !== "TODAS" && alerta.severidade !== severityFilter) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const searchable = [alerta.academiaNome, alerta.titulo, alerta.descricao, alerta.acaoSugerida, alerta.unidadeNome]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchable.includes(searchTerm);
    });
  }, [alertas, search, severityFilter]);

  const filteredFeatureUsage = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("pt-BR");

    return featureUsage.filter((item) => {
      if (searchTerm && !item.academiaNome.toLocaleLowerCase("pt-BR").includes(searchTerm)) {
        return false;
      }

      if (usageFilter === "TODAS") {
        return true;
      }

      return FEATURE_COLUMNS.some(({ key }) => item[key].status === usageFilter);
    });
  }, [featureUsage, search, usageFilter]);

  const summary = useMemo(() => {
    const criticos = alertas.filter((item) => item.severidade === "CRITICAL").length;
    const warnings = alertas.filter((item) => item.severidade === "WARNING").length;
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
  }, [alertas, featureUsage]);

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

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-3 xl:grid-cols-[1.2fr_1fr_1fr_auto]">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar academia ou alerta</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: contrato vencendo, academia XPTO"
              className="border-border bg-secondary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severidade</label>
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}>
              <SelectTrigger className="w-full border-border bg-secondary" aria-label="Filtrar alertas por severidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status de uso</label>
            <Select value={usageFilter} onValueChange={(value) => setUsageFilter(value as UsageFilter)}>
              <SelectTrigger className="w-full border-border bg-secondary" aria-label="Filtrar tabela por status de uso">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {USAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academias visíveis</label>
            <Input
              readOnly
              value={`${filteredFeatureUsage.length} academia(s)`}
              className="border-border bg-secondary text-muted-foreground"
            />
          </div>
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

      {error ? <ListErrorState error={error} onRetry={() => void alertasQuery.refetch()} /> : null}

      {loading ? (
        <div className="space-y-6">
          <ListLoadingSkeleton rows={5} columns={4} />
          <ListLoadingSkeleton rows={4} columns={6} />
        </div>
      ) : (
        <>
          <Card className="border-border/80 bg-card/90">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-gym-accent" />
                <CardTitle>Alertas automáticos</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Sem login admin, queda operacional, contrato vencendo e inadimplência acima do threshold.
              </p>
            </CardHeader>
            <CardContent>
              {filteredAlertas.length === 0 ? (
                <EmptyState
                  variant={alertas.length === 0 ? "list" : "search"}
                  message={
                    alertas.length === 0
                      ? "Nenhum alerta operacional foi retornado no momento."
                      : "Nenhum alerta corresponde aos filtros aplicados."
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredAlertas.map((alerta) => (
                    <div key={alerta.id} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <SeverityBadge severidade={alerta.severidade} />
                            <span className="text-sm font-semibold text-foreground">{alerta.titulo}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alerta.descricao}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Academia: {alerta.academiaNome}</span>
                            <span>Data: {formatDateTime(alerta.data)}</span>
                            {alerta.unidadeNome ? <span>Unidade: {alerta.unidadeNome}</span> : null}
                          </div>
                        </div>

                        <div className="min-w-72 rounded-lg border border-border/80 bg-card/70 p-3 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ação sugerida</p>
                          <p className="mt-1 text-foreground">{alerta.acaoSugerida}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
        </>
      )}
    </div>
  );
}
