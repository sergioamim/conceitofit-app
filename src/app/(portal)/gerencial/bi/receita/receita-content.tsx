"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useBiReceita } from "@/lib/query/use-bi";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { formatBRL } from "@/lib/formatters";
import { getBusinessMonthRange } from "@/lib/business-date";

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

export default function ReceitaContent() {
  const tenantContext = useTenantContext();
  const { start, end } = getBusinessMonthRange();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  const tenantId = tenantContext.tenantId ?? "";

  const { data, isLoading, error: queryError, refetch } = useBiReceita(tenantId, startDate, endDate);
  const error = queryError ? normalizeErrorMessage(queryError) : null;

  const maxReceita = data?.planos?.length
    ? Math.max(...data.planos.map((p) => p.receita))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">BI Analytics</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Receita por Plano</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribuicao de receita e ticket medio por plano ativo.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/gerencial/bi">
            <ArrowLeft className="mr-2 size-4" />
            Voltar ao BI
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="receita-start" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">De</label>
            <Input
              id="receita-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="receita-end" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ate</label>
            <Input
              id="receita-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-border bg-secondary"
            />
          </div>
        </div>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void refetch()} />
      ) : null}

      {isLoading || !data ? (
        <LoadingPanel />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <BiMetricCard
              label="Total Receita"
              value={formatBRL(data.totalReceita)}
              description={`Periodo: ${startDate} a ${endDate}`}
              tone="accent"
              icon={TrendingUp}
            />
            <BiMetricCard
              label="Total Matriculas"
              value={data.totalMatriculas.toLocaleString("pt-BR")}
              description="Matriculas ativas no periodo"
              tone="teal"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold">Receita por plano</h2>
              <p className="text-xs text-muted-foreground">Comparativo visual de receita entre planos.</p>
            </div>

            <div className="space-y-3">
              {data.planos.map((plano) => {
                const pct = maxReceita > 0 ? (plano.receita / maxReceita) * 100 : 0;
                return (
                  <div key={plano.plano} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{plano.plano}</span>
                      <span className="text-muted-foreground">{formatBRL(plano.receita)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gym-accent transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display mb-4 text-lg font-bold">Detalhamento</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-3 py-2 text-left font-semibold">Plano</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Matriculas ativas</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Receita</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Ticket medio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.planos.map((plano) => (
                    <tr key={plano.plano} className="transition-colors hover:bg-secondary/30">
                      <td className="px-3 py-2 font-medium text-foreground">{plano.plano}</td>
                      <td className="px-3 py-2 text-right">{plano.matriculasAtivas.toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(plano.receita)}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(plano.ticketMedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
