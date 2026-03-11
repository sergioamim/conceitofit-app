"use client";

import type { ReactNode } from "react";

type BiMetricCardProps = {
  label: string;
  value: string;
  description?: string;
  delta?: string;
  tone?: "accent" | "teal" | "warning" | "danger";
  extra?: ReactNode;
};

const TONE_CLASS: Record<NonNullable<BiMetricCardProps["tone"]>, string> = {
  accent: "text-gym-accent",
  teal: "text-gym-teal",
  warning: "text-gym-warning",
  danger: "text-gym-danger",
};

export function BiMetricCard({
  label,
  value,
  description,
  delta,
  tone = "accent",
  extra,
}: BiMetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl font-extrabold ${TONE_CLASS[tone]}`}>{value}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      {delta ? <p className="mt-2 text-[11px] font-medium text-muted-foreground">{delta}</p> : null}
      {extra ? <div className="mt-3">{extra}</div> : null}
    </div>
  );
}
