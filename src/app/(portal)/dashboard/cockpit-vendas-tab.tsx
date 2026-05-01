"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { DashboardData } from "@/lib/types";
import {
  CockpitBarHChart,
  CockpitCompareChart,
  CockpitPanel,
} from "./cockpit-ui";
import {
  KPI_RAIL_CLASS,
  deltaLabel,
  type NormalizedMetrics,
} from "./cockpit-helpers";

type Props = {
  metrics: NormalizedMetrics;
  recentProspects: DashboardData["prospectsRecentes"];
  conversionRate: string;
};

export function CockpitVendasTab({ metrics, recentProspects, conversionRate }: Props) {
  const mediaPorContratoAtual = metrics.matriculasDoMes
    ? metrics.receitaDoMes / metrics.matriculasDoMes
    : 0;
  const mediaPorContratoAnterior =
    metrics.receitaDoMesAnterior / Math.max(metrics.matriculasDoMesAnterior, 1);
  const conversaoPctAtual = Number.parseFloat(conversionRate) || 0;
  const conversaoPctAnterior =
    metrics.prospectsNovosAnterior > 0
      ? (metrics.matriculasDoMesAnterior / metrics.prospectsNovosAnterior) * 100
      : 0;

  return (
    <>
      <div className={KPI_RAIL_CLASS}>
        <BiMetricCard
          compact
          minimalKpi
          label="Contratos vendidos"
          value={String(metrics.matriculasDoMes)}
          description="Novas matrículas computadas no período"
          icon={BarChart3}
          tone="accent"
          trend={deltaLabel(metrics.matriculasDoMes, metrics.matriculasDoMesAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Vendas manuais"
          value={formatBRL(metrics.vendasNovas)}
          description="Receita de contratos lançados manualmente"
          icon={ShoppingCart}
          tone="accent"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Vendas recorrentes"
          value={formatBRL(metrics.vendasRecorrentes)}
          description="Cobranças automáticas (débito, cartão)"
          icon={RefreshCw}
          tone="teal"
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Recebimentos no mês"
          value={formatBRL(metrics.pagamentosRecebidosMes)}
          description="Pagamentos efetivamente confirmados"
          icon={Wallet}
          tone="teal"
          trend={deltaLabel(metrics.pagamentosRecebidosMes, metrics.pagamentosRecebidosMesAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Valor total vendido"
          value={formatBRL(metrics.receitaDoMes)}
          description="Soma contratos + aditivos no período"
          icon={CircleDollarSign}
          tone="teal"
          trend={deltaLabel(metrics.receitaDoMes, metrics.receitaDoMesAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Ticket médio"
          value={formatBRL(metrics.ticketMedio)}
          description="Média ponderada dos contratos vendidos"
          icon={CreditCard}
          tone="accent"
          trend={deltaLabel(metrics.ticketMedio, metrics.ticketMedioAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Média por contrato"
          value={formatBRL(mediaPorContratoAtual)}
          description="Derivado do período atual"
          icon={TrendingUp}
          tone="teal"
          trend={deltaLabel(mediaPorContratoAtual, mediaPorContratoAnterior).text}
        />
        <BiMetricCard
          compact
          minimalKpi
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          description="Prospects novos vs matrículas no período"
          icon={UserCheck}
          tone="accent"
          trend={deltaLabel(conversaoPctAtual, conversaoPctAnterior).text}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm">
          <CockpitBarHChart
            title="Mix de vendas"
            subtitle="Breakdown das receitas no período de referência"
            segments={[
              {
                label: "Manuais",
                value: metrics.vendasNovas,
                color: "#6b8c1a",
                formatted: formatBRL(metrics.vendasNovas),
              },
              {
                label: "Recorrentes",
                value: metrics.vendasRecorrentes,
                color: "#1ea06a",
                formatted: formatBRL(metrics.vendasRecorrentes),
              },
              {
                label: "Recebimentos",
                value: metrics.pagamentosRecebidosMes,
                color: "#7c5cbf",
                formatted: formatBRL(metrics.pagamentosRecebidosMes),
              },
            ].filter((s) => s.value > 0)}
          />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm">
          <CockpitCompareChart
            title="Contratos e receita — atual vs anterior"
            subtitle="Comparação direta entre os dois períodos"
            pairs={[
              {
                label: "Contratos",
                current: metrics.matriculasDoMes,
                previous: metrics.matriculasDoMesAnterior,
                color: "#6b8c1a",
              },
              {
                label: "Prospects",
                current: metrics.prospectsNovos,
                previous: metrics.prospectsNovosAnterior,
                color: "#7c5cbf",
              },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CockpitPanel
          accent="primary"
          title="Prospects no pipeline"
          subtitle="Ativos — ordenação por criação"
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/prospects"><ArrowRight size={14} /></Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {recentProspects.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground opacity-50">Nenhum prospect ativo</p>
            ) : recentProspects.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 hover:border-primary/35 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-black text-primary">
                    {p.nome.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.telefone}</p>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </motion.div>
            ))}
          </div>
        </CockpitPanel>

        <CockpitPanel
          accent="teal"
          title="Renovações próximas"
          subtitle="Oportunidades de renovação de contrato"
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/contratos"><ArrowRight size={14} /></Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {metrics.matriculasVencendo.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground opacity-50">Nenhuma vencendo</p>
            ) : metrics.matriculasVencendo.slice(0, 5).map((m, i) => (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border/35 bg-muted/15 p-3 hover:border-gym-teal/35 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gym-teal/12 text-xs font-black text-gym-teal">
                    {m.aluno?.nome?.charAt(0) ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{m.aluno?.nome ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {m.plano?.nome} · {formatDate(m.dataFim)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </motion.div>
            ))}
          </div>
        </CockpitPanel>

        <CockpitPanel accent="danger" title="Risco comercial" subtitle="Pipeline sem ação — pressão sobre conversão">
          <div className="space-y-3">
            {[
              { label: "Prospects em aberto", value: metrics.prospectsEmAberto, cls: "" },
              { label: "Sem contato recente", value: metrics.followupPendente, cls: "text-gym-warning" },
              { label: "Visitaram e aguardam", value: metrics.visitasAguardandoRetorno, cls: "text-gym-accent" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-4">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className={`text-lg font-black ${cls}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-primary/5 p-4">
              <span className="text-sm font-medium text-muted-foreground">Taxa de conversão</span>
              <span className="text-lg font-black text-gym-accent">{conversionRate}%</span>
            </div>
          </div>
        </CockpitPanel>
      </div>
    </>
  );
}
