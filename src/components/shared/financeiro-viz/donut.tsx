/**
 * Donut chart — segmentos proporcionais. Espelho de
 * `/tmp/design-p1/contas-a-pagar-receber/project/ui.jsx` linhas 95-115.
 */

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
  /** Chave estável (ex.: canal id) quando `label` pode repetir. */
  id?: string;
};

export type DonutProps = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Cor do anel base (onde não há segmento). */
  trackColor?: string;
  className?: string;
};

export function Donut({
  segments,
  size = 120,
  thickness = 18,
  trackColor = "var(--secondary, #f0f1f4)",
  className,
}: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  // Pre-computa offset cumulativo de forma pura (evita let reatribuido
  // durante render — requisito do react-hooks do React 19).
  const computed = segments.reduce<{ items: Array<{ seg: DonutSegment; len: number; offset: number }>; offset: number }>(
    (acc, seg) => {
      const len = (seg.value / total) * circ;
      return {
        items: [...acc.items, { seg, len, offset: acc.offset }],
        offset: acc.offset + len,
      };
    },
    { items: [], offset: 0 },
  );

  return (
    <svg
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Gráfico donut com ${segments.length} segmentos`}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={thickness} />
      {computed.items.map(({ seg, len, offset }) => (
        <circle
          key={seg.id ?? seg.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={`${len} ${circ - len}`}
          strokeDashoffset={-offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}
