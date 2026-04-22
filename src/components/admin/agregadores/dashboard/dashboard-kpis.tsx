"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Gauge,
  HelpCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  DashboardKpis,
  DashboardComparativo,
} from "@/lib/api/agregadores-admin";

/**
 * AG-12 — KPIs do dashboard.
 *
 * Duas linhas:
 *  - Primária (4 cards grandes): checkins, clientes únicos, valor total,
 *    ticket médio por cliente. Cada um com badge de variação vs mês anterior.
 *  - Secundária (3 cards): ticket médio por check-in, média check-ins/cliente,
 *    saúde de webhooks (badge cor + sub-números).
 *
 * Todos os KPIs têm `aria-label` explicativo e usam formatadores pt-BR
 * consistentes com o resto do backoffice.
 */
export interface DashboardKpisProps {
  kpis: DashboardKpis;
  comparativo: DashboardComparativo;
}

function Variation({
  valuePct,
  label,
}: {
  valuePct: number;
  label: string;
}) {
  const positive = valuePct >= 0;
  const rounded = Math.round(valuePct * 100) / 100;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        positive
          ? "bg-gym-teal/15 text-gym-teal"
          : "bg-gym-danger/15 text-gym-danger",
      )}
      aria-label={`${label}: ${positive ? "+" : ""}${rounded}% vs mês anterior`}
      data-testid={`variation-${label}`}
      data-tone={positive ? "up" : "down"}
    >
      {positive ? (
        <ArrowUp className="size-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3" aria-hidden="true" />
      )}
      {positive ? "+" : ""}
      {rounded}%
    </span>
  );
}

export function DashboardKpis({ kpis, comparativo }: DashboardKpisProps) {
  const webhookHealth = deriveWebhookHealth(kpis);

  return (
    <TooltipProvider>
      <section
        aria-label="Indicadores principais"
        className="flex flex-col gap-4"
        data-testid="dashboard-kpis"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Activity}
            label="Check-ins validados"
            value={kpis.checkinsValidados.toLocaleString("pt-BR")}
            subtitle="no mês"
            right={
              <Variation
                valuePct={comparativo.variacaoCheckinsPct}
                label="checkins"
              />
            }
            tone="accent"
          />
          <KpiCard
            icon={Users}
            label="Clientes únicos ativos"
            value={kpis.clientesUnicosAtivos.toLocaleString("pt-BR")}
            subtitle="no mês"
            tone="teal"
          />
          <KpiCard
            icon={DollarSign}
            label="Valor total"
            value={formatBRL(kpis.valorTotal)}
            subtitle="no mês"
            right={
              <Variation
                valuePct={comparativo.variacaoValorPct}
                label="valor"
              />
            }
            tone="warning"
          />
          <KpiCard
            icon={Gauge}
            label="Ticket médio por cliente"
            value={formatBRL(kpis.ticketMedioPorCliente)}
            subtitle="valor_total / clientes_únicos"
            right={
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Como calcular ticket médio por cliente"
                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>
                  valor_total / clientes_únicos
                </TooltipContent>
              </Tooltip>
            }
            tone="accent"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <KpiCardSecundario
            label="Ticket médio por check-in"
            value={formatBRL(kpis.ticketMedioPorCheckin)}
            hint="valor_total / check-ins"
          />
          <KpiCardSecundario
            label="Média check-ins / cliente"
            value={kpis.mediaCheckinsPorCliente
              .toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            hint="check-ins / clientes_únicos"
          />
          <WebhookHealthCard
            tone={webhookHealth.tone}
            label={webhookHealth.label}
            kpis={kpis}
          />
        </div>
      </section>
    </TooltipProvider>
  );
}

type Tone = "accent" | "teal" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  accent: "text-gym-accent border-gym-accent/20 bg-gym-accent/10",
  teal: "text-gym-teal border-gym-teal/20 bg-gym-teal/10",
  warning: "text-gym-warning border-gym-warning/20 bg-gym-warning/10",
  danger: "text-gym-danger border-gym-danger/20 bg-gym-danger/10",
};

function KpiCard({
  label,
  value,
  subtitle,
  right,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: Tone;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
      aria-label={`${label}: ${value}`}
      data-testid={`kpi-card-${slug(label)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        {right}
      </div>
      <div className="mt-4 space-y-0.5">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
          {label}
        </p>
        <p className="font-display text-3xl font-extrabold tracking-tight">
          {value}
        </p>
        {subtitle ? (
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function KpiCardSecundario({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border/60 bg-card px-4 py-3"
      aria-label={`${label}: ${value}`}
      data-testid={`kpi-secundario-${slug(label)}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}

function WebhookHealthCard({
  tone,
  label,
  kpis,
}: {
  tone: Tone;
  label: string;
  kpis: DashboardKpis;
}) {
  return (
    <details
      className="rounded-xl border border-border/60 bg-card"
      data-testid="webhook-health-card"
    >
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none"
        aria-label={`Saúde de webhooks: ${label}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Saúde de webhooks
        </span>
        <Badge
          variant="secondary"
          data-testid="webhook-health-badge"
          data-tone={tone}
          className={cn(
            "gap-1 border text-xs font-semibold",
            TONE_CLASSES[tone],
          )}
        >
          <ShieldCheck className="size-3" aria-hidden />
          {label}
        </Badge>
      </summary>
      <div className="grid grid-cols-3 gap-2 border-t border-border/60 px-4 py-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Recebidos
          </p>
          <p className="text-lg font-bold">
            {kpis.webhooksRecebidos.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Previous sig.
          </p>
          <p className="text-lg font-bold">
            {kpis.webhooksComPrevious.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Inválidas / DLQ
          </p>
          <p className="text-lg font-bold">
            {(
              kpis.webhooksAssinaturaInvalida + kpis.deadLetters
            ).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
    </details>
  );
}

function deriveWebhookHealth(kpis: DashboardKpis): {
  tone: Tone;
  label: string;
} {
  if (kpis.deadLetters > 0 || kpis.webhooksAssinaturaInvalida > 0) {
    return { tone: "danger", label: "Atenção" };
  }
  if (kpis.webhooksComPrevious > 0) {
    return { tone: "warning", label: "Rotação pendente" };
  }
  return { tone: "teal", label: "Saudável" };
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
