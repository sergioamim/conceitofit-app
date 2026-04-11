"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp } from "lucide-react";

type BiMetricCardProps = {
  label: string;
  value: string;
  description?: string;
  delta?: string;
  tone?: "accent" | "teal" | "warning" | "danger";
  extra?: ReactNode;
  icon?: LucideIcon;
  trend?: string;
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
}: BiMetricCardProps) {
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

  return (
    <div className="flex-1 min-w-[240px]">
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              tones[tone],
            )}
          >
            {Icon ? <Icon size={20} aria-hidden="true" /> : <TrendingUp size={20} aria-hidden="true" />}
          </div>
          {(trend || delta) && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-tighter",
                tones[tone],
              )}
            >
              {trend || delta}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
            {label}
          </p>
          <h3 className="font-display text-3xl font-extrabold tracking-tight">
            {value}
          </h3>
          {description && (
            <p className="text-[11px] font-medium text-muted-foreground/60 line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {extra && <div className="mt-4 pt-4 border-t border-border/20">{extra}</div>}

        {/* Progress indicator line — width estática, sem framer-motion */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-muted/10">
          <div
            className={cn("h-full w-[65%]", progressColors[tone])}
          />
        </div>
      </div>
    </div>
  );
}
