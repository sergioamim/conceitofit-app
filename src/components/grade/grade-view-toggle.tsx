"use client";

import { Columns3, Flame, Focus, LayoutGrid, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type GradeViewMode = "timeline" | "day" | "kanban" | "heatmap";

const OPTIONS: { value: GradeViewMode; label: string; icon: LucideIcon }[] = [
  { value: "timeline", label: "Timeline", icon: LayoutGrid },
  { value: "day", label: "Dia", icon: Focus },
  { value: "kanban", label: "Salas", icon: Columns3 },
  { value: "heatmap", label: "Heatmap", icon: Flame },
];

export interface GradeViewToggleProps {
  value: GradeViewMode;
  onChange: (next: GradeViewMode) => void;
}

export function GradeViewToggle({ value, onChange }: GradeViewToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" /> {opt.label}
          </button>
        );
      })}
    </div>
  );
}
