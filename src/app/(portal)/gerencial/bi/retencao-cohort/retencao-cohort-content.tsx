"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useBiRetencao } from "@/lib/query/use-bi";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { formatPercent } from "@/lib/formatters";

const MESES_OPTIONS = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];

function retencaoTone(pct: number): string {
  if (pct >= 80) return "text-gym-teal";
  if (pct >= 50) return "text-gym-warning";
  return "text-gym-danger";
}

function retencaoBarColor(pct: number): string {
  if (pct >= 80) return "bg-gym-teal";
  if (pct >= 50) return "bg-gym-warning";
  return "bg-gym-danger";
}

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <div className="h-12 animate-pulse rounded-xl border border-border bg-card/60" />
      <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

export default function RetencaoCohortContent() {
  const tenantContext = useTenantContext();
  const [meses, setMeses] = useState(6);
  const tenantId = tenantContext.tenantId ?? "";

  const { data, isLoading, error: queryError, refetch } = useBiRetencao(tenantId, meses);
  const error = queryError ? normalizeErrorMessage(queryError) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">BI Analytics</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Retencao Cohort</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analise de retencao por coorte de ingresso.
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
        <div className="max-w-xs space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Periodo</label>
          <Select value={String(meses)} onValueChange={(v) => setMeses(Number(v))}>
            <SelectTrigger aria-label="Meses de analise" className="w-full border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              {MESES_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void refetch()} />
      ) : null}

      {isLoading || !data ? (
        <LoadingPanel />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-gym-teal" />
            <div>
              <h2 className="font-display text-lg font-bold">Cohorts de retencao</h2>
              <p className="text-xs text-muted-foreground">
                {data.mesesAnalisados} meses analisados — {data.cohorts.length} coorte(s).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Cohort</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Total matriculas</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Ativas atualmente</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Retencao %</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Meses desde ingresso</th>
                  <th scope="col" className="px-3 py-2 font-semibold" style={{ minWidth: 160 }}>&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.cohorts.map((cohort) => (
                  <tr key={cohort.cohort} className="transition-colors hover:bg-secondary/30">
                    <td className="px-3 py-2 font-medium text-foreground">{cohort.cohort}</td>
                    <td className="px-3 py-2 text-right">{cohort.totalMatriculas.toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2 text-right">{cohort.ativasAtualmente.toLocaleString("pt-BR")}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${retencaoTone(cohort.retencaoPercentual)}`}>
                      {formatPercent(cohort.retencaoPercentual)}
                    </td>
                    <td className="px-3 py-2 text-right">{cohort.mesesDesdeIngresso}</td>
                    <td className="px-3 py-2">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${retencaoBarColor(cohort.retencaoPercentual)}`}
                          style={{ width: `${Math.min(cohort.retencaoPercentual, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
