"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Filter,
  Percent,
  RefreshCw,
  TrendingDown,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useAssinaturas } from "@/lib/query/use-billing-config";
import { calculateBillingMetrics } from "@/lib/tenant/billing/metrics";
import type { StatusAssinatura } from "@/lib/types";
import { formatBRL, formatPercent } from "@/lib/shared/formatters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<StatusAssinatura, string> = {
  ATIVA: "Ativa",
  PENDENTE: "Pendente",
  CANCELADA: "Cancelada",
  SUSPENSA: "Suspensa",
  VENCIDA: "Vencida",
};

const STATUS_CLASS: Record<StatusAssinatura, string> = {
  ATIVA: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  PENDENTE: "border-muted bg-muted/10 text-muted-foreground",
  CANCELADA: "border-muted bg-muted/10 text-muted-foreground",
  SUSPENSA: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
  VENCIDA: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
};

type StatusFilter = StatusAssinatura | "TODAS";

export function BillingDashboardContent() {
  const { tenantId } = useTenantContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");

  const queryStatus = statusFilter === "TODAS" ? undefined : statusFilter;
  const {
    data: assinaturas,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAssinaturas({ tenantId, status: queryStatus });

  const lista = assinaturas ?? [];

  // Métricas são sempre calculadas sobre a lista ATUAL (já filtrada pelo BE)
  const metrics = useMemo(() => calculateBillingMetrics(lista), [lista]);

  const errorMsg = error ? normalizeErrorMessage(error) : null;
  const backendFantasma = !isLoading && lista.length === 0 && !errorMsg;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gym-accent mb-2">
            Billing Recorrente
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">
            Dashboard de <span className="text-gym-accent">Cobranças</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mt-2">
            MRR, churn, inadimplência e gestão de assinaturas recorrentes em
            tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-xl h-11"
          >
            <RefreshCw
              className={cn("mr-2 size-4", isFetching && "animate-spin")}
            />
            Atualizar
          </Button>
        </div>
      </header>

      {errorMsg && (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle size={20} />
          {errorMsg}
        </div>
      )}

      {backendFantasma && (
        <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 p-4 text-sm text-gym-warning flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <strong className="font-bold">Sem assinaturas ativas.</strong>{" "}
            Nenhuma assinatura foi registrada ainda ou o backend ainda não
            expõe o endpoint de billing recorrente. O módulo está pronto para
            quando o gateway for configurado — ver ADR-001.
          </div>
        </div>
      )}

      {/* KPIs principais (linha 1) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <BiMetricCard
          label="MRR"
          value={formatBRL(metrics.mrr)}
          icon={DollarSign}
          tone="accent"
          description="Receita recorrente mensal"
        />
        <BiMetricCard
          label="ARR"
          value={formatBRL(metrics.arr)}
          icon={TrendingDown}
          tone="teal"
          description="Projeção anualizada (MRR × 12)"
        />
        <BiMetricCard
          label="Ticket médio"
          value={formatBRL(metrics.ticketMedio)}
          icon={Users}
          tone="accent"
          description={`${metrics.counts.ATIVA} assinatura${metrics.counts.ATIVA === 1 ? "" : "s"} ativa${metrics.counts.ATIVA === 1 ? "" : "s"}`}
        />
        <BiMetricCard
          label="Valor em risco"
          value={formatBRL(metrics.valorEmRisco)}
          icon={ArrowDownRight}
          tone="danger"
          description={`${metrics.counts.VENCIDA + metrics.counts.SUSPENSA} assinatura(s) vencida(s)/suspensa(s)`}
        />
      </div>

      {/* KPIs secundários (linha 2) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <BiMetricCard
          label="Churn rate"
          value={formatPercent(metrics.churnRate)}
          icon={ArrowDownRight}
          tone="warning"
          description="Assinaturas canceladas / total na base"
        />
        <BiMetricCard
          label="Inadimplência"
          value={formatPercent(metrics.inadimplenciaRate)}
          icon={Percent}
          tone="danger"
          description="Vencidas sobre total ativo + vencido"
        />
        <BiMetricCard
          label="Total gerenciado"
          value={String(metrics.total)}
          icon={ArrowUpRight}
          tone="teal"
          description="Assinaturas na base (todos os status)"
        />
      </div>

      {/* Breakdown por status */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="font-display text-lg">Distribuição por status</CardTitle>
          <CardDescription>
            Contagem atual por status da assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {(Object.keys(STATUS_LABEL) as StatusAssinatura[]).map((status) => (
              <div
                key={status}
                className="flex flex-col gap-1 rounded-xl border border-border/40 bg-muted/5 p-4"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm",
                    STATUS_CLASS[status],
                  )}
                >
                  {STATUS_LABEL[status]}
                </Badge>
                <span className="font-display text-3xl font-extrabold tracking-tight">
                  {metrics.counts[status]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Listagem de assinaturas */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <CardTitle className="font-display text-lg">
              Assinaturas
            </CardTitle>
            <CardDescription>
              Listagem completa com ações de gestão — retry, suspender,
              cancelar via endpoints do gateway.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-44 h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todos os status</SelectItem>
                {(Object.keys(STATUS_LABEL) as StatusAssinatura[]).map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Carregando assinaturas...
            </div>
          ) : lista.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Nenhuma assinatura encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Próxima cobrança</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((assinatura) => (
                    <TableRow key={assinatura.id}>
                      <TableCell className="font-medium">
                        {assinatura.clienteNome ?? assinatura.alunoId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assinatura.planoNome ?? assinatura.planoId}
                      </TableCell>
                      <TableCell className="text-xs font-mono uppercase text-muted-foreground">
                        {assinatura.ciclo}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(assinatura.valor)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assinatura.proximaCobranca ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                            STATUS_CLASS[assinatura.status],
                          )}
                        >
                          {STATUS_LABEL[assinatura.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
