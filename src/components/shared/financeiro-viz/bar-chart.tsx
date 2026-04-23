/**
 * Bar chart simples em CSS flex — não usa Recharts pra evitar dep extra.
 * Espelho de `/tmp/design-p1/contas-a-pagar-receber/project/ui.jsx`
 * linhas 118-134.
 */

export type BarItem = {
  label: string;
  value: number;
  color?: string;
  dim?: boolean;
};

export type BarChartProps = {
  bars: BarItem[];
  height?: number;
  defaultColor?: string;
  className?: string;
};

export function BarChart({
  bars,
  height = 140,
  defaultColor = "var(--gym-accent, #6b8c1a)",
  className,
}: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value)) || 1;

  return (
    <div
      className={`flex items-end gap-2 ${className ?? ""}`}
      style={{ height }}
      role="img"
      aria-label={`Gráfico de barras com ${bars.length} categorias`}
    >
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end justify-center" style={{ height: height - 24 }}>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(4, (b.value / max) * 100)}%`,
                background: b.color ?? defaultColor,
                opacity: b.dim ? 0.4 : 1,
              }}
              title={b.label}
            />
          </div>
          <div className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}
