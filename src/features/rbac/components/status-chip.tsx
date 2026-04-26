import { cn } from "@/lib/utils";

import type { StatusUsuario } from "../api/types";

const STATUS_META: Record<StatusUsuario, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "var(--gym-teal, #1ea06a)" },
  "convite-pendente": { label: "Convite pendente", color: "var(--gym-warning, #e09020)" },
  suspenso: { label: "Suspenso", color: "var(--gym-danger, #dc3545)" },
};

interface StatusChipProps {
  status: StatusUsuario;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
        color: meta.color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}
