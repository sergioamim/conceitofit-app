/**
 * Pill de status visual para contas a pagar/receber. Estende a semântica
 * do `StatusBadge` existente com os 3 estados derivados do design
 * (`hoje`, `proximo`, `agendado`).
 */

import { AlertTriangle, Calendar, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusContaDe, type StatusContaVisual } from "@/lib/finance/contas-status";

const TONES: Record<StatusContaVisual, { bg: string; text: string; border: string }> = {
  pago: {
    bg: "bg-gym-teal/10",
    text: "text-gym-teal",
    border: "border-gym-teal/25",
  },
  vencido: {
    bg: "bg-gym-danger/10",
    text: "text-gym-danger",
    border: "border-gym-danger/25",
  },
  hoje: {
    bg: "bg-gym-warning/10",
    text: "text-gym-warning",
    border: "border-gym-warning/30",
  },
  proximo: {
    bg: "bg-gym-accent/10",
    text: "text-gym-accent",
    border: "border-gym-accent/25",
  },
  agendado: {
    bg: "bg-secondary",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

const LABELS: Record<StatusContaVisual, string> = {
  pago: "Pago",
  vencido: "Vencido",
  hoje: "Vence hoje",
  proximo: "Próximo",
  agendado: "Agendado",
};

function Icon({ status }: { status: StatusContaVisual }) {
  switch (status) {
    case "pago":
      return <CheckCircle2 size={11} strokeWidth={2.5} aria-hidden="true" />;
    case "vencido":
      return <AlertTriangle size={11} strokeWidth={2.5} aria-hidden="true" />;
    case "hoje":
      return <Clock size={11} strokeWidth={2.5} aria-hidden="true" />;
    case "proximo":
      return <Clock size={11} strokeWidth={2.5} aria-hidden="true" />;
    case "agendado":
      return <Calendar size={11} strokeWidth={2.5} aria-hidden="true" />;
  }
}

export type StatusContaPillProps = {
  /**
   * Status como vem do backend (PAGA/PENDENTE/VENCIDA/CANCELADA ou
   * RECEBIDA) ou já derivado para os 5 visuais.
   */
  status: string | StatusContaVisual;
  /** ISO `YYYY-MM-DD` — usado quando `status` é backend + precisa derivar. */
  dataVencimento?: string;
  /** ISO `YYYY-MM-DD` — hoje segundo o tenant. */
  today?: string;
  /** Sobrescreve a label (ex.: "Vencido · 3d"). */
  labelOverride?: string;
  /** Exibe dias de atraso/para vencer quando aplicável. */
  atraso?: number;
  className?: string;
};

function isVisual(s: string): s is StatusContaVisual {
  return s === "pago" || s === "vencido" || s === "hoje" || s === "proximo" || s === "agendado";
}

export function StatusContaPill({
  status,
  dataVencimento,
  today,
  labelOverride,
  atraso,
  className,
}: StatusContaPillProps) {
  const effective: StatusContaVisual = isVisual(status)
    ? status
    : dataVencimento && today
      ? statusContaDe({ status, dataVencimento }, today)
      : "agendado";

  const tone = TONES[effective];
  const label =
    labelOverride ??
    (effective === "vencido" && atraso
      ? `${LABELS[effective]} · ${Math.abs(atraso)}d`
      : LABELS[effective]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold",
        tone.bg,
        tone.text,
        tone.border,
        className,
      )}
    >
      <Icon status={effective} />
      {label}
    </span>
  );
}
