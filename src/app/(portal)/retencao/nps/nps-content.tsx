"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Frown,
  Meh,
  Smile,
  Star,
  MessageSquareHeart,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getNpsDashboardApi,
  type NpsDashboard,
  type NpsDashboardCritico,
} from "@/lib/api/nps";
import { formatDateTime } from "@/lib/formatters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const npsKeys = {
  dashboard: (tenantId: string, inicio: string, fim: string) =>
    ["nps", "dashboard", tenantId, inicio, fim] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultDateRange() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const fim = hoje.toISOString().slice(0, 10);
  return { inicio, fim };
}

function npsScoreColor(score: number): string {
  if (score < 0) return "text-gym-danger";
  if (score <= 50) return "text-gym-warning";
  return "text-gym-teal";
}

function npsScoreBgColor(score: number): string {
  if (score < 0) return "border-gym-danger/30 bg-gym-danger/10";
  if (score <= 50) return "border-gym-warning/30 bg-gym-warning/10";
  return "border-gym-teal/30 bg-gym-teal/10";
}

function classificacaoBadge(classificacao: string) {
  switch (classificacao) {
    case "PROMOTOR":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-xs font-bold text-gym-teal">
          <Smile size={12} /> Promotor
        </span>
      );
    case "NEUTRO":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
          <Meh size={12} /> Neutro
        </span>
      );
    case "DETRATOR":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gym-danger/15 px-2.5 py-0.5 text-xs font-bold text-gym-danger">
          <Frown size={12} /> Detrator
        </span>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: "accent" | "teal" | "warning" | "danger" | "muted";
}) {
  const tones: Record<string, string> = {
    accent: "text-gym-accent border-gym-accent/20 bg-gym-accent/10",
    teal: "text-gym-teal border-gym-teal/20 bg-gym-teal/10",
    warning: "text-gym-warning border-gym-warning/20 bg-gym-warning/10",
    danger: "text-gym-danger border-gym-danger/20 bg-gym-danger/10",
    muted: "text-muted-foreground border-border bg-muted",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="glass-card group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-xl hover:shadow-primary/5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${tones[tone]}`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              {label}
            </p>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">
              {value}
            </h3>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NpsDashboardContent({
  initialData,
}: {
  initialData: NpsDashboard | null;
}) {
  const { tenantId } = useTenantContext();
  const defaults = defaultDateRange();
  const [inicio, setInicio] = useState(defaults.inicio);
  const [fim, setFim] = useState(defaults.fim);

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery<NpsDashboard>({
    queryKey: npsKeys.dashboard(tenantId ?? "", inicio, fim),
    queryFn: () =>
      getNpsDashboardApi({ tenantId: tenantId!, inicio, fim }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    initialData: initialData ?? undefined,
  });

  if (isLoading && !dashboard) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        Carregando dashboard NPS...
      </div>
    );
  }

  if (error && !dashboard) {
    return <ListErrorState error={normalizeErrorMessage(error)} />;
  }

  const nps = dashboard?.npsScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            NPS & Pesquisa Relacional
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a satisfacao dos alunos e identifique detratores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/retencao/nps/campanhas">
            <Button variant="outline" className="border-border">
              Campanhas
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
          <Link href="/retencao/nps/envios">
            <Button variant="outline" className="border-border">
              Envios
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Date filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[170px_170px_auto]">
          <Input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="bg-secondary border-border"
          />
          <div />
        </div>
      </div>

      {/* NPS Score gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`glass-card flex flex-col items-center justify-center rounded-2xl border p-8 ${npsScoreBgColor(nps)}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
            NPS Score
          </p>
          <h2
            className={`font-display text-6xl font-black tracking-tight ${npsScoreColor(nps)}`}
          >
            {nps}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Escala de -100 a 100
          </p>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Promotores"
          value={String(dashboard?.promotores ?? 0)}
          icon={Smile}
          tone="teal"
        />
        <MetricCard
          label="Neutros"
          value={String(dashboard?.neutros ?? 0)}
          icon={Meh}
          tone="muted"
        />
        <MetricCard
          label="Detratores"
          value={String(dashboard?.detratores ?? 0)}
          icon={Frown}
          tone="danger"
        />
        <MetricCard
          label="Total respostas"
          value={String(dashboard?.totalRespostas ?? 0)}
          icon={Users}
          tone="accent"
        />
        <MetricCard
          label="Nota media"
          value={(dashboard?.notaMedia ?? 0).toFixed(1)}
          icon={Star}
          tone="warning"
        />
      </div>

      {/* Itens criticos */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
          Itens criticos
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Aluno
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Nota
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Classificacao
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Comentario
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Respondido em
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(!dashboard?.itensCriticos ||
                dashboard.itensCriticos.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum item critico no periodo.
                  </td>
                </tr>
              )}
              {dashboard?.itensCriticos?.map((item: NpsDashboardCritico) => (
                <tr
                  key={item.envioId}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.alunoNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.alunoId}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.nota <= 6
                          ? "bg-gym-danger/15 text-gym-danger"
                          : item.nota <= 8
                            ? "bg-gym-warning/15 text-gym-warning"
                            : "bg-gym-teal/15 text-gym-teal"
                      }`}
                    >
                      {item.nota}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {classificacaoBadge(item.classificacao)}
                  </td>
                  <td className="max-w-[250px] truncate px-4 py-3 text-muted-foreground">
                    {item.comentario ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(item.respondidoEm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
