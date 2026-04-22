"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useStatusBadgeMotion } from "@/lib/ui-motion";
import type {
  AcademiaHealthLevel,
  StatusProspect,
  StatusAluno,
  StatusContrato,
  StatusPagamento,
  StatusContaPagar,
} from "@/lib/types";

type AnyStatus =
  | StatusProspect
  | StatusAluno
  | StatusContrato
  | StatusPagamento
  | StatusContaPagar
  | AcademiaHealthLevel;

const STATUS_MAP: Record<
  AnyStatus,
  { label: string; className: string }
> = {
  // Prospect
  NOVO: { label: "Novo", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  EM_CONTATO: { label: "Em contato", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  AGENDOU_VISITA: { label: "Agendou visita", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  VISITOU: { label: "Visitou", className: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  CONVERTIDO: { label: "Convertido", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  PERDIDO: { label: "Perdido", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
  // Aluno
  ATIVO: { label: "Ativo", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  INATIVO: { label: "Inativo", className: "bg-muted/50 text-muted-foreground border-border/40" },
  SUSPENSO: { label: "Suspenso", className: "bg-gym-warning/10 text-gym-warning border-gym-warning/20" },
  CANCELADO: { label: "Cancelado", className: "bg-muted/50 text-muted-foreground border-border/40" },
  // Bloqueado: acesso suspenso (ex.: inadimplência). Estado distinto de INATIVO/SUSPENSO.
  BLOQUEADO: { label: "Bloqueado", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
  // Matrícula
  ATIVA: { label: "Ativa", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  VENCIDA: { label: "Vencida", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
  CANCELADA: { label: "Cancelada", className: "bg-muted/50 text-muted-foreground border-border/40" },
  SUSPENSA: { label: "Suspensa", className: "bg-gym-warning/10 text-gym-warning border-gym-warning/20" },
  // Pagamento
  PENDENTE: { label: "Pendente", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PAGO: { label: "Pago", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  PAGA: { label: "Paga", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  VENCIDO: { label: "Vencido", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
  // Saúde operacional
  SAUDAVEL: { label: "Saudável", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  RISCO: { label: "Risco", className: "bg-gym-warning/10 text-gym-warning border-gym-warning/20" },
  CRITICO: { label: "Crítico", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({ status, className }: StatusBadgeProps) {
  const motionProps = useStatusBadgeMotion();
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <motion.span
      {...motionProps}
      role="status"
      aria-live="polite"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </motion.span>
  );
});
