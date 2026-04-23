"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminJobMetricsApi, type JobStats } from "@/lib/api/observability";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const REFETCH_INTERVAL_MS = 10_000;

/**
 * Dashboard de observabilidade de jobs e handlers async do backend.
 * Lê `/api/v1/admin/observability/jobs` — que agrega counters+timers do
 * Micrometer via `JobExecutionMetrics`. Auto-refresh a cada 10s.
 */
export default function JobsObservabilityPage() {
  const query = useQuery({
    queryKey: ["admin", "observability", "jobs"],
    queryFn: listAdminJobMetricsApi,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const jobs = query.data?.jobs ?? [];
  const snapshotAt = query.data?.snapshotAt;
  const error = query.error ? normalizeErrorMessage(query.error) : null;

  const withFailures = jobs.filter((j) => j.failureCount > 0);
  const totalExecutions = jobs.reduce((acc, j) => acc + j.successCount + j.failureCount, 0);
  const totalFailures = jobs.reduce((acc, j) => acc + j.failureCount, 0);
  const failureRate = totalExecutions === 0 ? 0 : (totalFailures / totalExecutions) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Jobs & Handlers Async</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contadores de execução, latência p95 e última falha por job. Atualiza a cada 10s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={`mr-2 size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Jobs conhecidos"
          value={jobs.length.toString()}
          hint={snapshotAt ? `snapshot ${formatTimestamp(snapshotAt)}` : "carregando..."}
        />
        <SummaryCard
          label="Execuções totais"
          value={totalExecutions.toLocaleString("pt-BR")}
          hint={`${totalFailures.toLocaleString("pt-BR")} falhas`}
          accent={totalFailures > 0 ? "danger" : "teal"}
        />
        <SummaryCard
          label="Taxa de falha"
          value={`${failureRate.toFixed(2)}%`}
          hint={withFailures.length > 0 ? `${withFailures.length} job(s) com falha` : "nenhum job falhando"}
          accent={withFailures.length > 0 ? "danger" : "teal"}
        />
      </div>

      {/* Jobs table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Job</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[90px] text-right">Sucesso</TableHead>
              <TableHead className="w-[90px] text-right">Falha</TableHead>
              <TableHead className="w-[120px] text-right">Latência p95</TableHead>
              <TableHead className="w-[160px]">Última execução</TableHead>
              <TableHead>Último erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Carregando métricas...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum job registrado ainda. Jobs aparecem aqui após a primeira execução.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => <JobRow key={job.jobName} job={job} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: JobStats }) {
  const hasFailure = job.failureCount > 0;
  return (
    <TableRow className={hasFailure ? "bg-gym-danger/5" : undefined}>
      <TableCell className="font-mono text-xs">{job.jobName}</TableCell>
      <TableCell>
        {hasFailure ? (
          <Badge variant="outline" className="border-gym-danger/30 bg-gym-danger/15 text-gym-danger">
            <AlertTriangle className="mr-1 size-3" />
            Com falhas
          </Badge>
        ) : job.successCount > 0 ? (
          <Badge variant="outline" className="border-gym-teal/30 bg-gym-teal/15 text-gym-teal">
            <CheckCircle2 className="mr-1 size-3" />
            OK
          </Badge>
        ) : (
          <Badge variant="outline" className="border-border text-muted-foreground">
            <Clock className="mr-1 size-3" />
            Sem runs
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {job.successCount.toLocaleString("pt-BR")}
      </TableCell>
      <TableCell className={`text-right font-mono tabular-nums ${hasFailure ? "text-gym-danger font-semibold" : ""}`}>
        {job.failureCount.toLocaleString("pt-BR")}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {job.latencyP95.millis > 0 ? `${job.latencyP95.millis} ms` : "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {job.lastRunAt ? formatTimestamp(job.lastRunAt) : "nunca"}
      </TableCell>
      <TableCell className="max-w-[500px] text-xs">
        {job.lastError ? (
          <div className="space-y-0.5">
            <p className="truncate text-gym-danger" title={job.lastError.message}>
              {job.lastError.message}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {job.lastError.exceptionType} · {formatTimestamp(job.lastError.occurredAt)}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "teal" | "danger";
}) {
  const accentClass =
    accent === "danger"
      ? "text-gym-danger"
      : accent === "teal"
      ? "text-gym-teal"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl font-extrabold leading-none ${accentClass}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}
