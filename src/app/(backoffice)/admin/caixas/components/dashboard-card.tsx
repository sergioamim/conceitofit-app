"use client";

import { AlertTriangle, ArrowRight, DollarSign, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { DashboardDiarioResponse } from "@/lib/api/caixa.types";

export interface DashboardCardProps {
  dashboard: DashboardDiarioResponse | null;
  loading?: boolean;
  /** Disparado ao clicar no contador "diferenças do dia" para abrir a tab. */
  onVerDiferencas?: () => void;
}

function MetricaTile({
  titulo,
  valor,
  icone,
  tone = "default",
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-gym-teal/25 bg-gym-teal/10 text-gym-teal"
      : tone === "warning"
        ? "border-gym-warning/25 bg-gym-warning/10 text-gym-warning"
        : tone === "danger"
          ? "border-gym-danger/25 bg-gym-danger/10 text-gym-danger"
          : "border-border bg-secondary/30 text-foreground";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {titulo}
        </p>
        <span className="opacity-70">{icone}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold leading-none">{valor}</p>
    </div>
  );
}

export function DashboardCard({ dashboard, loading, onVerDiferencas }: DashboardCardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3" data-testid="caixas-dashboard-skeleton">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Sem dados para o dia.
        </CardContent>
      </Card>
    );
  }

  const totalAbertos = dashboard.caixasAbertos.length;
  const totalFechados = dashboard.caixasFechados.length;
  const totalMovimentado = dashboard.totalMovimentado.total;
  const breakdown = dashboard.totalMovimentado.porFormaPagamento ?? {};
  const breakdownEntries = Object.entries(breakdown);
  const breakdownSoma = breakdownEntries.reduce((acc, [, valor]) => acc + (valor ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-gym-accent">Visão diária</p>
          <h2 className="text-2xl font-display font-bold leading-tight">
            Resumo de {formatDate(dashboard.data)}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricaTile
          titulo="Caixas abertos"
          valor={String(totalAbertos)}
          icone={<Unlock className="size-4" />}
          tone="warning"
        />
        <MetricaTile
          titulo="Caixas fechados"
          valor={String(totalFechados)}
          icone={<Lock className="size-4" />}
          tone="success"
        />
        <MetricaTile
          titulo="Total movimentado"
          valor={formatBRL(totalMovimentado)}
          icone={<DollarSign className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown por forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem movimentações registradas até o momento.
            </p>
          ) : (
            <div className="space-y-2">
              {breakdownEntries.map(([forma, valor]) => {
                const percentual =
                  breakdownSoma > 0 ? Math.round(((valor ?? 0) / breakdownSoma) * 100) : 0;
                return (
                  <div
                    key={forma}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium capitalize">{forma.toLowerCase()}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatBRL(valor ?? 0)} ({percentual}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={
          dashboard.alertasDiferencaCount > 0
            ? "border-gym-danger/30 bg-gym-danger/10"
            : "border-border"
        }
      >
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={
                dashboard.alertasDiferencaCount > 0
                  ? "size-5 text-gym-danger"
                  : "size-5 text-muted-foreground"
              }
            />
            <div>
              <p className="text-sm font-semibold">
                {dashboard.alertasDiferencaCount}{" "}
                {dashboard.alertasDiferencaCount === 1
                  ? "diferença detectada hoje"
                  : "diferenças detectadas hoje"}
              </p>
              <p className="text-xs text-muted-foreground">
                Caixas fechados com divergência entre saldo informado e calculado.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onVerDiferencas}
            disabled={!onVerDiferencas}
          >
            Ver diferenças
            <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
