"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";
import type {
  DashboardDistribuicaoSemanaPonto,
  DashboardPorAgregador,
  DashboardSerieDiariaPonto,
} from "@/lib/api/agregadores-admin";

/**
 * AG-12 — Gráficos do dashboard em SVG puro.
 *
 * Sem dependência externa (o projeto não possui recharts / tremor / etc).
 * Charts implementados:
 *   - {@link SerieTemporalChart}   → linha de check-ins + barras de valor/dia
 *   - {@link DistribuicaoSemanaChart} → 7 barras (DOM→SAB)
 *   - {@link ComparativoDonut}     → donut Wellhub vs TotalPass (toggle)
 */

// ─── Série temporal ────────────────────────────────────────────────────────

export function SerieTemporalChart({
  data,
}: {
  data: DashboardSerieDiariaPonto[];
}) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 24, bottom: 28, left: 40 };

  const maxCheckins = Math.max(1, ...data.map((d) => d.checkins));
  const maxValor = Math.max(1, ...data.map((d) => d.valorTotal));

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const pointX = (i: number) =>
    padding.left +
    (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const pointYCheckins = (v: number) =>
    padding.top + innerH - (v / maxCheckins) * innerH;
  const pointYValor = (v: number) =>
    padding.top + innerH - (v / maxValor) * innerH;

  const linePath = useMemo(() => {
    if (data.length === 0) return "";
    return data
      .map((d, i) => {
        const x = pointX(i);
        const y = pointYCheckins(d.checkins);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (data.length === 0) {
    return (
      <EmptyChart message="Sem série temporal para o período." />
    );
  }

  return (
    <figure
      className="w-full"
      data-testid="chart-serie-temporal"
      aria-label={`Série temporal de check-ins diários (${data.length} dias)`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
      >
        {/* Eixos */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          className="stroke-border"
          strokeWidth={1}
        />
        {/* Barras de valor (secundário) */}
        {data.map((d, i) => {
          const cx = pointX(i);
          const y = pointYValor(d.valorTotal);
          const w = Math.max(2, innerW / data.length - 2);
          return (
            <rect
              key={`v-${d.data}`}
              x={cx - w / 2}
              y={y}
              width={w}
              height={padding.top + innerH - y}
              className="fill-gym-warning/25"
            >
              <title>
                {d.data} — {formatBRL(d.valorTotal)}
              </title>
            </rect>
          );
        })}
        {/* Linha de check-ins */}
        <path
          d={linePath}
          className="stroke-gym-accent"
          strokeWidth={2}
          fill="none"
        />
        {/* Pontos */}
        {data.map((d, i) => (
          <circle
            key={`c-${d.data}`}
            cx={pointX(i)}
            cy={pointYCheckins(d.checkins)}
            r={2.5}
            className="fill-gym-accent"
          >
            <title>
              {d.data} — {d.checkins} check-ins / {formatBRL(d.valorTotal)}
            </title>
          </circle>
        ))}
      </svg>
      <figcaption className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-gym-accent" />
          Check-ins
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-gym-warning/50" />
          Valor
        </span>
      </figcaption>
    </figure>
  );
}

// ─── Distribuição por dia da semana ────────────────────────────────────────

export function DistribuicaoSemanaChart({
  data,
}: {
  data: DashboardDistribuicaoSemanaPonto[];
}) {
  const width = 540;
  const height = 200;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.map((p) => p.checkins));
  const barW = innerW / data.length - 6;

  if (data.length === 0) {
    return <EmptyChart message="Sem dados de distribuição semanal." />;
  }

  return (
    <figure
      className="w-full"
      data-testid="chart-distribuicao-semana"
      aria-label="Distribuição de check-ins por dia da semana"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
      >
        {data.map((point, i) => {
          const cx = padding.left + i * (innerW / data.length) + 3;
          const barH = (point.checkins / max) * innerH;
          const y = padding.top + innerH - barH;
          return (
            <g key={point.label}>
              <rect
                x={cx}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className={cn(
                  "fill-gym-accent",
                  point.diaDaSemana === 1 || point.diaDaSemana === 7
                    ? "fill-gym-accent/50"
                    : "",
                )}
              >
                <title>
                  {point.label} — {point.checkins} check-ins /{" "}
                  {formatBRL(point.valorTotal)}
                </title>
              </rect>
              <text
                x={cx + barW / 2}
                y={padding.top + innerH + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.label}
              </text>
              <text
                x={cx + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                {point.checkins}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

// ─── Donut Wellhub vs TotalPass ────────────────────────────────────────────

export type DonutMetric = "checkins" | "valor";

export function ComparativoDonut({
  porAgregador,
}: {
  porAgregador: DashboardPorAgregador[];
}) {
  const [metric, setMetric] = useState<DonutMetric>("checkins");

  const values = porAgregador.map((p) =>
    metric === "checkins" ? p.checkins : p.valorTotal,
  );
  const total = values.reduce((acc, v) => acc + v, 0);

  const colors: Record<string, string> = {
    WELLHUB: "var(--gym-accent, #f97316)",
    TOTALPASS: "var(--gym-teal, #14b8a6)",
  };

  const cx = 90;
  const cy = 90;
  const r = 70;
  const rInner = 44;

  const fractions = values.map((v) => (total === 0 ? 0 : v / total));
  const slices = porAgregador.map((p, i) => {
    const fraction = fractions[i] ?? 0;
    const previousEnd = fractions.slice(0, i).reduce((sum, f) => sum + f, 0);
    const end = previousEnd + fraction;
    return {
      tipo: p.agregador,
      value: values[i] ?? 0,
      fraction,
      path: arcPath(
        cx,
        cy,
        r,
        rInner,
        previousEnd * 2 * Math.PI,
        end * 2 * Math.PI,
      ),
      color: colors[p.agregador] ?? "#888",
    };
  });

  return (
    <figure
      className="w-full"
      aria-label={`Comparativo por agregador (${metric})`}
      data-testid="chart-comparativo-donut"
    >
      <div className="mb-3 inline-flex items-center gap-1 rounded-md border border-border bg-secondary p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setMetric("checkins")}
          data-testid="donut-toggle-checkins"
          aria-pressed={metric === "checkins"}
          className={cn(
            "rounded-sm px-2 py-1 font-semibold",
            metric === "checkins"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Check-ins
        </button>
        <button
          type="button"
          onClick={() => setMetric("valor")}
          data-testid="donut-toggle-valor"
          aria-pressed={metric === "valor"}
          className={cn(
            "rounded-sm px-2 py-1 font-semibold",
            metric === "valor"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Valor
        </button>
      </div>
      <div className="flex items-center gap-6">
        <svg
          viewBox="0 0 180 180"
          className="h-40 w-40 flex-shrink-0"
          role="img"
        >
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={(r + rInner) / 2}
              className="fill-none stroke-border"
              strokeWidth={r - rInner}
            />
          ) : (
            slices.map((s) => (
              <path
                key={s.tipo}
                d={s.path}
                fill={s.color}
                stroke="var(--background, #fff)"
                strokeWidth={1}
              >
                <title>
                  {s.tipo} —{" "}
                  {metric === "valor"
                    ? formatBRL(s.value)
                    : `${s.value.toLocaleString("pt-BR")} check-ins`}{" "}
                  ({(s.fraction * 100).toFixed(1)}%)
                </title>
              </path>
            ))
          )}
        </svg>
        <ul className="space-y-2 text-sm">
          {slices.map((s) => (
            <li
              key={s.tipo}
              className="flex items-center gap-2"
              data-testid={`donut-legend-${s.tipo}`}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="font-semibold">{s.tipo}</span>
              <span className="text-muted-foreground">
                {metric === "valor"
                  ? formatBRL(s.value)
                  : `${s.value.toLocaleString("pt-BR")} check-ins`}{" "}
                ({(s.fraction * 100).toFixed(1)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Arco anular (donut slice). Protege contra start==end (fatia vazia). */
function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string {
  if (Math.abs(endAngle - startAngle) < 1e-4) return "";
  const full = Math.abs(endAngle - startAngle) >= Math.PI * 2 - 1e-4;
  const end = full ? endAngle - 1e-4 : endAngle;
  const large = end - startAngle > Math.PI ? 1 : 0;

  const x1 = cx + rOuter * Math.sin(startAngle);
  const y1 = cy - rOuter * Math.cos(startAngle);
  const x2 = cx + rOuter * Math.sin(end);
  const y2 = cy - rOuter * Math.cos(end);

  const x3 = cx + rInner * Math.sin(end);
  const y3 = cy - rInner * Math.cos(end);
  const x4 = cx + rInner * Math.sin(startAngle);
  const y4 = cy - rInner * Math.cos(startAngle);

  return [
    `M ${x1.toFixed(2)},${y1.toFixed(2)}`,
    `A ${rOuter},${rOuter} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)},${y3.toFixed(2)}`,
    `A ${rInner},${rInner} 0 ${large} 0 ${x4.toFixed(2)},${y4.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
