"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/shared/financeiro-viz/sparkline";

type BiMetricCardProps = {
  label: string;
  value: string;
  description?: string;
  delta?: string;
  tone?: "accent" | "teal" | "warning" | "danger";
  extra?: ReactNode;
  icon?: LucideIcon;
  trend?: string;
  /** Série histórica (>=2 pontos) para renderizar mini gráfico no card. */
  sparkline?: number[];
  /** Card inteiro vira alvo clicável (evita `<button><h3>` — usa role=button no container). */
  onPress?: () => void;
  "data-testid"?: string;
  /** Barra inferior 0–100 (protótipo cockpit). Omitir mantém faixa visual ~68%. */
  railPercent?: number;
  /** Pill/badge opcional ao canto superior direito (antes do trend/delta). */
  headerAccessory?: ReactNode;
  /**
   * Cockpit KPI “limpo”: sem sparkline nem barra inferior de progresso.
   */
  minimalKpi?: boolean;
  /** Card mais estreito/compacto para carrossel horizontal. */
  compact?: boolean;
  /**
   * Grid cockpit (ex.: financeiro): mesma altura mínima, faixa para sparkline
   * e rodapé alinhados entre cards mesmo com/extra footer.
   * Só aplica quando `compact` está ativo.
   */
  uniformHeight?: boolean;
};

/**
 * Versão minimal — sem framer-motion, sem backdrop-filter, sem hover
 * transforms/shadows. O objetivo aqui é eliminar a causa do piscar no
 * dashboard: a combinação anterior (`glass-card` com backdrop-blur +
 * `hover:shadow-xl` + motion.div de entrada + `group-hover:scale-110`
 * no ícone) causava repaints de composição visíveis quando o cursor
 * entrava/saía do card.
 *
 * Se depois quisermos reintroduzir algum efeito (hover shadow, scale
 * do ícone, animação de entrada), adicionar UM de cada vez e validar
 * visualmente. Cada um deles isolado tem causa documentada de flicker
 * quando combinado com backdrop-filter no Chrome/Safari.
 */
export function BiMetricCard({
  label,
  value,
  description,
  delta,
  tone = "accent",
  extra,
  icon: Icon,
  trend,
  sparkline,
  onPress,
  "data-testid": dataTestId,
  railPercent,
  headerAccessory,
  minimalKpi = false,
  compact = false,
  uniformHeight = false,
}: BiMetricCardProps) {
  const uGrid = compact && uniformHeight;

  const showMomentumRail = !minimalKpi;
  const sparklineEligible = !minimalKpi && Boolean(sparkline && sparkline.length >= 2);

  const tones = {
    accent: "text-gym-accent border-gym-accent/20 bg-gym-accent/10",
    teal: "text-gym-teal border-gym-teal/20 bg-gym-teal/10",
    warning: "text-gym-warning border-gym-warning/20 bg-gym-warning/10",
    danger: "text-gym-danger border-gym-danger/20 bg-gym-danger/10",
  };

  const progressColors = {
    accent: "bg-gym-accent",
    teal: "bg-gym-teal",
    warning: "bg-gym-warning",
    danger: "bg-gym-danger",
  };

  const sparklineColors: Record<NonNullable<BiMetricCardProps["tone"]>, string> = {
    accent: "#6b8c1a",
    teal: "#1ea06a",
    warning: "#e09020",
    danger: "#dc3545",
  };

  const interactive = Boolean(onPress);
  const resolvedRail =
    railPercent === undefined ? 68 : Math.min(100, Math.max(0, railPercent));

  const headerPillClass =
    "inline-flex shrink-0 items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground";

  return (
    <div
      className={cn(
        "min-w-[240px]",
        compact ? "max-w-[280px] flex-none shrink-0 sm:max-w-none lg:min-w-0 lg:flex-1" : "flex-1",
        uGrid && "h-full min-h-0",
      )}
    >
      <div
        data-testid={dataTestId}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm",
          uGrid && minimalKpi && "flex min-h-[208px] flex-col p-5",
          uGrid && !minimalKpi && "flex min-h-[272px] flex-col p-5 pb-5",
          !uGrid && compact && "p-5",
          !uGrid && !compact && "p-6",
          interactive &&
            "cursor-pointer transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onPress : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPress?.();
                }
              }
            : undefined
        }
        aria-label={interactive ? `${label}: ${value}` : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              tones[tone],
            )}
          >
            {Icon ? <Icon size={20} aria-hidden="true" /> : <TrendingUp size={20} aria-hidden="true" />}
          </div>
          {(headerAccessory || trend || delta) && (
            <div className="flex min-w-0 flex-col items-end gap-2 sm:max-w-[70%] sm:flex-row sm:flex-wrap sm:justify-end">
              {(trend || delta) ? (
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-tighter",
                    tones[tone],
                  )}
                >
                  {trend || delta}
                </div>
              ) : null}
              {headerAccessory ? (
                typeof headerAccessory === "string" || typeof headerAccessory === "number" ? (
                  <span className={headerPillClass}>{headerAccessory}</span>
                ) : (
                  headerAccessory
                )
              ) : null}
            </div>
          )}
        </div>

        <div className={cn("mt-5 space-y-1", uGrid && "shrink-0")}>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
            {label}
          </p>
          <h3
            className={cn(
              "font-display font-extrabold tracking-tight",
              compact ? "text-2xl" : "text-3xl",
            )}
          >
            {value}
          </h3>
          {description && (
            <p
              className={cn(
                "text-[11px] font-medium text-muted-foreground/60",
                uGrid ? "line-clamp-2 min-h-[2.5rem]" : "line-clamp-1",
              )}
            >
              {description}
            </p>
          )}
        </div>

        {uGrid && minimalKpi ? (
          <>
            <div className="flex min-h-0 flex-1 basis-10" aria-hidden />
            {extra ? (
              <div className="shrink-0 border-t border-border/25 pt-4">{extra}</div>
            ) : null}
          </>
        ) : uGrid ? (
          <>
            <div className="mt-3 flex min-h-[32px] shrink-0 items-end justify-end">
              {sparklineEligible && sparkline ? (
                <Sparkline data={sparkline} color={sparklineColors[tone]} width={80} height={28} />
              ) : (
                <div className="h-[28px] w-20 shrink-0" aria-hidden />
              )}
            </div>
            <div className="min-h-0 flex-1 basis-4" aria-hidden />
            <div className="flex min-h-[52px] shrink-0 flex-col justify-center border-t border-border/25 pt-3">
              {extra}
            </div>
          </>
        ) : (
          <>
            {sparklineEligible && sparkline ? (
              <div className="mt-3 flex justify-end">
                <Sparkline data={sparkline} color={sparklineColors[tone]} width={80} height={28} />
              </div>
            ) : null}
            {extra && <div className="mt-4 border-t border-border/20 pt-4">{extra}</div>}
          </>
        )}

        {/* Barra inferior de progresso (omitida quando minimalKpi). */}
        {showMomentumRail ? (
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-muted/20">
            <div
              className={cn("h-full rounded-br-2xl", progressColors[tone])}
              style={{ width: `${resolvedRail}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
