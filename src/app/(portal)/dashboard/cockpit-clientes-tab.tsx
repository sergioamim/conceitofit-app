"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  PauseCircle,
  Search as SearchIcon,
  UserMinus,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { formatDate } from "@/lib/formatters";
import type { DashboardData } from "@/lib/types";
import { useCockpitAcessosDiaPorHora } from "@/lib/query/use-cockpit-acessos-dia";
import { cn } from "@/lib/utils";
import type { BarHSegment } from "./cockpit-ui";
import { CockpitBarHChart, CockpitDualLineHourChart, CockpitPanel } from "./cockpit-ui";
import {
  KPI_RAIL_CLASS,
  deltaLabel,
  type NormalizedMetrics,
} from "./cockpit-helpers";

const PALETTE_MOTIVO = ["#dc3545", "#e09020", "#7c5cbf", "#9ea3b0", "#1ea06a", "#6b8c1a"];

/** Layout do protótipo enquanto a API não expõe agrupamento. */
const CANCELAMENTOS_LAYOUT_REFERENCIA: BarHSegment[] = [
  { label: "Inadimplência auto", value: 4, color: "#dc3545", formatted: "4" },
  { label: "Problemas de saúde", value: 2, color: "#e09020", formatted: "2" },
  { label: "Mudou de cidade", value: 1, color: "#7c5cbf", formatted: "1" },
  { label: "Outros (especif.)", value: 1, color: "#9ea3b0", formatted: "1" },
];

/** 24 valores (hora 1..24) sempre zero até carregar série real. */
const HORAS_ZERO = Array.from({ length: 24 }, (): number => 0);

function tituloMesReferencia(isoDia: string) {
  try {
    const raw = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      new Date(`${isoDia}T12:00:00`),
    );
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return isoDia;
  }
}

function segmentosCancelamentosPorMotivos(
  metrics: NormalizedMetrics,
): { barras: BarHSegment[]; origemReal: boolean } {
  const api = metrics.contratosCanceladosMotivos;
  if (!api || Object.keys(api).length === 0) {
    return { barras: CANCELAMENTOS_LAYOUT_REFERENCIA, origemReal: false };
  }
  const ordered = Object.entries(api)
    .map(([motivo, value]) => ({ motivo: motivo.trim() || "(Motivo não informado)", value: Number(value) || 0 }))
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value);

  if (ordered.length === 0) {
    return { barras: [], origemReal: true };
  }

  const barras: BarHSegment[] = ordered.map(({ motivo, value }, idx) => ({
    label: motivo.length > 44 ? `${motivo.slice(0, 41)}…` : motivo,
    value,
    color: PALETTE_MOTIVO[idx % PALETTE_MOTIVO.length],
    formatted: value.toLocaleString("pt-BR"),
  }));
  return { barras, origemReal: true };
}

type Props = {
  metrics: NormalizedMetrics;
  recentProspects: DashboardData["prospectsRecentes"];
  tenantId?: string | null;
  tenantReady?: boolean;
  referenceDateISO: string;
};

export function CockpitClientesTab({
  metrics,
  recentProspects,
  tenantId,
  tenantReady = false,
  referenceDateISO,
}: Props) {
  const baseCarteira =
    metrics.statusAlunoCount.ATIVO +
    metrics.statusAlunoCount.INATIVO +
    metrics.statusAlunoCount.SUSPENSO +
    metrics.statusAlunoCount.CANCELADO +
    metrics.statusAlunoCount.BLOQUEADO;

  const cancelData = segmentosCancelamentosPorMotivos(metrics);
  const totalBarrasSomado = cancelData.barras.reduce((a, s) => a + s.value, 0);
  const subtitleCancelamentos =
    cancelData.origemReal && cancelData.barras.length === 0
      ? `${tituloMesReferencia(referenceDateISO)} · nenhum motivo agrupável`
      : `${tituloMesReferencia(referenceDateISO)} · total: ${totalBarrasSomado.toLocaleString("pt-BR")}`;

  const catracaDiaQuery = useCockpitAcessosDiaPorHora({
    tenantId: tenantId ?? undefined,
    enabled: Boolean(tenantId) && tenantReady && Boolean(referenceDateISO),
    diaISO: referenceDateISO,
  });

  const serieRoxo = catracaDiaQuery.data?.clientesUnicosPorHora ?? HORAS_ZERO;
  const serieVerde = catracaDiaQuery.data?.mediaMovelPorHora ?? HORAS_ZERO;

  const subtituloLinhas =
    catracaDiaQuery.data && catracaDiaQuery.data.totalLinhasConsumidas === 0
      ? "Total de clientes × média das entradas (sem registros neste dia)."
      : "Total de clientes × média de acessos (suavização 3 horas vizinhas)";

  const footnoteLinhas = catracaDiaQuery.isPending
    ? "Carregando liberações de catraca para o dia de referência…"
    : catracaDiaQuery.isError
      ? `Não foi possível ler acesso da catraca para este dia (${tituloMesReferencia(referenceDateISO)}).`
      : [
          "Horas no fuso local do navegador.",
          catracaDiaQuery.data?.amostragemTruncada ? "Lista provavelmente incompleta: limite de paginação atingido." : "",
          `Eventos lidos: ${(catracaDiaQuery.data?.totalLinhasConsumidas ?? 0).toLocaleString("pt-BR")}.`,
        ]
          .filter(Boolean)
          .join(" ");

  return (
    <>
      <div className={KPI_RAIL_CLASS}>
        <BiMetricCard
          compact
          minimalKpi
          label="Clientes ativos"
          value={String(metrics.statusAlunoCount.ATIVO)}
          description={`Total carteira: ${baseCarteira}`}
          icon={Users}
          tone="teal"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Suspensos"
          value={String(metrics.statusAlunoCount.SUSPENSO)}
          description="Contratos temporariamente pausados"
          icon={PauseCircle}
          tone="warning"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Inativos"
          value={String(metrics.statusAlunoCount.INATIVO)}
          description="Contratos encerrados sem cancelamento formal"
          icon={UserMinus}
          tone="warning"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Cancelados"
          value={String(metrics.statusAlunoCount.CANCELADO)}
          description="Evasão formalizada no período"
          icon={UserX}
          tone="danger"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Novos prospects"
          value={String(metrics.prospectsNovos)}
          description="Entradas no período atual"
          icon={UserPlus}
          tone="accent"
          trend={deltaLabel(metrics.prospectsNovos, metrics.prospectsNovosAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Prospects em aberto"
          value={String(metrics.prospectsEmAberto)}
          description="Pipeline comercial ativo sem conversão"
          icon={SearchIcon}
          tone="accent"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Visitas aguardando"
          value={String(metrics.visitasAguardandoRetorno)}
          description="Visitaram e ainda não receberam retorno"
          icon={CalendarClock}
          tone="warning"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Follow-up pendente"
          value={String(metrics.followupPendente)}
          description="Sem contato há 48h+ — risco de perda"
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm">
          {cancelData.origemReal && cancelData.barras.length === 0 ? (
            <div>
              <p className="text-sm font-bold tracking-tight">Contratos cancelados — motivos</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{subtitleCancelamentos}</p>
              <p className="mt-12 text-center text-sm text-muted-foreground">
                Nenhum cancelamento agrupável neste período.
              </p>
            </div>
          ) : (
            <>
              <CockpitBarHChart
                title="Contratos cancelados — motivos"
                subtitle={subtitleCancelamentos}
                segments={cancelData.barras}
              />
              {!cancelData.origemReal ? (
                <p className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold leading-snug text-amber-950/90 dark:text-amber-100/90">
                  Barras apenas de referência de layout até o campo{" "}
                  <code className="font-mono">contratosCanceladosMotivos</code> aparecer no JSON do dashboard.
                </p>
              ) : null}
            </>
          )}
        </div>
        <div
          className={cn(
            "rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm transition-opacity",
            catracaDiaQuery.isPending && "opacity-[0.72]",
          )}
        >
          <CockpitDualLineHourChart
            title="Acessos do dia"
            subtitle={subtituloLinhas}
            footnote={footnoteLinhas}
            seriesA={{ label: "Total de clientes", color: "#7c5cbf", values: serieRoxo }}
            seriesB={{ label: "Média de acessos", color: "#1ea06a", values: serieVerde }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
        <CockpitPanel
          accent="purple"
          title="Prospects recentes"
          subtitle="Pipeline ativo — ordenação por criação"
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/prospects">
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {recentProspects.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground opacity-50">Nenhum prospect ativo</p>
            ) : (
              recentProspects.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 transition-colors hover:border-primary/35"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-black text-primary">
                      {p.nome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.nome}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.telefone}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </motion.div>
              ))
            )}
          </div>
        </CockpitPanel>

        <CockpitPanel
          accent="teal"
          title="Renovações próximas"
          subtitle="Matrículas com vencimento iminente"
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/contratos">
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {metrics.matriculasVencendo.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground opacity-50">Nenhuma vencendo</p>
            ) : (
              metrics.matriculasVencendo.slice(0, 5).map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 transition-colors hover:border-gym-teal/35"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gym-teal/12 text-xs font-black text-gym-teal">
                      {m.aluno?.nome?.charAt(0) ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{m.aluno?.nome ?? "—"}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {m.plano?.nome} · {formatDate(m.dataFim)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </motion.div>
              ))
            )}
          </div>
        </CockpitPanel>
      </div>
    </>
  );
}
