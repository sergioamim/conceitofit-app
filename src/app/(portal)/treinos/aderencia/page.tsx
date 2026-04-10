"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Target, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListErrorState } from "@/components/shared/list-states";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { listAderenciaTreinosApi } from "@/lib/api/treinos";
import type { AderenciaTreino, TreinoCicloStatus } from "@/lib/types";
import { formatDate } from "@/lib/formatters";

const STATUS_CLASS: Record<string, string> = {
  ATIVO: "bg-gym-teal/15 text-gym-teal",
  ENCERRADO: "bg-secondary text-muted-foreground",
  PAUSADO: "bg-gym-warning/15 text-gym-warning",
  CANCELADO: "bg-gym-danger/15 text-gym-danger",
};

function formatAderencia(value?: number): string {
  if (value == null) return "—";
  return `${value.toFixed(0)}%`;
}

function aderenciaColor(value?: number): string {
  if (value == null) return "text-muted-foreground";
  if (value >= 80) return "text-gym-teal";
  if (value >= 50) return "text-gym-warning";
  return "text-gym-danger";
}

/**
 * Dashboard de aderência de treinos (Task #539).
 * Consome GET /api/v1/treinos/aderencia para professor acompanhar
 * execucao de treinos prescritos.
 */
export default function AderenciaTreinosPage() {
  const tenantContext = useTenantContext();
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading, isFetching, error: queryError, refetch } =
    useQuery<AderenciaTreino[]>({
      queryKey: ["treinos", "aderencia", tenantContext.tenantId, statusFilter],
      queryFn: () =>
        listAderenciaTreinosApi({
          tenantId: tenantContext.tenantId,
          status:
            statusFilter !== FILTER_ALL
              ? (statusFilter as TreinoCicloStatus)
              : undefined,
        }),
      enabled: tenantContext.tenantResolved,
      staleTime: 60_000,
    });

  const error = queryError instanceof Error ? queryError.message : null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((a) => {
      const hay = [a.clienteNome, a.treinoNome, a.professorNome]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const ativos = filtered.filter((a) => a.status === "ATIVO");
    const totalExecucoes = ativos.reduce((acc, a) => acc + a.execucoesConcluidas, 0);
    const totalPrevistas = ativos.reduce(
      (acc, a) => acc + (a.quantidadePrevistaExecucoes ?? 0),
      0,
    );
    const valores = ativos
      .map((a) => a.aderenciaPercentual)
      .filter((v): v is number => typeof v === "number");
    const mediaAderencia =
      valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    return {
      ciclosAtivos: ativos.length,
      totalExecucoes,
      totalPrevistas,
      mediaAderencia,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Treinos
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Aderência</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhamento de ciclos ativos e execucoes dos alunos prescritos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Input
              placeholder="Buscar aluno, treino ou professor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-secondary"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-border bg-secondary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="ENCERRADO">Encerrado</SelectItem>
              <SelectItem value="PAUSADO">Pausado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ciclos Ativos
            </p>
            <User className="size-4 text-gym-accent" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {stats.ciclosAtivos}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Aderência Média
            </p>
            <TrendingUp className="size-4 text-gym-teal" />
          </div>
          <p
            className={`mt-2 font-display text-2xl font-extrabold ${aderenciaColor(stats.mediaAderencia ?? undefined)}`}
          >
            {formatAderencia(stats.mediaAderencia ?? undefined)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Execuções (ativas)
            </p>
            <Target className="size-4 text-gym-warning" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold">{stats.totalExecucoes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Previstas (ativas)
            </p>
            <Target className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-muted-foreground">
            {stats.totalPrevistas}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum ciclo de treino encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Aluno
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Treino
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Professor
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Execuções
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Previsto
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Aderência
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Período
                </th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.cicloId} className="hover:bg-secondary/30">
                  <td className="px-3 py-2 font-medium">{a.clienteNome ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.treinoNome ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {a.professorNome ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {a.execucoesConcluidas}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                    {a.quantidadePrevistaExecucoes ?? "—"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-bold ${aderenciaColor(a.aderenciaPercentual)}`}
                  >
                    {formatAderencia(a.aderenciaPercentual)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {a.dataInicio ? formatDate(a.dataInicio) : "—"}
                    {a.dataFim ? ` → ${formatDate(a.dataFim)}` : ""}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[a.status] ?? STATUS_CLASS.ENCERRADO}`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
