"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Donut,
  type DonutSegment as VizDonutSegment,
} from "@/components/shared/financeiro-viz/donut";

/** Faixa contextual estilo protótipo `dashboard-app.jsx` insight */
export function CockpitInsightStrip({
  icon: Icon = Zap,
  tone = "accent",
  children,
}: {
  icon?: LucideIcon;
  tone?: "accent" | "teal" | "danger" | "warning";
  children: ReactNode;
}) {
  const tones = {
    accent:
      "border-primary/35 bg-gradient-to-r from-primary/14 via-transparent to-transparent text-foreground [&_svg]:text-primary",
    teal: "border-gym-teal/40 bg-gym-teal/10 text-foreground [&_svg]:text-gym-teal",
    danger: "border-gym-danger/45 bg-gym-danger/12 text-foreground [&_svg]:text-gym-danger",
    warning: "border-gym-warning/45 bg-gym-warning/14 text-foreground [&_svg]:text-gym-warning",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-[2px]",
        tones[tone],
      )}
      role="status"
      data-testid="cockpit-insight-strip"
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="text-[13px] font-semibold leading-snug md:text-sm">{children}</p>
    </div>
  );
}

/** Painel com tarja lateral (protótipo + densidade cockpit) */
export function CockpitPanel({
  accent = "primary",
  title,
  subtitle,
  actions,
  children,
}: {
  accent?: "primary" | "teal" | "danger" | "purple";
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const acc = {
    primary: "border-l-gym-accent bg-gym-accent/5",
    teal: "border-l-gym-teal bg-gym-teal/5",
    danger: "border-l-gym-danger bg-gym-danger/5",
    purple: "border-l-[#7c5cbf]/80 bg-[#7c5cbf]/8",
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 shadow-lg shadow-black/5",
        "border-l-4 bg-card/95",
        acc[accent],
      )}
    >
      <header className="flex flex-col gap-2 border-b border-border/35 bg-muted/15 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-black tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-[11px] font-medium text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

// ─── CHART: duas séries ao longo de 24h (horas 1–24 — índices 0..23) ─────────

export function CockpitDualLineHourChart({
  seriesA,
  seriesB,
  title,
  subtitle,
  footnote,
}: {
  title: string;
  subtitle?: string;
  footnote?: string;
  seriesA: { label: string; color: string; values: readonly number[] };
  seriesB: { label: string; color: string; values: readonly number[] };
}) {
  if (seriesA.values.length !== 24 || seriesB.values.length !== 24) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Série temporal inválida (esperado 24 valores).
      </p>
    );
  }

  const maxYRaw = Math.max(1, ...seriesA.values, ...seriesB.values);
  const maxY = Math.max(1, Math.ceil(maxYRaw));
  const yTicks =
    maxY <= 3 ? ([0, 1, 2, 3] as const).filter((y) => y <= maxY) : [0, Math.round(maxY / 2), maxY];

  const W = 520;
  const H = 220;
  const PL = 36;
  const PR = 12;
  const PT = 12;
  const PB = 32;
  const n = 23;

  const xAt = (i: number) => PL + (i / n) * (W - PL - PR);
  const iH = H - PT - PB;
  const yAt = (v: number) => PT + iH - (v / maxY) * iH;

  function buildPoly(values: readonly number[]) {
    return values.map((v, i) => `${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`).join(" ");
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {(title || subtitle) && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-tight">{title}</p>
            {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: seriesA.color }} aria-hidden />
            {seriesA.label}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: seriesB.color }} aria-hidden />
            {seriesB.label}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible text-foreground"
        role="img"
        aria-label={title}
      >
        {yTicks.map((yv) => {
          const gy = yAt(yv);
          return (
            <g key={yv}>
              <line
                x1={PL}
                y1={gy}
                x2={W - PR}
                y2={gy}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray="4 6"
              />
              <text
                x={PL - 6}
                y={gy + 3}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                fontWeight={600}
              >
                {yv}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 24 }).map((_, i) =>
          i % 4 === 0 ? (
            <text key={i} x={xAt(i)} y={H - 10} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={9}>
              {i + 1}
            </text>
          ) : null,
        )}
        <polyline
          fill="none"
          stroke={seriesA.color}
          strokeWidth={2.75}
          opacity={0.95}
          points={buildPoly(seriesA.values)}
        />
        <polyline
          fill="none"
          stroke={seriesB.color}
          strokeWidth={2.75}
          opacity={0.95}
          points={buildPoly(seriesB.values)}
        />
      </svg>
      {footnote ? <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{footnote}</p> : null}
    </div>
  );
}

// ─── CHART: Donut (usa donut financeiro para arcos proporcionais corretos) ──

/** Segmento compatível com {@link VizDonutSegment}. */
export type DonutSegment = VizDonutSegment;

export function CockpitDonutChart({
  segments,
  title,
  subtitle,
  footnote,
}: {
  segments: DonutSegment[];
  title?: string;
  subtitle?: string;
  /** Texto menor abaixo do gráfico (ex.: granularidade/unidade dos valores). */
  footnote?: string;
}) {
  const donutSegments = segments.filter((x) => x.value > 0).map((s) => ({ ...s, id: s.label }));
  const total = donutSegments.reduce((s, x) => s + x.value, 0);
  const size = 172;
  const thickness = 20;

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <p className="text-sm font-bold tracking-tight">{title}</p>}
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {total <= 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Sem dados para exibir.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <Donut segments={donutSegments} size={size} thickness={thickness} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-lg font-black leading-none">{total.toLocaleString("pt-BR")}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="min-w-[110px] flex-1 space-y-2">
            {donutSegments.map((seg) => (
              <div key={seg.id ?? seg.label} className="flex items-center gap-2">
                <div className="size-2 shrink-0 rounded-sm" style={{ background: seg.color }} />
                <span className="flex-1 truncate text-xs text-muted-foreground">{seg.label}</span>
                <span className="text-xs font-bold">{Math.round((seg.value / total) * 100)}%</span>
                <span className="text-xs text-muted-foreground">({seg.value.toLocaleString("pt-BR")})</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {footnote ? <p className="mt-4 text-[10px] leading-snug text-muted-foreground">{footnote}</p> : null}
    </div>
  );
}

// ─── CHART: Horizontal bars ───────────────────────────────────────────────────

export type BarHSegment = {
  label: string;
  value: number;
  color: string;
  formatted?: string;
};

export function CockpitBarHChart({
  segments,
  title,
  subtitle,
}: {
  segments: BarHSegment[];
  title?: string;
  subtitle?: string;
}) {
  const maxV = Math.max(...segments.map((s) => s.value), 1);
  const barH = 22;
  const gap = 10;
  const labelW = 140;
  const numW = 90;
  const innerW = 200;
  const svgH = segments.length * (barH + gap) + 12;

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <p className="text-sm font-bold tracking-tight">{title}</p>}
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <svg
        viewBox={`0 0 ${labelW + innerW + numW + 8} ${svgH}`}
        style={{ width: "100%", height: svgH }}
        aria-label={title ?? "Gráfico de barras"}
        role="img"
      >
        {segments.map((seg, i) => {
          const y = i * (barH + gap) + 8;
          const filled = (seg.value / maxV) * innerW;
          return (
            <g key={i}>
              <rect
                x={labelW}
                y={y}
                width={innerW}
                height={barH}
                fill="hsl(var(--muted))"
                rx={4}
              />
              <rect
                x={labelW}
                y={y}
                width={Math.max(filled, 3)}
                height={barH}
                fill={seg.color}
                rx={4}
                opacity={0.85}
              />
              <text
                x={labelW - 6}
                y={y + barH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
                fontSize={12}
                fontWeight={600}
              >
                {seg.label}
              </text>
              <text
                x={labelW + innerW + 6}
                y={y + barH / 2}
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={11}
                fontWeight={700}
              >
                {seg.formatted ?? seg.value.toLocaleString("pt-BR")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────

const SKELETON_KPI_RAIL =
  "flex snap-x snap-mandatory gap-4 overflow-x-hidden pb-2 sm:grid sm:grid-cols-2 sm:snap-none sm:overflow-visible sm:pb-0 lg:grid-cols-4";

export function CockpitSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy aria-label="Carregando dados...">
      <div className={SKELETON_KPI_RAIL}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[160px] rounded-2xl bg-muted/70 sm:min-w-0"
            style={{ height: 96 }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[200px] rounded-2xl bg-muted/70" />
        <div className="h-[200px] rounded-2xl bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/35 bg-card/80">
            <div className="h-14 bg-muted/60" />
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 rounded-xl bg-muted/50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CHART: Período atual vs anterior (2 barras por métrica) ─────────────────

export type ComparePair = {
  label: string;
  current: number;
  previous: number;
  formatted?: (v: number) => string;
  color: string;
};

export function CockpitCompareChart({
  pairs,
  title,
  subtitle,
}: {
  pairs: ComparePair[];
  title?: string;
  subtitle?: string;
}) {
  const allVals = pairs.flatMap((p) => [p.current, p.previous]);
  const maxV = Math.max(...allVals, 1);
  const W = 460;
  const H = 150;
  const PL = 10;
  const PR = 10;
  const PT = 10;
  const PB = 30;
  const iW = W - PL - PR;
  const iH = H - PT - PB;
  const grpW = iW / pairs.length;
  const barW = Math.max((grpW - 16) / 2, 6);
  const gapBetween = 4;

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <p className="text-sm font-bold tracking-tight">{title}</p>}
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="flex gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="size-2 rounded-sm bg-foreground/50" />
          Período anterior
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="size-2 rounded-sm" style={{ background: pairs[0]?.color }} />
          Período atual
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: H }}
        aria-label={title ?? "Comparação de períodos"}
        role="img"
      >
        {[0, 0.5, 1].map((t, i) => {
          const y = PT + iH - t * iH;
          return (
            <g key={i}>
              <line
                x1={PL}
                y1={y}
                x2={W - PR}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray={i === 0 ? undefined : "4,4"}
              />
            </g>
          );
        })}
        {pairs.map((pair, mi) => {
          const grpX = PL + mi * grpW + (grpW - 2 * barW - gapBetween) / 2;
          const prevH = (pair.previous / maxV) * iH;
          const currH = (pair.current / maxV) * iH;
          const fmt = pair.formatted ?? ((v) => v.toLocaleString("pt-BR"));
          return (
            <g key={mi}>
              {/* previous bar */}
              <rect
                x={grpX}
                y={PT + iH - prevH}
                width={barW}
                height={prevH}
                fill="hsl(var(--muted-foreground))"
                rx={3}
                opacity={0.4}
              />
              {/* current bar */}
              <rect
                x={grpX + barW + gapBetween}
                y={PT + iH - currH}
                width={barW}
                height={currH}
                fill={pair.color}
                rx={3}
                opacity={0.85}
              />
              <text
                x={grpX + barW + gapBetween / 2}
                y={H - 6}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={9.5}
              >
                {pair.label}
              </text>
              {/* current value label */}
              {currH > 16 && (
                <text
                  x={grpX + barW + gapBetween / 2}
                  y={PT + iH - currH - 4}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={9}
                  fontWeight={700}
                >
                  {fmt(pair.current)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── CHART: barras agrupadas (receitas vs despesas) por mês ────────────────────

function formatAxisCashBrl(pt: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: pt >= 100_000 ? 0 : 1,
  }).format(pt);
}

function compactBarTip(value: number): string {
  if (value <= 0) return "—";
  if (value >= 10_000) return formatAxisCashBrl(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Escalonamento monetário (ticks redondos, sem “271.051” pendurado à meia altura). */
function financeBarAxis(scaleMaxRaw: number): { maxY: number; ticks: number[] } {
  const maxData = Number.isFinite(scaleMaxRaw) ? Math.max(0, scaleMaxRaw) : 0;
  /** Sem dados: mantém proporção típica (~centenas de mil) só para grade; barras ficam zeradas. */
  if (maxData <= 0) {
    const m = 300_000;
    return {
      maxY: m,
      ticks: [0, m / 4, m / 2, (m * 3) / 4, m].map((x) => Math.round(x)),
    };
  }

  const padded = maxData * 1.06 + Math.max(maxData * 0.015, 1);
  const targetTicks = 5;
  const roughStep = padded / Math.max(targetTicks - 1, 1);
  const exponent = Math.floor(Math.log10(Math.max(roughStep, 1e-12)));
  const fraction = roughStep / 10 ** exponent;
  const niceFrac =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  let step = niceFrac * 10 ** exponent;
  let maxY = Math.ceil(padded / step) * step;
  while (maxY / step > 8) step *= 2;
  maxY = Math.ceil(padded / step) * step;

  const ticks: number[] = [];
  for (let v = 0; v <= maxY + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  const lastTick = ticks[ticks.length - 1];
  if (lastTick === undefined || lastTick < maxY - step * 0.001) ticks.push(maxY);
  const top = ticks[ticks.length - 1] ?? maxY;
  return { maxY: top, ticks };
}

export function CockpitGroupedBarFinance({
  title,
  subtitle,
  legendA,
  legendB,
  colorA,
  colorB,
  labels,
  seriesA,
  seriesB,
}: {
  title: string;
  subtitle?: string;
  legendA: string;
  legendB: string;
  colorA: string;
  colorB: string;
  labels: string[];
  seriesA: number[];
  seriesB: number[];
}) {
  const gradId = useId().replace(/:/g, "");

  if (labels.length !== seriesA.length || labels.length !== seriesB.length || labels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Série incompleta para o gráfico de fluxo de caixa.
      </p>
    );
  }

  const W = 572;
  const H = 280;
  const PAD_L = 52;
  const PAD_R = 14;
  const PAD_T = 20;
  const PAD_B = 38;

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;
  const maxVRaw = Math.max(0, ...seriesA, ...seriesB);
  const { maxY, ticks } = financeBarAxis(maxVRaw);
  /** Altura proporcional preservando zero no baseline. */
  const barH = (v: number) => (Math.max(0, v) / Math.max(maxY, 1e-9)) * iH;
  /** Evita barras positivas como fio (~1 px). */
  const MIN_BAR_PX = 3;

  const groupW = iW / labels.length;
  const barW = Math.max((groupW - 16) / 2, 5);
  const gapBars = Math.min(6, Math.max(3, groupW * 0.12));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/30 pb-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-tight text-foreground">{title}</p>
          {subtitle ? <p className="mt-0.5 max-w-xl text-[12px] leading-snug text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-[11px] font-semibold">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/15 px-2.5 py-1 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-sm" style={{ background: colorA }} aria-hidden />
            {legendA}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/15 px-2.5 py-1 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-sm" style={{ background: colorB }} aria-hidden />
            {legendB}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible text-foreground" role="img" aria-label={title}>
        <defs>
          <linearGradient id={`cf-bar-a-${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorA} stopOpacity={1} />
            <stop offset="100%" stopColor={colorA} stopOpacity={0.72} />
          </linearGradient>
          <linearGradient id={`cf-bar-b-${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorB} stopOpacity={1} />
            <stop offset="100%" stopColor={colorB} stopOpacity={0.72} />
          </linearGradient>
        </defs>

        {/* Grade + eixo Y */}
        {[...ticks].reverse().map((t) => {
          const frac = Math.max(0, Math.min(1, maxY <= 1e-15 ? 0 : t / maxY));
          const y = PAD_T + iH - frac * iH;
          const first = ticks[0]!;
          const last = ticks[ticks.length - 1]!;
          const tol = Math.max(Math.abs(last) * 1e-6, 1);
          const isBase = Math.abs(t - first) < tol;
          const isCeiling = Math.abs(t - last) < tol;
          return (
            <g key={`g-${t}`}>
              {!isCeiling ? (
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth={isBase ? 1.4 : 1}
                  opacity={isBase ? 0.92 : 0.5}
                  strokeDasharray={isBase ? undefined : "6 11"}
                />
              ) : null}
              <text
                x={PAD_L - 6}
                y={y + 4}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
                fontSize={9.5}
                fontWeight={600}
              >
                {isBase ? "R$ 0" : formatAxisCashBrl(t)}
              </text>
            </g>
          );
        })}

        {labels.map((label, mi) => {
          const gx = PAD_L + mi * groupW + (groupW - 2 * barW - gapBars) / 2;
          const va = seriesA[mi]!;
          const vb = seriesB[mi]!;
          let ha = barH(va);
          let hb = barH(vb);
          if (va > 0) ha = Math.max(ha, MIN_BAR_PX);
          if (vb > 0) hb = Math.max(hb, MIN_BAR_PX);
          const y0 = PAD_T + iH;
          const LABEL_MIN_H = iH * 0.07;
          return (
            <g key={`${label}-${mi}`}>
              {ha > 0 ? (
                <rect x={gx} y={y0 - ha} width={barW} height={ha} fill={`url(#cf-bar-a-${gradId})`} rx={6}>
                  <title>{`${legendA} ${label}: ${compactBarTip(va)}`}</title>
                </rect>
              ) : null}
              {hb > 0 ? (
                <rect
                  x={gx + barW + gapBars}
                  y={y0 - hb}
                  width={barW}
                  height={hb}
                  fill={`url(#cf-bar-b-${gradId})`}
                  rx={6}
                >
                  <title>{`${legendB} ${label}: ${compactBarTip(vb)}`}</title>
                </rect>
              ) : null}
              {va > 0 && ha >= LABEL_MIN_H ? (
                <text
                  x={gx + barW / 2}
                  y={y0 - ha - 6}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={8}
                  fontWeight={700}
                >
                  {formatAxisCashBrl(va)}
                </text>
              ) : null}
              {vb > 0 && hb >= LABEL_MIN_H ? (
                <text
                  x={gx + barW + gapBars + barW / 2}
                  y={y0 - hb - 6}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={8}
                  fontWeight={700}
                >
                  {formatAxisCashBrl(vb)}
                </text>
              ) : null}
              <text
                x={gx + barW + gapBars / 2}
                y={H - 8}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                fontWeight={650}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

    </div>
  );
}
