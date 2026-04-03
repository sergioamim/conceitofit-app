"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginatedTable, type PaginatedTableColumn } from "@/components/shared/paginated-table";
import { TableFilters, type ActiveFilters, type FilterConfig } from "@/components/shared/table-filters";
import { EmptyState, ListErrorState } from "@/components/shared/list-states";
import { useAdminSaudeAcademias } from "@/backoffice/query";
import {
  formatPercent,
} from "@/backoffice/lib/admin-health";
import { formatDateTime } from "@/lib/formatters";
import type { AcademiaHealthLevel, AcademiaHealthStatus } from "@/lib/types";

/* ---------------------------------------------------------------------------
 * Constantes
 * --------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

const TABLE_COLUMNS: PaginatedTableColumn[] = [
  { label: "Academia" },
  { label: "Score de saúde", className: "w-[140px]" },
  { label: "Alunos ativos", className: "w-[120px]" },
  { label: "Churn (%)", className: "w-[100px]" },
  { label: "Última sinc.", className: "w-[150px]" },
  { label: "Ações", className: "w-[80px]" },
];

const HEALTH_FILTER_OPTIONS = [
  { value: "SAUDAVEL", label: "Saudável" },
  { value: "RISCO", label: "Risco" },
  { value: "CRITICO", label: "Crítico" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: "text",
    key: "busca",
    label: "Buscar academia",
    placeholder: "Nome da academia...",
    debounceMs: 300,
  },
  {
    type: "select",
    key: "saude",
    label: "Status de saúde",
    placeholder: "Todos os níveis",
    options: HEALTH_FILTER_OPTIONS,
  },
];

/* ---------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------- */

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

function resolveScoreColor(level: AcademiaHealthLevel) {
  switch (level) {
    case "SAUDAVEL":
      return "text-gym-teal";
    case "RISCO":
      return "text-gym-warning";
    case "CRITICO":
      return "text-gym-danger";
    default:
      return "text-foreground";
  }
}

function scoreLabel(level: AcademiaHealthLevel) {
  switch (level) {
    case "SAUDAVEL":
      return "Saudável";
    case "RISCO":
      return "Risco";
    case "CRITICO":
      return "Crítico";
    default:
      return level;
  }
}

/* ---------------------------------------------------------------------------
 * Página principal
 * --------------------------------------------------------------------------- */

export default function AdminOperationalHealthPage() {
  const saudeQuery = useAdminSaudeAcademias();
  const items = saudeQuery.data?.items ?? [];
  const loading = saudeQuery.isLoading;
  const error = saudeQuery.error ? saudeQuery.error.message : null;

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [page, setPage] = useState(0);

  const handleFiltersChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters);
    setPage(0);
  }, []);

  const filteredItems = useMemo(() => {
    const busca = (activeFilters.busca ?? "").trim().toLowerCase();
    const saude = activeFilters.saude ?? "";

    return items.filter((item) => {
      if (busca && !item.academiaNome.toLowerCase().includes(busca)) {
        return false;
      }
      if (saude && item.healthLevel !== saude) {
        return false;
      }
      return true;
    });
  }, [activeFilters, items]);

  const summary = useMemo(
    () => ({
      saudaveis: items.filter((item) => item.healthLevel === "SAUDAVEL").length,
      risco: items.filter((item) => item.healthLevel === "RISCO").length,
      critico: items.filter((item) => item.healthLevel === "CRITICO").length,
    }),
    [items],
  );

  const hasNext = (page + 1) * PAGE_SIZE < filteredItems.length;
  const pageItems = useMemo(
    () => filteredItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredItems, page],
  );

  const renderCells = useCallback(
    (item: AcademiaHealthStatus) => (
      <>
        <TableCell className="px-4 py-3 font-medium text-foreground">
          <div>
            <p>{item.academiaNome}</p>
            {item.alertasRisco[0] ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.alertasRisco[0]}</p>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.healthLevel} />
            <span className={`text-sm font-semibold ${resolveScoreColor(item.healthLevel)}`}>
              {scoreLabel(item.healthLevel)}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 tabular-nums">{item.alunosAtivos}</TableCell>
        <TableCell className="px-4 py-3 tabular-nums">{formatPercent(item.churnMensal)}</TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex items-center gap-2">
            <TimerReset className="size-3.5 text-muted-foreground" />
            <span className="text-sm">
              {item.ultimoLoginAdmin ? formatDateTime(item.ultimoLoginAdmin) : "—"}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3">
          {item.academiaId ? (
            <Link href={`/admin/academias/${item.academiaId}`}>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5">
                <Eye className="size-3.5" />
                Ver
              </Button>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </>
    ),
    [],
  );

  const getRowKey = useCallback(
    (item: AcademiaHealthStatus) => item.academiaId ?? item.academiaNome,
    [],
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

      {error ? <ListErrorState error={error} onRetry={() => void saudeQuery.refetch()} /> : null}

      {/* Cards de status (mantidos intactos) */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <HealthSummaryCard title="Saudáveis" value={String(summary.saudaveis)} tone="SAUDAVEL" />
          <HealthSummaryCard title="Em risco" value={String(summary.risco)} tone="RISCO" />
          <HealthSummaryCard title="Críticas" value={String(summary.critico)} tone="CRITICO" />
        </div>
      )}

      {/* Filtros + Ações */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
        <TableFilters filters={FILTER_CONFIGS} onFiltersChange={handleFiltersChange} />
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" className="border-border" onClick={() => void saudeQuery.refetch()}>
            Atualizar
          </Button>
          <Link href="/admin">
            <Button type="button" variant="ghost">Voltar ao dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Tabela paginada */}
      {!loading && filteredItems.length === 0 ? (
        <EmptyState
          variant="search"
          message="Nenhuma academia corresponde aos filtros aplicados."
        />
      ) : (
        <PaginatedTable<AcademiaHealthStatus>
          columns={TABLE_COLUMNS}
          items={pageItems}
          emptyText="Nenhuma academia encontrada."
          renderCells={renderCells}
          getRowKey={getRowKey}
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredItems.length}
          hasNext={hasNext}
          onPrevious={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          isLoading={loading}
          itemLabel="academias"
          tableAriaLabel="Tabela detalhada de saúde das academias"
        />
      )}
    </div>
  );
}
