"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, HeartPulse, ShieldAlert, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ListErrorState } from "@/components/shared/list-states";
import { useAdminSaudeAcademias } from "@/backoffice/query";
import {
  filterAcademiasHealthMap,
  formatPercent,
  resolveContractBadgeClass,
  type HealthFilter,
} from "@/backoffice/lib/admin-health";
import { formatDateTime } from "@/lib/formatters";
import type { AcademiaHealthLevel, AcademiaHealthStatus } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

const HEALTH_FILTER_OPTIONS: Array<{ value: HealthFilter; label: string }> = [
  { value: FILTER_ALL, label: "Todos os níveis" },
  { value: "SAUDAVEL", label: "Saudável" },
  { value: "RISCO", label: "Risco" },
  { value: "CRITICO", label: "Crítico" },
];

function HealthSummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: AcademiaHealthLevel;
}) {
  const toneClassName =
    tone === "SAUDAVEL"
      ? "border-gym-teal/25 bg-gym-teal/10"
      : tone === "RISCO"
        ? "border-gym-warning/25 bg-gym-warning/10"
        : "border-gym-danger/25 bg-gym-danger/10";

  return (
    <div className={`rounded-xl border p-4 ${toneClassName}`}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{value}</p>
    </div>
  );
}

function HealthAcademiaCard({ item }: { item: AcademiaHealthStatus }) {
  const Icon =
    item.healthLevel === "SAUDAVEL"
      ? HeartPulse
      : item.healthLevel === "RISCO"
        ? AlertTriangle
        : ShieldAlert;

  return (
    <Card className="border-border/80 bg-card/90">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{item.academiaNome}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {item.unidades} unidade(s) · plano {item.planoContratado ?? "não informado"}
            </p>
          </div>
          <div className="rounded-full border border-border bg-secondary p-2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </div>
        <StatusBadge status={item.healthLevel} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Alunos ativos</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{item.alunosAtivos}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Inadimplência</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatPercent(item.inadimplenciaPercentual)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-muted-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider">Churn mensal</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{formatPercent(item.churnMensal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider">Último login admin</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.ultimoLoginAdmin ? formatDateTime(item.ultimoLoginAdmin) : "—"}</p>
          </div>
        </div>
        {item.alertasRisco.length > 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {item.alertasRisco.slice(0, 3).map((alerta) => (
                <li key={alerta}>{alerta}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AdminOperationalHealthPage() {
  const saudeQuery = useAdminSaudeAcademias();
  const items = saudeQuery.data?.items ?? [];
  const loading = saudeQuery.isLoading;
  const error = saudeQuery.error ? saudeQuery.error.message : null;

  const [healthFilter, setHealthFilter] = useState<HealthFilter>(FILTER_ALL);
  const [planoFilter, setPlanoFilter] = useState("");

  const planos = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.planoContratado).filter((value): value is string => Boolean(value)))
      ).sort((left, right) => left.localeCompare(right, "pt-BR")),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      filterAcademiasHealthMap(items, {
        healthLevel: healthFilter,
        planoContratado: planoFilter,
      }),
    [healthFilter, items, planoFilter]
  );

  const summary = useMemo(
    () => ({
      saudaveis: filteredItems.filter((item) => item.healthLevel === "SAUDAVEL").length,
      risco: filteredItems.filter((item) => item.healthLevel === "RISCO").length,
      critico: filteredItems.filter((item) => item.healthLevel === "CRITICO").length,
    }),
    [filteredItems]
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Operação global</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Mapa de saúde das academias</h1>
        <p className="text-sm text-muted-foreground">
          Compare o estado operacional da rede inteira por semáforo, churn, inadimplência e uso administrativo.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status de saúde</label>
            <Select value={healthFilter} onValueChange={(value) => setHealthFilter(value as HealthFilter)}>
              <SelectTrigger aria-label="Filtrar por status de saúde" className="w-full border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {HEALTH_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano contratado</label>
            <Select value={planoFilter || "__TODOS__"} onValueChange={(value) => setPlanoFilter(value === "__TODOS__" ? "" : value)}>
              <SelectTrigger aria-label="Filtrar por plano contratado" className="w-full border-border bg-secondary">
                <SelectValue placeholder="Todos os planos" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="__TODOS__">Todos os planos</SelectItem>
                {planos.map((plano) => (
                  <SelectItem key={plano} value={plano}>
                    {plano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academias visíveis</label>
            <Input readOnly value={`${filteredItems.length} academia(s)`} className="border-border bg-secondary text-muted-foreground" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="border-border" onClick={() => void saudeQuery.refetch()}>
            Atualizar
          </Button>
          <Link href="/admin">
            <Button type="button" variant="ghost">Voltar ao dashboard</Button>
          </Link>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void saudeQuery.refetch()} /> : null}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-card/60" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-xl border border-border bg-card/60" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <HealthSummaryCard title="Saudáveis" value={String(summary.saudaveis)} tone="SAUDAVEL" />
            <HealthSummaryCard title="Em risco" value={String(summary.risco)} tone="RISCO" />
            <HealthSummaryCard title="Críticas" value={String(summary.critico)} tone="CRITICO" />
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              variant="search"
              message="Nenhuma academia corresponde aos filtros aplicados."
              action={
                <Button type="button" variant="outline" className="border-border" onClick={() => {
                  setHealthFilter(FILTER_ALL);
                  setPlanoFilter("");
                }}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <HealthAcademiaCard key={item.academiaId ?? item.academiaNome} item={item} />
                ))}
              </section>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tabela detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table aria-label="Tabela detalhada de saúde das academias">
                      <TableHeader>
                        <TableRow className="bg-secondary">
                          <TableHead className="px-4 py-3">Saúde</TableHead>
                          <TableHead className="px-4 py-3">Academia</TableHead>
                          <TableHead className="px-4 py-3">Unidades</TableHead>
                          <TableHead className="px-4 py-3">Alunos ativos</TableHead>
                          <TableHead className="px-4 py-3">Churn mensal</TableHead>
                          <TableHead className="px-4 py-3">Inadimplência</TableHead>
                          <TableHead className="px-4 py-3">Último login admin</TableHead>
                          <TableHead className="px-4 py-3">Contrato</TableHead>
                          <TableHead className="px-4 py-3">Plano</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={`table-${item.academiaId ?? item.academiaNome}`}>
                            <TableCell className="px-4 py-3">
                              <StatusBadge status={item.healthLevel} />
                            </TableCell>
                            <TableCell className="px-4 py-3 font-medium text-foreground">
                              <div>
                                <p>{item.academiaNome}</p>
                                {item.alertasRisco[0] ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{item.alertasRisco[0]}</p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{item.unidades}</TableCell>
                            <TableCell className="px-4 py-3">{item.alunosAtivos}</TableCell>
                            <TableCell className="px-4 py-3">{formatPercent(item.churnMensal)}</TableCell>
                            <TableCell className="px-4 py-3">{formatPercent(item.inadimplenciaPercentual)}</TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <TimerReset className="size-3.5 text-muted-foreground" />
                                <span>{item.ultimoLoginAdmin ? formatDateTime(item.ultimoLoginAdmin) : "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge variant="outline" className={resolveContractBadgeClass(item.statusContrato)}>
                                {item.statusContrato.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3">{item.planoContratado ?? "Não informado"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
