"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
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

export function BiMetricCard({ 
  label, 
  value, 
  description, 
  delta, 
  tone = "accent", 
  extra,
  icon: Icon,
  trend
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="flex-1 min-w-[240px]"
    >
      <div className="glass-card group relative overflow-hidden rounded-2xl border p-6 transition-shadow hover:shadow-xl hover:shadow-primary/5">
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition-transform group-hover:scale-110",
            tones[tone]
          )}>
            {Icon ? <Icon size={20} aria-hidden="true" /> : <TrendingUp size={20} aria-hidden="true" />}
          </div>
          {(trend || delta) && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-tighter",
              tones[tone]
            )}>
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

        {/* Progress indicator line */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-muted/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            className={cn("h-full", progressColors[tone])}
          />
        </div>
      </div>
    </motion.div>
  );
}
