/**
 * Sparkline SVG — tendência compacta para cards de KPI. Espelho de
 * `/tmp/design-p1/contas-a-pagar-receber/project/ui.jsx` linhas 73-92
 * adaptado ao design system do ConceitoFit.
 *
 * Hidratation-safe: recebe `data` como prop, sem qualquer mutação
 * durante render.
 */

import type { CSSProperties } from "react";

export type SparklineProps = {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Sparkline({
  data,
  color = "#6b8c1a",
  height = 28,
  width = 80,
  fill = true,
  className,
  style,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const dPath = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${dPath} L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      width={width}
      height={height}
      className={className}
      style={style}
      aria-hidden="true"
      role="presentation"
    >
      {fill ? <path d={areaPath} fill={color} opacity={0.12} /> : null}
      <path
        d={dPath}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}
