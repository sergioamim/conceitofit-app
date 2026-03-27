"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useStatusBadgeMotion } from "@/lib/ui-motion";
import type {
  AcademiaHealthLevel,
  StatusProspect,
  StatusAluno,
  StatusMatricula,
  StatusPagamento,
  StatusContaPagar,
} from "@/lib/types";

type AnyStatus =
  | StatusProspect
  | StatusAluno
  | StatusMatricula
  | StatusPagamento
  | StatusContaPagar
  | AcademiaHealthLevel;

const STATUS_MAP: Record<
  AnyStatus,
  { label: string; className: string }
> = {
  // Prospect
  NOVO: { label: "Novo", className: "bg-blue-500/15 text-blue-400" },
  EM_CONTATO: { label: "Em contato", className: "bg-yellow-500/15 text-yellow-400" },
  AGENDOU_VISITA: { label: "Agendou visita", className: "bg-orange-500/15 text-orange-400" },
  VISITOU: { label: "Visitou", className: "bg-purple-500/15 text-purple-400" },
  CONVERTIDO: { label: "Convertido", className: "bg-gym-teal/15 text-gym-teal" },
  PERDIDO: { label: "Perdido", className: "bg-gym-danger/15 text-gym-danger" },
  // Aluno
  ATIVO: { label: "Ativo", className: "bg-gym-teal/15 text-gym-teal" },
  INATIVO: { label: "Inativo", className: "bg-muted text-muted-foreground" },
  SUSPENSO: { label: "Suspenso", className: "bg-gym-warning/15 text-gym-warning" },
  CANCELADO: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
  // Matrícula
  ATIVA: { label: "Ativa", className: "bg-gym-teal/15 text-gym-teal" },
  VENCIDA: { label: "Vencida", className: "bg-gym-danger/15 text-gym-danger" },
  CANCELADA: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
  SUSPENSA: { label: "Suspensa", className: "bg-gym-warning/15 text-gym-warning" },
  // Pagamento
  PENDENTE: { label: "Pendente", className: "bg-yellow-500/15 text-yellow-400" },
  PAGO: { label: "Pago", className: "bg-gym-teal/15 text-gym-teal" },
  PAGA: { label: "Paga", className: "bg-gym-teal/15 text-gym-teal" },
  VENCIDO: { label: "Vencido", className: "bg-gym-danger/15 text-gym-danger" },
  // Saúde operacional
  SAUDAVEL: { label: "Saudável", className: "bg-gym-teal/15 text-gym-teal" },
  RISCO: { label: "Risco", className: "bg-gym-warning/15 text-gym-warning" },
  CRITICO: { label: "Crítico", className: "bg-gym-danger/15 text-gym-danger" },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const motionProps = useStatusBadgeMotion();
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <motion.span
      {...motionProps}
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </motion.span>
  );
}
