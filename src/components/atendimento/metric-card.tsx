"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: "up" | "down" };
  color?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card px-4 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
            color ?? "bg-gym-teal/10 text-gym-teal",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold leading-none text-foreground">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up"
                    ? "text-gym-teal"
                    : "text-gym-danger",
                )}
              >
                {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
