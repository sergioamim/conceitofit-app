"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  FileWarning,
  Landmark,
  LineChart,
  Percent,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { formatBRL, formatDate } from "@/lib/formatters";
import { KPI_RAIL_CLASS, type NormalizedMetrics } from "./cockpit-helpers";
import type { ContaPagar, DREGerencial, GrupoDre } from "@/lib/types";
import { CockpitDonutChart, CockpitGroupedBarFinance, CockpitPanel } from "./cockpit-ui";
import { getDreGerencialApi, listContasPagarApi } from "@/lib/api/financeiro-gerencial";
import { listContasReceberApi, type ContaReceberApiResponse } from "@/lib/api/contas-receber";
import { queryKeys } from "@/lib/query/keys";
import type { DonutSegment } from "./cockpit-ui";

/** Janelas de dias a partir da data de referência (YYYY-MM-DD). */
function addDaysToIso(refIso: string, days: number): string {
  const [yStr, mStr, dStr] = refIso.split("-");
  const y = Number(yStr);
  const mo = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return refIso;
  const t = Date.UTC(y, mo - 1, d + days);
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, "0")}-${String(
    nd.getUTCDate(),
  ).padStart(2, "0")}`;
}

function compareIsoDates(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return String(a).localeCompare(String(b));
}

function utcMsFromIsoDate(iso: string): number {
  const parts = iso.split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return Date.UTC(y, m - 1, d);
}

function daysUntil(refIso: string, vencIso: string): number {
  const a = utcMsFromIsoDate(refIso);
  const b = utcMsFromIsoDate(vencIso);
  return Math.round((b - a) / 86400000);
}

function capitalizePt(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, "");
}

function dreDespesasTotais(d: DREGerencial): number {
  return Math.max(0, d.custosVariaveis + d.despesasOperacionais);
}

function dreImpostosTotal(d: DREGerencial): number {
  const grupo = (d.despesasPorGrupo ?? []).find((row: { grupo: GrupoDre; valor: number }) => row.grupo === "IMPOSTOS");
  const fromGrupo = grupo?.valor ?? 0;
  const fromCat = (d.despesasPorCategoria ?? []).find((r) => r.categoria === "IMPOSTOS")?.valor ?? 0;
  return Math.max(0, fromGrupo || fromCat);
}

function pctChange(cur: number, prev: number): number {
  if (!Number.isFinite(prev) || Math.abs(prev) < 1e-9) return 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

function trendPctText(cur: number, prev: number, invertTone: boolean) {
  const raw = pctChange(cur, prev);
  if (!Number.isFinite(raw) || (Math.abs(cur) < 1e-6 && Math.abs(prev) < 1e-6)) {
    return { text: "—", teal: true };
  }
  const up = raw >= 0;
  const sym = raw >= 0 ? "↑" : "↓";
  const pretty = `${Math.abs(raw).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
  const text = `${sym} ${up ? "+" : "−"}${pretty}`;
  const tealWhenGood = invertTone ? !up : up;
  return { text, teal: tealWhenGood };
}

/** Variação em pontos percentuais (margem). */
function trendPontosPct(cur: number, prev: number, invertTone: boolean) {
  const diff = cur - prev;
  if (!Number.isFinite(diff)) return { text: "—", teal: true };
  if (Math.abs(diff) < 1e-6 && Math.abs(cur) < 1e-6) return { text: "—", teal: true };
  const up = diff >= 0;
  const sym = up ? "↑" : "↓";
  const txt = `${sym} ${up ? "+" : "−"}${Math.abs(diff).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} pp`;
  const tealWhenGood = invertTone ? !up : up;
  return { text: txt, teal: tealWhenGood };
}

function trendBrlVersusPrev(cur: number, prev: number) {
  const diff = cur - prev;
  if (!Number.isFinite(diff) || (Math.abs(cur) < 1e-6 && Math.abs(prev) < 1e-6)) return "—";
  const arrow = diff >= 0 ? "↑" : "↓";
  const sym = diff >= 0 ? "+" : "−";
  return `${arrow} ${sym}${formatBRL(Math.abs(diff))} vs mês ant.`;
}

function trendInad(cur: number, prev: number) {
  const diff = cur - prev;
  if (!Number.isFinite(diff) || (Math.abs(cur) < 1e-6 && Math.abs(prev) < 1e-6))
    return { text: "—", tone: "danger" as const };
  const up = diff > 0;
  const arrow = up ? "↑" : "↓";
  const sym = up ? "+" : "−";
  const text = `${arrow} ${sym}${formatBRL(Math.abs(diff))}`;
  return { text, tone: up ? ("danger" as const) : ("teal" as const) };
}

function donutFromDre(d: DREGerencial | null): { segments: DonutSegment[]; total: number } {
  if (!d) return { segments: [], total: 0 };
  const rows = [...(d.despesasPorCategoria ?? [])].filter((r) => r.valor > 0);
  if (rows.length === 0) {
    const total = dreDespesasTotais(d);
    return total <= 0
      ? { segments: [], total: 0 }
      : { segments: [{ label: "Despesas", value: total, color: "#9ea3b0" }], total };
  }

  type RollKey = "FOLHA_AGR" | "ALUGUEL" | "EQUIP_UTIL" | "MARKETING" | "OUTROS";
  const acc: Partial<Record<RollKey, number>> = {};
  const addTo = (k: RollKey, v: number) => {
    acc[k] = (acc[k] ?? 0) + v;
  };
  for (const r of rows) {
    switch (r.categoria) {
      case "FOLHA":
        addTo("FOLHA_AGR", r.valor);
        break;
      case "ALUGUEL":
        addTo("ALUGUEL", r.valor);
        break;
      case "MANUTENCAO":
      case "FORNECEDORES":
      case "UTILIDADES":
        addTo("EQUIP_UTIL", r.valor);
        break;
      case "MARKETING":
        addTo("MARKETING", r.valor);
        break;
      default:
        addTo("OUTROS", r.valor);
        break;
    }
  }

  const labelMap: Record<RollKey, { label: string; color: string }> = {
    FOLHA_AGR: { label: "Folha de pagamento", color: "#dc3545" },
    ALUGUEL: { label: "Aluguel", color: "#e09020" },
    EQUIP_UTIL: { label: "Equip. & utilidades", color: "#7c5cbf" },
    MARKETING: { label: "Marketing", color: "#1ea06a" },
    OUTROS: { label: "Outros", color: "#9ea3b0" },
  };

  const segments: DonutSegment[] = (Object.keys(acc) as RollKey[])
    .map((key) =>
      (acc[key] ?? 0) > 0
        ? ({
            label: labelMap[key].label,
            value: acc[key]!,
            color: labelMap[key].color,
          } satisfies DonutSegment)
        : null,
    )
    .filter(Boolean) as DonutSegment[];

  if (d.despesasSemTipoValor > 0) {
    segments.push({
      label: "Sem categoria definida",
      value: d.despesasSemTipoValor,
      color: "#5c6270",
    });
  }

  const total = segments.reduce((s, seg) => s + seg.value, 0) || dreDespesasTotais(d);
  segments.sort((a, b) => b.value - a.value);

  return { segments, total };
}

function dreMonthSlots(referenceISO: string) {
  const [yStart, moStart] = referenceISO.split("-").map(Number);
  const slots: Array<{ periodoKey: string; year: number; month: number; label: string }> = [];
  if (!Number.isFinite(yStart) || !Number.isFinite(moStart)) return slots;

  for (let i = -5; i <= 0; i += 1) {
    const pivot = new Date(Date.UTC(yStart, moStart - 1 + i, 1));
    const yy = pivot.getUTCFullYear();
    const mm = pivot.getUTCMonth() + 1;
    const d = new Date(Date.UTC(yy, mm - 1, 1));
    const label = capitalizePt(new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(d));
    slots.push({
      periodoKey: `${yy}-${String(mm).padStart(2, "0")}`,
      year: yy,
      month: mm,
      label,
    });
  }
  return slots;
}

function valorLiquidoContaPagar(c: Pick<ContaPagar, "valorOriginal" | "desconto" | "jurosMulta">) {
  return Math.max(0, c.valorOriginal - (c.desconto ?? 0) + (c.jurosMulta ?? 0));
}

function valorLiquidoContaReceber(c: Pick<ContaReceberApiResponse, "valorOriginal" | "desconto" | "jurosMulta">) {
  return Math.max(0, c.valorOriginal - (c.desconto ?? 0) + (c.jurosMulta ?? 0));
}

export function cockpitFinanceSubtitleCompact(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "Sem total";
  return `Total · ${Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n)}`;
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-black uppercase tracking-tighter text-primary">
      {Math.min(999, n)}
    </span>
  );
}

function tituloPainelFinance({ titulo, n }: { titulo: string; n: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 align-middle">
      {titulo} <CountBadge n={n} />
    </span>
  );
}

type Props = {
  metrics: NormalizedMetrics;
  openFinanceInspector: () => void;
  tenantId?: string | null;
  tenantReady?: boolean;
  referenceDateISO: string;
};

export function CockpitFinanceiroTab({
  metrics,
  openFinanceInspector,
  tenantId,
  tenantReady = false,
  referenceDateISO,
}: Props) {
  const monthSlots = dreMonthSlots(referenceDateISO);

  const dreQueries = useQueries({
    queries: monthSlots.map((slot) => ({
      queryKey: queryKeys.dre.gerencial(tenantId ?? "", slot.periodoKey),
      enabled: Boolean(tenantId && tenantReady),
      staleTime: 120_000,
      queryFn: () =>
        getDreGerencialApi({
          tenantId: tenantId!,
          year: slot.year,
          month: slot.month,
        }),
    })),
  });

  const serie: (DREGerencial | null)[] = monthSlots.map((_, i) => dreQueries[i]?.data ?? null);
  const dreOk = serie.some(Boolean);
  const dreLatestIndex = serie.length - 1;
  const dreLatest = serie[dreLatestIndex] ?? null;
  const drePrev = serie[dreLatestIndex - 1] ?? null;

  const receitaCur = dreLatest?.receitaLiquida ?? metrics.receitaDoMes;
  const receitaPrevMo = drePrev?.receitaLiquida ?? metrics.receitaDoMesAnterior;

  const despesasCur = dreLatest ? dreDespesasTotais(dreLatest) : 0;
  const despesasPrevMo = drePrev ? dreDespesasTotais(drePrev) : 0;

  const resultadoCur = dreLatest?.resultadoLiquido;
  const resultadoPrevMo = drePrev?.resultadoLiquido ?? 0;

  const margemCur =
    dreLatest && dreLatest.receitaLiquida > 0 ? (dreLatest.margemContribuicao / dreLatest.receitaLiquida) * 100 : 0;
  const margemPrevMo =
    drePrev && drePrev.receitaLiquida > 0 ? (drePrev.margemContribuicao / drePrev.receitaLiquida) * 100 : margemCur;

  const ebitCur = dreLatest?.ebitda ?? 0;
  const ebitPrev = drePrev?.ebitda ?? 0;

  const impostCur = dreLatest ? dreImpostosTotal(dreLatest) : 0;
  const impostPctRev = dreLatest && dreLatest.receitaLiquida > 0 ? (impostCur / dreLatest.receitaLiquida) * 100 : 0;




  const receitasSerie = serie.map((x) => x?.receitaLiquida ?? 0);
  const despesasSerie = serie.map((x) => (x ? dreDespesasTotais(x) : 0));

  const inadCur = dreLatest?.inadimplencia ?? metrics.inadimplencia;
  const inadPrevMo = drePrev?.inadimplencia ?? metrics.inadimplencia;

  const trReceita = trendPctText(receitaCur, receitaPrevMo, false);
  const trDespesa =
    dreLatest && drePrev
      ? trendPctText(Math.max(despesasCur, 1e-9), Math.max(despesasPrevMo, 1e-9), true)
      : { text: "—", teal: true };
  const trResult =
    dreLatest && drePrev ? trendPctText(resultadoCur!, resultadoPrevMo, false) : { text: "—", teal: true };
  const trMargem =
    dreLatest && drePrev ? trendPontosPct(margemCur, margemPrevMo, false) : { text: "—", teal: true };

  const trInad = trendInad(inadCur, inadPrevMo);

  const donut = donutFromDre(dreLatest);

  const dadosPagarFim15 = addDaysToIso(referenceDateISO, 14);

  const contasProximas = useQuery({
    queryKey: queryKeys.contasPagar.list(tenantId ?? "", {
      start: referenceDateISO,
      end: dadosPagarFim15,
    }),
    queryFn: async () => {
      const raw = await listContasPagarApi({
        tenantId: tenantId!,
        startDate: referenceDateISO,
        endDate: dadosPagarFim15,
        size: 200,
      });

      return raw
        .filter((c) => c.status === "PENDENTE" || c.status === "VENCIDA")
        .filter(
          (c) =>
            compareIsoDates(referenceDateISO, c.dataVencimento) <= 0 &&
            compareIsoDates(c.dataVencimento, dadosPagarFim15) <= 0,
        )
        .slice()
        .sort((a, b) => compareIsoDates(a.dataVencimento, b.dataVencimento));
    },
    enabled: Boolean(tenantId && tenantReady),
    staleTime: 60_000,
  });

  const receitasFim30d = addDaysToIso(referenceDateISO, 29);

  const receitasPrevistas = useQuery({
    queryKey: queryKeys.contasReceber.list(tenantId ?? "", {
      start: referenceDateISO,
      end: receitasFim30d,
      esperado: true,
    }),
    queryFn: async () => {
      const raw = await listContasReceberApi({
        tenantId: tenantId!,
        startDate: referenceDateISO,
        endDate: receitasFim30d,
        size: 200,
      });
      return raw
        .filter(
          (x) =>
            (x.status === "PENDENTE" || x.status === "VENCIDA") &&
            compareIsoDates(x.dataVencimento, receitasFim30d) <= 0,
        )
        .slice()
        .sort((a, b) => compareIsoDates(a.dataVencimento, b.dataVencimento));
    },
    enabled: Boolean(tenantId && tenantReady),
    staleTime: 60_000,
  });

  const graficoBarrasSubtitle = dreOk
    ? "Receitas vs despesas — últimos 6 meses (DRE gerencial)."
    : "DRE mensal indisponível ou sem permissão; barras zeradas até a API responder.";

  const itemsPagar = contasProximas.data ?? [];
  const itemsReceber = receitasPrevistas.data ?? [];

  const ebitTone = pctChange(ebitCur, Math.max(ebitPrev, 1e-9)) >= 0 ? "teal" : "warning";
  const ebitTrend =
    dreLatest && drePrev ? trendBrlVersusPrev(ebitCur, ebitPrev) : "— vs mês ant.";

  /** Pill do card Provisão: vem só do que o DRE agrega como IMPOSTOS; não há alíquota por unidade ainda no produto. */
  const pilulaImpostoContexto =
    dreLatest === null
      ? "DRE ausente"
      : dreLatest.receitaLiquida <= 1e-6
        ? "—"
        : impostCur > 0
          ? `${impostPctRev.toFixed(1)}% receita`
          : "Sem IMPOSTOS";

  return (
    <>
      <div className={KPI_RAIL_CLASS}>
          <BiMetricCard
            compact
            minimalKpi
            label="Receita líquida"
            value={formatBRL(receitaCur)}
            description="Último mês da série = mês da data de referência"
            icon={Banknote}
            tone={trReceita.teal ? "teal" : "warning"}
            trend={trReceita.text}
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Despesas totais"
            value={dreLatest ? formatBRL(despesasCur) : "—"}
            description="Custos variáveis + operacionais (DRE)"
            icon={Wallet}
            tone={trDespesa.teal ? "teal" : "danger"}
            trend={trDespesa.text}
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Resultado"
            value={resultadoCur !== undefined ? formatBRL(resultadoCur) : "—"}
            description="Resultado líquido (DRE)"
            icon={LineChart}
            tone={trResult.teal ? "teal" : "danger"}
            trend={trResult.text}
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Margem"
            value={
              dreLatest && dreLatest.receitaLiquida > 0
                ? `${margemCur.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}%`
                : "—"
            }
            description="Margem contribuição ÷ receita líquida"
            icon={Percent}
            tone={trMargem.teal ? "teal" : "warning"}
            trend={trMargem.text}
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Inadimplência"
            value={formatBRL(inadCur)}
            description="Preferência DRE do mês; senão KPI do dashboard"
            icon={AlertTriangle}
            tone={trInad.tone}
            trend={trInad.text}
            headerAccessory={
              <button
                type="button"
                onClick={() => openFinanceInspector()}
                className="rounded-md px-0 text-left text-[10px] font-black uppercase tracking-wide text-gym-danger underline-offset-4 hover:underline"
                data-testid="cockpit-finance-panel-trigger"
              >
                Ver detalhes
              </button>
            }
          />
          <BiMetricCard
            compact
            minimalKpi
            label="A receber (30d)"
            value={formatBRL(metrics.aReceber)}
            description="Campo consolidado pela API ao montar o dashboard (aReceber)."
            icon={CalendarClock}
            tone="teal"
            headerAccessory="Previsto"
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Caixa (proxy EBITDA)"
            value={dreLatest ? formatBRL(ebitCur) : "—"}
            description="Proxy operacional pela DRE; não é saldo bancário"
            icon={Landmark}
            tone={ebitTone}
            trend={ebitTrend === "—" ? undefined : ebitTrend}
          />
          <BiMetricCard
            compact
            minimalKpi
            label="Provisão impostos"
            value={impostCur > 0 ? formatBRL(impostCur) : "—"}
            description="Somente despesa já classificada como IMPOSTOS no DRE. Não existe ainda parametrização tributária por unidade."
            icon={FileWarning}
            tone="warning"
            headerAccessory={pilulaImpostoContexto}
          />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm">
          <CockpitGroupedBarFinance
            title="Fluxo de caixa"
            subtitle={graficoBarrasSubtitle}
            legendA="Receitas"
            legendB="Despesas"
            colorA="#1ea06a"
            colorB="#dc3545"
            labels={monthSlots.map((s) => s.label)}
            seriesA={receitasSerie}
            seriesB={despesasSerie}
          />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/95 px-5 py-5 shadow-sm">
          <CockpitDonutChart
            title="Distribuição de despesas"
            subtitle={cockpitFinanceSubtitleCompact(donut.total)}
            footnote={
              donut.segments.length
                ? "Categorias do DRE do mês de referência, agrupadas para leitura executiva."
                : "Cadastre contas categorizadas no gerencial para alimentar o gráfico."
            }
            segments={donut.segments}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <CockpitPanel
          accent="danger"
          title={tituloPainelFinance({ titulo: "Contas a pagar (15d)", n: itemsPagar.length })}
          subtitle={`Vencimento entre ${formatDate(referenceDateISO)} e ${formatDate(dadosPagarFim15)}`}
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/gerencial/contas-a-pagar" aria-label="Abrir contas a pagar">
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {contasProximas.isPending ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Carregando contas…</p>
            ) : contasProximas.isError ? (
              <p className="py-6 text-center text-sm text-gym-danger">
                Falha ao listar despesas. Verifique permissão em contas a pagar.
              </p>
            ) : itemsPagar.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground opacity-75">
                Nenhuma conta nesta janela.
              </p>
            ) : (
              itemsPagar.slice(0, 6).map((c, i) => {
                const dv = valorLiquidoContaPagar(c);
                const dleft = Math.max(daysUntil(referenceDateISO, c.dataVencimento), 0);
                const urgente = dleft <= 2;
                const recorrente =
                  String(c.origemLancamento ?? "").toUpperCase().includes("REC") || Boolean(c.regraRecorrenciaId);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={c.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/35 bg-muted/10 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{c.descricao || c.fornecedor}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Vence{" "}
                        {dleft === 0 ? "hoje" : `em ${dleft} dias`} · {recorrente ? "Recorrente" : "Pontual"}
                      </p>
                    </div>
                    <span
                      className={
                        urgente
                          ? "font-mono text-base font-black text-gym-warning"
                          : "font-mono text-base font-semibold text-muted-foreground"
                      }
                    >
                      {formatBRL(dv)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CockpitPanel>

        <CockpitPanel
          accent="teal"
          title={tituloPainelFinance({ titulo: "Recebimentos previstos", n: itemsReceber.length })}
          subtitle={`Liquidações entre ${formatDate(referenceDateISO)} e ${formatDate(receitasFim30d)}`}
          actions={
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
              <Link href="/gerencial/contas-a-receber" aria-label="Abrir contas a receber">
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {receitasPrevistas.isPending ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Carregando cobranças…</p>
            ) : receitasPrevistas.isError ? (
              <p className="py-6 text-center text-sm text-gym-danger">
                Falha ao listar receitas. Confirme permissões em contas a receber.
              </p>
            ) : itemsReceber.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground opacity-75">
                Nada agendado neste intervalo.
              </p>
            ) : (
              itemsReceber.slice(0, 6).map((r, i) => {
                const vl = valorLiquidoContaReceber(r);
                const dleft = Math.max(daysUntil(referenceDateISO, r.dataVencimento), 0);
                const iminente = dleft <= 1;
                const auto = r.origemLancamento === "RECORRENTE";
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/35 bg-muted/10 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{r.descricao || r.cliente}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {iminente ? "Liquidação iminente" : `Em até ${dleft} dias`}
                        {" · "}
                        {auto ? "Processamento automático · recorrência" : "Avulsa"}
                      </p>
                    </div>
                    <span
                      className={
                        iminente
                          ? "font-mono text-base font-black text-gym-teal"
                          : "font-mono text-base font-semibold text-muted-foreground"
                      }
                    >
                      {formatBRL(vl)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CockpitPanel>
      </div>
    </>
  );
}
